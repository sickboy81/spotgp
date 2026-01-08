
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

        console.log('Fetching collections...');
        const collections = await client.request(readCollections());

        const settings = collections.find(c => c.collection === 'system_settings');

        if (settings) {
            console.log('✅ Collection "system_settings" EXISTS.');
        } else {
            console.log('❌ Collection "system_settings" DOES NOT EXIST.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
