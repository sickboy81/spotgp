
import { createDirectus, rest, authentication, readItems, createItem, updateItem, readSingleton, updateSingleton } from '@directus/sdk';
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

        // Test updateSingleton
        console.log('Testing updateSingleton("system_settings")...');
        try {
            const result = await client.request(updateSingleton('system_settings', {
                site_name: 'Updated via Script'
            }));
            console.log('✅ updateSingleton success:', result);
        } catch (e) {
            console.error('❌ updateSingleton failed:', e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
