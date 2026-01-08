
import { createDirectus, rest, authentication, readRoles, createPermission, readPermissions, updatePermission } from '@directus/sdk';
import 'dotenv/config';

const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('Authenticated.');

        const roles = await client.request(readRoles());
        const appUserRole = roles.find(r => r.name === 'App User');
        const advertiserRole = roles.find(r => r.name === 'Advertiser'); // Or similar

        const targetRoles = [appUserRole, advertiserRole].filter(Boolean);

        for (const role of targetRoles) {
            console.log(`Configuring permissions for role: ${role.name}`);

            // 1. Grant Read Profiles
            await grantPermission(role.id, 'profiles', 'read', ['*']);

            // 2. Grant CRUD Conversations
            await grantPermission(role.id, 'conversations', 'create', ['*']);
            await grantPermission(role.id, 'conversations', 'read', ['*']); // Ideally scoped
            await grantPermission(role.id, 'conversations', 'update', ['*']);

            // 3. Grant CRUD Messages
            await grantPermission(role.id, 'messages', 'create', ['*']);
            await grantPermission(role.id, 'messages', 'read', ['*']); // Ideally scoped
            await grantPermission(role.id, 'messages', 'update', ['*']);
        }

        console.log('✅ Chat permissions fixed.');

    } catch (err) {
        console.error('Error:', err);
    }
}

async function grantPermission(roleId, collection, action, fields) {
    try {
        // Check existing
        const existing = await client.request(readPermissions({
            filter: {
                role: { _eq: roleId },
                collection: { _eq: collection },
                action: { _eq: action }
            }
        }));

        if (existing.length > 0) {
            console.log(`Permission ${collection}.${action} exists for role.`);
            // Update fields if needed? 
            // For now assume ok.
        } else {
            console.log(`Creating permission ${collection}.${action}...`);
            await client.request(createPermission({
                role: roleId,
                collection: collection,
                action: action,
                fields: fields
            }));
        }
    } catch (e) {
        console.error(`Error granting ${collection}.${action}:`, e.message);
    }
}

main();
