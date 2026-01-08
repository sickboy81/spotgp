
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
        const names = collections.map(c => c.collection);

        const required = ['transactions', 'plans', 'user_plans'];

        required.forEach(req => {
            if (names.includes(req)) {
                console.log(`✅ Collection "${req}" exists.`);
            } else {
                console.log(`❌ Collection "${req}" DOES NOT EXIST.`);
            }
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
