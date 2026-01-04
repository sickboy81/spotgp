import { createDirectus, rest, readPolicies, readPermissions, readRoles, readUsers } from '@directus/sdk';

const URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'egeohub101@gmail.com';
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '041052.11setemB';

const client = createDirectus(URL).with(rest());

async function main() {
    try {
        // Login
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

        // Create authenticated client with static token
        const authClient = createDirectus(URL).with(rest()).with(
            (() => ({
                beforeRequest: (config) => {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${token}`;
                    return config;
                }
            }))()
        );

        console.log('✅ Logged in.\n');

        // 1. Find App User role
        const roles = await authClient.request(readRoles({ filter: { name: { _eq: 'App User' } } }));
        if (!roles.length) {
            console.error('❌ App User role not found!');
            return;
        }
        const appUserRole = roles[0];
        console.log(`📋 App User Role: ${appUserRole.id}`);
        console.log(`   Policies: ${JSON.stringify(appUserRole.policies)}\n`);

        // 2. Check all policies
        const allPolicies = await authClient.request(readPolicies({ limit: -1 }));
        console.log(`📜 All Policies:`);
        allPolicies.forEach(p => {
            console.log(`   - ${p.name} (ID: ${p.id})`);
        });
        console.log('');

        // 3. Check permissions for the Ghost Policy
        const GHOST_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';
        const permissions = await authClient.request(
            readPermissions({
                filter: { policy: { _eq: GHOST_ID } },
                limit: -1
            })
        );

        console.log(`\n🔐 Permissions for Policy ${GHOST_ID}:`);
        if (permissions.length === 0) {
            console.log('   ❌ NO PERMISSIONS FOUND!');
        } else {
            permissions.forEach(perm => {
                console.log(`   - ${perm.collection}.${perm.action}: fields=${perm.fields || 'NULL'}, permissions=${perm.permissions || 'NULL'}`);
            });
        }

        // 4. Check permissions for Public policy
        const publicPolicies = allPolicies.filter(p => p.name.includes('public') || p.name.includes('Public'));
        if (publicPolicies.length > 0) {
            console.log(`\n🌍 Public Policy: ${publicPolicies[0].id}`);
            const publicPerms = await authClient.request(
                readPermissions({
                    filter: { policy: { _eq: publicPolicies[0].id } },
                    limit: -1
                })
            );
            publicPerms.forEach(perm => {
                console.log(`   - ${perm.collection}.${perm.action}`);
            });
        }

        console.log('\n✅ Diagnosis complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Details:', JSON.stringify(error.errors, null, 2));
        }
    }
}

main();
