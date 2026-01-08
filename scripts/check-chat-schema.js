
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

        const chatCollections = collections.filter(c => ['conversations', 'messages'].includes(c.collection));

        if (chatCollections.length === 0) {
            console.log('❌ Chat collections (conversations, messages) NOT FOUND.');
        } else {
            chatCollections.forEach(c => {
                console.log(`✅ Collection found: ${c.collection}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
