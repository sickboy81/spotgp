
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
        const appAccessPolicy = policies.find(p => p.name === 'App Access'); // Our backup
        const publicPolicy = policies.find(p => p.name === '$t:public_label' || p.name === 'Public');

        let targetPolicyId = null;

        // 2. Determine Target Policy for "App User"
        const currentPolicies = appUserRole.policies || [];

        if (currentPolicies.length > 0) {
            // Use existing policy
            // Check if it is a string or object (Directus sometimes expands)
            const firstPolicy = currentPolicies[0];
            targetPolicyId = typeof firstPolicy === 'string' ? firstPolicy : firstPolicy.id;
            console.log(`Using EXISTING policy attached to role: ${targetPolicyId}`);
        } else {
            // Try to attach "App Access"
            if (!appAccessPolicy) throw new Error('No existing policy on role AND "App Access" policy not found.');

            targetPolicyId = appAccessPolicy.id;
            console.log(`No policy on role. Attaching "App Access" (${targetPolicyId})...`);

            await client.request(updateRole(appUserRole.id, {
                policies: [targetPolicyId]
            }));
            console.log('✅ Attached.');
        }

        // 3. Add Permissions to Target Policy
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

        console.log(`--- Updating Permissions for Policy ${targetPolicyId} ---`);
        for (const p of appPermissions) {
            console.log(`Granting ${p.action} on ${p.collection}...`);
            try {
                await client.request(createPermission({
                    policy: targetPolicyId,
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
        const publicPolicyId = publicPolicy?.id;

        if (publicPolicyId) {
            console.log(`--- Updating "Public" Permissions (Policy ${publicPolicyId}) ---`);
            const publicPerms = [
                { collection: 'profiles', action: 'read' }
            ];

            for (const p of publicPerms) {
                console.log(`Granting ${p.action} on ${p.collection} to Public...`);
                try {
                    await client.request(createPermission({
                        policy: publicPolicyId,
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
        } else {
            console.log('⚠️ Public Policy not found, skipping Public fix.');
        }

        console.log('DONE! Permissions fixed.');

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
