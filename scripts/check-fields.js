
import { createDirectus, rest, authentication, readFields } from '@directus/sdk';
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

        console.log('Reading fields for profiles...');
        const fields = await client.request(readFields('profiles'));
        const fieldNames = fields.map(f => f.field);

        console.log('Fields:', fieldNames.join(', '));

        if (fieldNames.includes('role')) {
            console.log('✅ Field "role" exists.');
        } else {
            console.log('❌ Field "role" DOES NOT EXIST.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
