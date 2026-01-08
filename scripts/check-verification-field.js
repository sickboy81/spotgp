
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

        console.log('Fetching fields for profiles...');
        const fields = await client.request(readFields('profiles'));
        const statusField = fields.find(f => f.field === 'verification_status');

        if (statusField) {
            console.log('Verification Status details:', JSON.stringify(statusField, null, 2));
            if (statusField.schema?.possible_values) { // Older Directus?
                console.log('Possible values (schema):', statusField.schema.possible_values);
            }
            if (statusField.meta?.options?.choices) { // Newer Directus
                console.log('Choices (meta):', JSON.stringify(statusField.meta.options.choices, null, 2));
            }
        } else {
            console.log('Field verification_status not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
