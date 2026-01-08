
import { createDirectus, rest, authentication, readCollections } from '@directus/sdk';
import 'dotenv/config';

// Fix URL if needed
const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({
            email: process.env.DIRECTUS_ADMIN_EMAIL,
            password: process.env.DIRECTUS_ADMIN_PASSWORD
        });

        const collections = await client.request(readCollections());
        const names = collections.map(c => c.collection).sort();
        console.log('Collections:', names);

        if (names.includes('transactions')) {
            console.log('✅ Transactions collection exists.');
        } else {
            console.log('❌ Missing Transactions collection.');
        }

    } catch (err) {
        console.error(err);
    }
}

main();
