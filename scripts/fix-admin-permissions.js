
import { createDirectus, rest, authentication, createPermission, readPermissions, updatePermission } from '@directus/sdk';
import 'dotenv/config';

const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const ADMIN_ROLE_ID = 'c00621c8-8b08-4910-87fe-fad197308764'; // From previous step

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function grantFullAccess(collection) {
    console.log(`Granting full access on ${collection} to Admin...`);
    try {
        // Check existing
        const existing = await client.request(readPermissions({
            filter: {
                role: { _eq: ADMIN_ROLE_ID },
                collection: { _eq: collection }
            }
        }));

        const actions = ['create', 'read', 'update', 'delete'];

        for (const action of actions) {
            const perm = existing.find(p => p.action === action);
            if (perm) {
                console.log(`- Updating existing ${action} permission...`);
                await client.request(updatePermission(perm.id, {
                    fields: ['*']
                }));
            } else {
                console.log(`- Creating ${action} permission...`);
                await client.request(createPermission({
                    role: ADMIN_ROLE_ID,
                    collection: collection,
                    action: action,
                    fields: ['*'] // Full field access
                }));
            }
        }
    } catch (err) {
        console.error(`Error granting access on ${collection}:`, err.message);
    }
}

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated.');

        // Grant access to critical collections
        await grantFullAccess('profiles');
        await grantFullAccess('directus_files');
        await grantFullAccess('directus_activity');
        await grantFullAccess('directus_users');
        await grantFullAccess('reports');
        await grantFullAccess('plans');
        await grantFullAccess('subscriptions');
        await grantFullAccess('transactions');

        console.log('✅ Admin permissions patched.');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
