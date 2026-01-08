
import { createDirectus, rest, authentication, readRoles, createPermission } from '@directus/sdk';
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
        // Advertiser might be same role or different? Let's check names.
        // Earlier log showed 'App User'. I'll assume that's the main one.

        if (!appUserRole) {
            console.log('App User role not found.');
            return;
        }

        const roleId = appUserRole.id;
        console.log(`Configuring permissions for role: ${roleId} (App User)`);

        // List of permissions to grant
        const perms = [
            { collection: 'profiles', action: 'read', fields: ['*'] },
            { collection: 'conversations', action: 'create', fields: ['*'] },
            { collection: 'conversations', action: 'read', fields: ['*'] },
            { collection: 'conversations', action: 'update', fields: ['*'] },
            { collection: 'messages', action: 'create', fields: ['*'] },
            { collection: 'messages', action: 'read', fields: ['*'] }, // nested fields handled by readItems?
            { collection: 'messages', action: 'update', fields: ['*'] }
        ];

        for (const p of perms) {
            try {
                console.log(`Creating permission ${p.collection}.${p.action}...`);
                await client.request(createPermission({
                    role: roleId,
                    collection: p.collection,
                    action: p.action,
                    fields: p.fields
                }));
                console.log(`✅ Granted ${p.collection}.${p.action}`);
            } catch (e) {
                // If error contains "unique" or "duplicate", it exists.
                if (e.errors?.some(err => err.message?.includes('unique') || err.code === 'RECORD_NOT_UNIQUE')) {
                    console.log(`⚠️ Permission ${p.collection}.${p.action} already exists (Duplicate).`);
                } else if (e.message?.includes('Forbidden')) {
                    console.error(`❌ Forbidden to grant ${p.collection}.${p.action}. Admin Access needed.`);
                } else {
                    console.error(`❌ Error granting ${p.collection}.${p.action}: ${e.message}`);
                    if (e.errors) console.log(JSON.stringify(e.errors, null, 2));
                }
            }
        }

        console.log('Use script check-chat-permissions.js to verify if they took effect.');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
