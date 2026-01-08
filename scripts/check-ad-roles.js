
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

        console.log('Checking profiles roles...');

        const profiles = await client.request(readItems('profiles', {
            limit: -1,
            fields: ['id', 'display_name', 'role']
        }));

        console.log(`Total Profiles: ${profiles.length}`);

        const advertisers = profiles.filter(p => p.role === 'advertiser');
        console.log(`Advertisers: ${advertisers.length}`);

        const visitors = profiles.filter(p => p.role === 'visitor' || p.role === 'user');
        console.log(`Visitors/Users: ${visitors.length}`);

        const others = profiles.filter(p => p.role !== 'advertiser' && p.role !== 'visitor' && p.role !== 'user');
        console.log(`Others (Undefined/Admin): ${others.length}`);

        if (others.length > 0) {
            console.log('Sample "Other" roles:', others.slice(0, 3));
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
