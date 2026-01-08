
import { createDirectus, rest, authentication, readPermissions, createPermission, updatePermission } from '@directus/sdk';
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
        console.log('✅ Authenticated.');

        // 1. Check Public Permissions for 'profiles'
        console.log('Checking Public permissions for profiles...');
        const publicPerms = await client.request(readPermissions({
            filter: {
                role: { _null: true },
                collection: { _eq: 'profiles' },
                action: { _eq: 'read' }
            }
        }));

        if (publicPerms.length > 0) {
            console.log('Public Read Permission found.');
            const perm = publicPerms[0];
            console.log('Existing Fields:', perm.fields);

            // If fields is specific list, we might need to add 'role'
            if (Array.isArray(perm.fields) && !perm.fields.includes('*') && !perm.fields.includes('role')) {
                console.log('Adding "role" to public permissions...');
                await client.request(updatePermission(perm.id, {
                    fields: [...perm.fields, 'role', 'user']
                }));
                console.log('✅ Public permissions updated.');
            } else if (perm.fields === null || (Array.isArray(perm.fields) && perm.fields.includes('*'))) {
                console.log('Public has access to all fields (*).');
            }
        } else {
            console.log('❌ No Public Read Permission found. Creating...');
            await client.request(createPermission({
                role: null,
                collection: 'profiles',
                action: 'read',
                fields: ['*']
            }));
            console.log('✅ Public Read Permission created.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
