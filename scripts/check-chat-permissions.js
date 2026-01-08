
import { createDirectus, rest, authentication, readPermissions, readRoles } from '@directus/sdk';
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

        const roles = await client.request(readRoles());
        console.log('Roles:', roles.map(r => `${r.name} (${r.id})`));

        const permissions = await client.request(readPermissions({ limit: -1 }));

        ['conversations', 'messages'].forEach(collection => {
            console.log(`\n--- Permissions for ${collection} ---`);
            const collPerms = permissions.filter(p => p.collection === collection);

            if (collPerms.length === 0) {
                console.log('No specific permissions found.');
            } else {
                collPerms.forEach(p => {
                    const roleName = roles.find(r => r.id === p.role)?.name || 'Public/Unknown';
                    console.log(`Role: ${roleName}, Action: ${p.action}, Fields: ${p.fields}`);
                });
            }
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
