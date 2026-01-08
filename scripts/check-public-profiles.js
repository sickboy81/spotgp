
import { createDirectus, rest, authentication, readPermissions } from '@directus/sdk';
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

        console.log('Checking PUBLIC permissions for profiles...');
        const perms = await client.request(readPermissions({
            filter: {
                role: { _null: true },
                collection: { _eq: 'profiles' }
            }
        }));

        if (perms.length === 0) {
            console.log('❌ No Public permissions for profiles.');
        } else {
            console.log('✅ Public permissions found:');
            perms.forEach(p => {
                console.log(`Action: ${p.action}, Fields: ${p.fields}`);
                if (p.permissions) console.log('Rule:', JSON.stringify(p.permissions));
            });
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
