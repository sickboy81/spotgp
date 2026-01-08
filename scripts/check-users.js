
import { createDirectus, rest, authentication, readItems, readUsers } from '@directus/sdk';
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
        console.log(`Connecting to ${URL}...`);
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated.');

        // Check Profiles
        try {
            const profiles = await client.request(readItems('profiles'));
            console.log(`Found ${profiles.length} profiles.`);
            if (profiles.length > 0) {
                console.log('First profile sample:', JSON.stringify(profiles[0], null, 2));
            }
        } catch (e) {
            console.error('Error reading profiles:', e.message);
        }

        // Check Users (directus_users)
        try {
            const users = await client.request(readUsers());
            console.log(`Found ${users.length} system users.`);
            if (users.length > 0) {
                console.log('First user sample:', JSON.stringify(users[0], null, 2));
            }
        } catch (e) {
            console.error('Error reading users:', e.message);
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
