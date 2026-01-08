
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

        // 1. Grant Public Read (so frontend can see site name/maintenance mode)
        console.log('Granting Public Read...');
        try {
            await client.request(createPermission({
                role: null, // Public
                collection: 'system_settings',
                action: 'read',
                fields: ['*']
            }));
            console.log('✅ Public Read granted.');
        } catch (e) {
            console.log(`⚠️ Public Read: ${e.message}`);
        }

        // 2. Grant Admin Update (if needed, usually Admin implies everything but good to be sure if Admin Access is broken)
        // Find Admin Role
        const roles = await client.request(readRoles());
        const adminRole = roles.find(r => r.name === 'Administrator');

        if (adminRole) {
            console.log('Granting Admin Update...');
            try {
                await client.request(createPermission({
                    role: adminRole.id,
                    collection: 'system_settings',
                    action: 'update',
                    fields: ['*']
                }));
                console.log('✅ Admin Update granted.');
            } catch (e) {
                console.log(`⚠️ Admin Update: ${e.message}`);
            }
            try {
                await client.request(createPermission({
                    role: adminRole.id,
                    collection: 'system_settings',
                    action: 'read',
                    fields: ['*']
                }));
                console.log('✅ Admin Read granted.');
            } catch (e) {
                console.log(`⚠️ Admin Read: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
