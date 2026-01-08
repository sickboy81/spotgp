
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

        console.log('Inspecting profile_views...');
        try {
            const views = await client.request(readItems('profile_views', { limit: 5 }));
            console.log('Views Sample:', JSON.stringify(views[0], null, 2));
        } catch (e) { console.log('Error reading profile_views:', e.message); }

        console.log('Inspecting profile_clicks...');
        try {
            const clicks = await client.request(readItems('profile_clicks', { limit: 5 }));
            console.log('Clicks Sample:', JSON.stringify(clicks[0], null, 2));
        } catch (e) { console.log('Error reading profile_clicks:', e.message); }

        console.log('Inspecting profiles categories...');
        const profiles = await client.request(readItems('profiles', { limit: 1 }));
        console.log('Profile Sample:', JSON.stringify(profiles[0], null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
