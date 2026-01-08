
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

        console.log('Creating payment_methods field in profiles...');

        // Using 'json' type for array of strings is standard for multi-select in Directus logic we use here
        const field = {
            field: 'payment_methods',
            type: 'json',
            schema: { default_value: [] },
            meta: {
                note: 'Accepted payment methods',
                interface: 'select-multiple-dropdown', // Admin UI hint
                options: {
                    choices: [
                        { text: 'PIX', value: 'PIX' },
                        { text: 'Dinheiro', value: 'Dinheiro' },
                        { text: 'Cartão de Débito', value: 'Cartão de Débito' },
                        { text: 'Cartão de Crédito', value: 'Cartão de Crédito' },
                        { text: 'Paypal', value: 'Paypal' }
                    ]
                }
            }
        };

        try {
            await client.request(createField('profiles', field));
            console.log(`✅ Field payment_methods created.`);
        } catch (e) {
            console.log(`⚠️ Field payment_methods error (maybe exists):`, e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
