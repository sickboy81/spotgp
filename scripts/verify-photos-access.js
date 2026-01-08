
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

        console.log('Reading profiles (limit 5)...');
        // Removing explicit fields to see if '*' works or specific subset works
        const profiles = await client.request(readItems('profiles', {
            limit: 5,
            fields: ['id', 'display_name', 'photos']
        }));

        console.log(`Read ${profiles.length} profiles.`);
        profiles.forEach(p => {
            if (p.photos) {
                console.log(`User: ${p.display_name} has photos.`);
                console.log(JSON.stringify(p.photos));
            }
        });

    } catch (err) {
        console.error('Error:', err);
        // If error, try reading without 'photos' to verify access to collection at all
        try {
            console.log('Retrying without "photos" field...');
            const basic = await client.request(readItems('profiles', { limit: 1, fields: ['id'] }));
            console.log('Basic read success:', basic[0].id);
        } catch (e2) {
            console.error('Basic read failed:', e2);
        }
    }
}

main();
