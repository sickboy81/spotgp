
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

        console.log('Creating field "priority" in profiles...');
        await client.request(createField('profiles', {
            field: 'priority',
            type: 'integer',
            schema: {
                default_value: 0
            },
            meta: {
                interface: 'input',
                display: 'raw',
                width: 'half'
            }
        }));
        console.log('✅ Field created.');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
