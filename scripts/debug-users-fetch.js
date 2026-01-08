
import { createDirectus, rest, authentication, readItems } from '@directus/sdk';
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

        console.log('Fetching profiles with UserManagement fields...');
        const records = await client.request(readItems('profiles', {
            limit: 5,
            fields: [
                'id', 'display_name', 'date_created', 'verified', 'verification_status',
                'phone', 'avatar', 'location', 'bio',
                'user.email', 'user.id', 'user.first_name', 'user.last_name', 'user.role.name'
            ]
        }));

        console.log(`Fetched ${records.length} records.`);

        if (records.length > 0) {
            console.log('Sample Record:', JSON.stringify(records[0], null, 2));
        } else {
            // Try fetching WITHOUT nested user fields to see if that works
            console.log('Zero records with user fields. Retrying basic fetch...');
            const basic = await client.request(readItems('profiles', { limit: 5 }));
            console.log(`Basic fetch found ${basic.length} records. (If > 0, nested fields are breaking it)`);
        }

    } catch (err) {
        console.error('Error fetching users:', err);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
}

main();
