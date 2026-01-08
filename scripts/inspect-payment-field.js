
import { createDirectus, rest, authentication, readField } from '@directus/sdk';
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

        try {
            const field = await client.request(readField('profiles', 'payment_methods'));
            console.log('✅ Field payment_methods found.');
            console.log('Type:', field.type);
            console.log('Interface:', field.meta?.interface);
            console.log('Options:', JSON.stringify(field.meta?.options, null, 2));
        } catch (e) {
            console.log('❌ Field payment_methods NOT found:', e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
