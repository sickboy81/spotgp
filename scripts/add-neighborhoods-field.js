
import { createDirectus, rest, authentication, readField, createField } from '@directus/sdk';
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
        console.log('Connecting to', URL, '...');
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('Logged in.');

        const collection = 'profiles';
        const fieldName = 'service_neighborhoods';

        try {
            await client.request(readField(collection, fieldName));
            console.log(`✅ Field ${fieldName} already exists.`);
        } catch (error) {
            console.log(`Field ${fieldName} not found, creating...`);
            await client.request(createField(collection, {
                field: fieldName,
                type: 'json',
                meta: {
                    interface: 'tags',
                    options: {
                        placeholder: 'Digite ou selecione os bairros...'
                    },
                    display: 'labels',
                    display_options: {
                        showAsDot: false
                    },
                    width: 'full',
                    note: 'Bairros onde o anunciante atende'
                },
                schema: {
                    comment: 'Bairros onde o anunciante atende (array de strings)'
                }
            }));
            console.log(`✅ Field ${fieldName} created.`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
