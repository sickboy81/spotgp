
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

        // Test 1: readItems
        console.log('Testing readItems("system_settings")...');
        try {
            const records = await client.request(readItems('system_settings', { limit: 1 }));
            console.log('✅ readItems success:', records);
        } catch (e) {
            console.error('❌ readItems failed:', e.message);
        }

        // Test 2: readSingleton (alternative)
        console.log('Testing readSingleton("system_settings")...');
        try {
            const record = await client.request(readSingleton('system_settings'));
            console.log('✅ readSingleton success:', record);
        } catch (e) {
            console.error('❌ readSingleton failed:', e.message);
        }

        // Test 3: updateItem (if id exists) or createItem
        // We'll try to update if we found something, or create if empty
        // But first let's see which one works.

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
