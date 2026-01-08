
import { createDirectus, rest, authentication, createField } from '@directus/sdk';
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

        console.log('Creating contact preference fields in profiles...');

        const fields = [
            { field: 'accepts_calls', type: 'boolean', schema: { default_value: true }, meta: { note: 'Accepts phone calls' } },
            { field: 'accepts_whatsapp', type: 'boolean', schema: { default_value: true }, meta: { note: 'Accepts WhatsApp' } },
            { field: 'accepts_telegram', type: 'boolean', schema: { default_value: true }, meta: { note: 'Accepts Telegram' } },
        ];

        for (const f of fields) {
            try {
                await client.request(createField('profiles', f));
                console.log(`✅ Field ${f.field} created.`);
            } catch (e) {
                console.log(`⚠️ Field ${f.field} error (maybe exists):`, e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
