
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

        console.log('Reading "photos" from profiles...');
        const profiles = await client.request(readItems('profiles', {
            limit: 5,
            fields: ['display_name', 'photos', 'avatar']
        }));

        profiles.forEach(p => {
            console.log(`User: ${p.display_name}`);
            console.log(`- Avatar:`, p.avatar);
            console.log(`- Photos (${typeof p.photos}):`, JSON.stringify(p.photos, null, 2));
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
