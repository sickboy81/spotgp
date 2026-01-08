
import { createDirectus, rest, authentication, aggregate } from '@directus/sdk';
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

        console.log('Aggregating directus_users...');
        const result = await client.request(aggregate('directus_users', {
            aggregate: { count: '*' }
        }));

        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
