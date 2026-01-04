
import { createDirectus, rest, authentication, readRoles, updateRole, createPermission, readPolicies } from '@directus/sdk';
import 'dotenv/config';

// Load env vars
const URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

console.log(`Connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        if (!EMAIL || !PASSWORD) throw new Error('Missing credentials');

        // Login
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const json = await response.json();
        await client.setToken(json.data.access_token);
        console.log('Logged in.');

        // 1. Identify IDs
        const roles = await client.request(readRoles({ filter: { name: { _eq: 'App User' } } }));
        const appUserRole = roles[0];
        if (!appUserRole) throw new Error('App User role not found');

        const policies = await client.request(readPolicies());
        const appAccessPolicy = policies.find(p => p.name === 'App Access');

        if (!appAccessPolicy) throw new Error('"App Access" Policy not found!');

        const validPolicyId = appAccessPolicy.id; // 3043...
        console.log(`Using Valid "App Access" Policy ID: ${validPolicyId}`);

        // 2. FORCE ATTACH "App Access" to Role
        // We replace whatever garbage was there.
        console.log(`Forcing "App Access" policy on "App User" role...`);
        await client.request(updateRole(appUserRole.id, {
            policies: [validPolicyId]
        }));
        console.log('✅ Role updated with correct policy.');

        // 3. Add Permissions to "App Access" Policy
        const appPermissions = [
            // System
            { collection: 'directus_roles', action: 'read' },
            { collection: 'directus_users', action: 'read' },
            // App
            { collection: 'profiles', action: 'read' },
            { collection: 'profiles', action: 'create' },
            { collection: 'profiles', action: 'update' },

            { collection: 'notifications', action: 'read' },
            { collection: 'notifications', action: 'update' },

            { collection: 'profile_views', action: 'create' },
            { collection: 'profile_views', action: 'read' },

            { collection: 'profile_clicks', action: 'create' },
            { collection: 'profile_clicks', action: 'read' },
        ];

        console.log(`--- Updating Permissions for Policy ${validPolicyId} ---`);
        for (const p of appPermissions) {
            console.log(`Granting ${p.action} on ${p.collection}...`);
            try {
                await client.request(createPermission({
                    policy: validPolicyId,
                    collection: p.collection,
                    action: p.action,
                    fields: ['*']
                }));
                console.log('✅ Granted.');
            } catch (e) {
                if (e.errors?.some(err => err.extensions?.code === 'RECORD_NOT_UNIQUE')) {
                    console.log('ℹ️ Already exists.');
                } else {
                    console.log(`⚠️ Warning: ${e.message}`);
                }
            }
        }

        console.log('DONE! App User permissions fixed.');

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
