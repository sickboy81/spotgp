
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
        const appUserRole = roles.find(r => r.name === 'App User');

        if (!appUserRole) {
            console.log('App User role not found.');
            return;
        }

        const permissions = await client.request(readPermissions({
            filter: { role: { _eq: appUserRole.id }, collection: { _eq: 'profiles' } },
            limit: -1
        }));

        console.log(`--- Permissions for profiles (Role: App User) ---`);
        if (permissions.length === 0) {
            console.log('No specific permissions found (inherits nothing?).');
        } else {
            const publicPerms = await client.request(readPermissions({
                filter: { role: { _null: true }, collection: { _eq: 'profiles' } }
            }));
            console.log('Public permissions (fallback):', publicPerms.length > 0 ? 'Exists' : 'None');

            permissions.forEach(p => {
                console.log(`Action: ${p.action}, Fields: ${p.fields}`);
                if (p.permissions) {
                    console.log('Rule:', JSON.stringify(p.permissions, null, 2));
                }
            });
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
