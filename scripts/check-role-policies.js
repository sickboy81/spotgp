
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

        const fields = await client.request(readFields('directus_roles'));
        const policyField = fields.find(f => f.field === 'policies');

        if (policyField) {
            console.log('✅ Role has "policies" field.');
        } else {
            console.log('❌ Role does NOT have "policies" field. Maybe it is "policy"?');
            const allFields = fields.map(f => f.field);
            console.log('Fields:', allFields.join(', '));
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
