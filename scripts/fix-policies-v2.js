
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
        const publicPolicy = policies.find(p => p.name === '$t:public_label' || p.name === 'Public');

        if (!appAccessPolicy) throw new Error('"App Access" Policy not found. Please create it manually if needed, but it should exist.');
        if (!publicPolicy) console.log('⚠️ Public Policy not found by name, skipping public fix.');

        const appPolicyId = appAccessPolicy.id;
        const publicPolicyId = publicPolicy?.id;

        console.log(`App User Role: ${appUserRole.id}`);
        console.log(`App Access Policy: ${appPolicyId}`);
        console.log(`Public Policy: ${publicPolicyId || 'NOT FOUND'}`);

        // 2. Attach "App Access" Policy to "App User" Role if missing
        const currentPolicies = appUserRole.policies || [];
        if (!currentPolicies.includes(appPolicyId)) {
            console.log(`Attaching "App Access" policy to "App User" role...`);
            await client.request(updateRole(appUserRole.id, {
                policies: [...currentPolicies, appPolicyId]
            }));
            console.log('✅ Attached.');
        } else {
            console.log('ℹ️ "App Access" policy already attached to role.');
        }

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

        console.log(`--- Updating "App Access" Permissions ---`);
        for (const p of appPermissions) {
            console.log(`Granting ${p.action} on ${p.collection}...`);
            try {
                await client.request(createPermission({
                    policy: appPolicyId,
                    collection: p.collection,
                    action: p.action,
                    fields: ['*']
                }));
                console.log('✅ Granted.');
            } catch (e) {
                // Ignore conflict
                if (e.errors?.some(err => err.extensions?.code === 'RECORD_NOT_UNIQUE')) {
                    console.log('ℹ️ Already exists.');
                } else {
                    console.log(`⚠️ Warning: ${e.message}`);
                }
            }
        }

        // 4. Add Permissions to "Public Access" Policy (Home Page)
        if (publicPolicyId) {
            console.log(`--- Updating "Public" Permissions ---`);
            const publicPerms = [
                { collection: 'profiles', action: 'read' },
                // Maybe read users if relational data needs it?
                // { collection: 'directus_users', action: 'read' } // Risky for public? Maybe limited fields.
                // Let's stick to profiles first.
            ];

            for (const p of publicPerms) {
                console.log(`Granting ${p.action} on ${p.collection} to Public...`);
                try {
                    await client.request(createPermission({
                        policy: publicPolicyId,
                        collection: p.collection,
                        action: p.action,
                        fields: ['*'] // Use '*' for simplicity on profiles
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
        }

        console.log('DONE! Permissions fixed.');

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
