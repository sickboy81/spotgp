
import { createDirectus, rest, authentication, readRoles, readMe } from '@directus/sdk';
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

        const me = await client.request(readMe({ fields: ['*', 'role.*'] }));
        console.log('Current User Role:', me.role?.name, 'ID:', me.role?.id);

        console.log('Listing all roles...');
        const roles = await client.request(readRoles());
        roles.forEach(r => {
            console.log(`- ${r.name} (${r.id}) Admin Access: ${r.admin_access}`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
