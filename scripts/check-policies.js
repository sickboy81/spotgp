
import { createDirectus, rest, authentication, readCollections } from '@directus/sdk';
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

        const collections = await client.request(readCollections());
        const policyColl = collections.find(c => c.collection === 'directus_policies');

        if (policyColl) {
            console.log('✅ directus_policies collection exists. Using Policy-based permissions.');
        } else {
            console.log('❌ directus_policies NOT found. Using Role-based permissions?');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
