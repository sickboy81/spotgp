
import { createDirectus, rest, authentication, updateRole } from '@directus/sdk';
import 'dotenv/config';

const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const ADMIN_ROLE_ID = 'c00621c8-8b08-4910-87fe-fad197308764';

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated.');

        console.log(`Attempting to set admin_access=true on role ${ADMIN_ROLE_ID}...`);

        await client.request(updateRole(ADMIN_ROLE_ID, {
            admin_access: true
        }));

        console.log('✅ Role updated successfully. You should now be Super Admin.');

    } catch (err) {
        console.error('Error updating role:', err);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
}

main();
