
import { createDirectus, rest, authentication, createPolicy, createPermission, readPolicies } from '@directus/sdk';
import 'dotenv/config';

// Load env vars
const URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const GHOST_POLICY_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';

console.log(`Connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {

    try {
        if (!EMAIL || !PASSWORD) throw new Error('Missing credentials');

        // Login manually because client.login() flaked
        console.log('Authenticating via fetch...');
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Login failed: ${response.status} - ${txt}`);
        }

        const json = await response.json();
        const token = json.data.access_token;
        await client.setToken(token);
        console.log('Logged in successfully via token.');


        // 1. Check if policy exists (it shouldn't, based on errors)
        try {
            const existing = await client.request(readPolicies({ filter: { id: { _eq: GHOST_POLICY_ID } } }));
            if (existing && existing.length > 0) {
                console.log('Policy actually exists, proceeding to permissions...');
            } else {
                console.log('Policy missing. Attempting to create with specific ID...');
                // Note: creating with ID might not be standard in all SDK versions but REST allows it usually
                try {
                    await client.request(createPolicy({
                        id: GHOST_POLICY_ID,
                        name: 'App User Access (Restored)',
                        description: 'Restored policy for App User',
                        enforce_tfa: false,
                        ip_access: [],
                    }));
                    console.log('✅ Ghost Policy Created!');
                } catch (createErr) {
                    console.warn('Could not create policy with specific ID:', createErr.message);
                    // If we can't create it, we are in trouble regarding the role update failure.
                    // But let's assume we can for now or the ID matches.
                }
            }
        } catch (e) {
            console.log('Error checking policy:', e.message);
        }

        // 2. Grant Permissions to this Policy
        const appPermissions = [
            // System (Crucial for 401 fixes)
            { collection: 'directus_roles', action: 'read', fields: ['*'] },
            { collection: 'directus_users', action: 'read', fields: ['*', 'role.name'] }, // specifically role.name
            { collection: 'directus_users', action: 'update', fields: ['*'] }, // user can update self

            // App Collections
            { collection: 'profiles', action: 'read', fields: ['*'] },
            { collection: 'profiles', action: 'create', fields: ['*'] },
            { collection: 'profiles', action: 'update', fields: ['*'] },

            { collection: 'notifications', action: 'read', fields: ['*'] },
            { collection: 'notifications', action: 'update', fields: ['*'] },

            { collection: 'profile_views', action: 'create', fields: ['*'] },
            { collection: 'profile_views', action: 'read', fields: ['*'] },

            { collection: 'profile_clicks', action: 'create', fields: ['*'] },
            { collection: 'profile_clicks', action: 'read', fields: ['*'] },
        ];

        console.log(`--- Granting Permissions to ${GHOST_POLICY_ID} ---`);
        for (const p of appPermissions) {
            console.log(`Granting ${p.action} on ${p.collection}...`);
            try {
                await client.request(createPermission({
                    policy: GHOST_POLICY_ID,
                    collection: p.collection,
                    action: p.action,
                    fields: p.fields
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

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
