
import { createDirectus, rest, authentication, readItems } from '@directus/sdk';
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

        console.log('Testing filter: { ad_id: { _nnull: true } }');
        try {
            const items = await client.request(readItems('profiles', {
                filter: { ad_id: { _nnull: true } },
                limit: 5
            }));
            console.log(`✅ Success. Found ${items.length} items.`);
        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
        }

        console.log('Testing filter: { ad_id: { _null: false } }');
        try {
            const items = await client.request(readItems('profiles', {
                filter: { ad_id: { _null: false } },
                limit: 5
            }));
            console.log(`✅ Success. Found ${items.length} items.`);
        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
