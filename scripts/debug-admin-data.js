
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

        console.log('Reading profiles...');
        const profiles = await client.request(readItems('profiles', {
            limit: 10,
            fields: ['id', 'display_name', 'role']
        }));

        console.log('Profiles found:', profiles.length);
        profiles.forEach(p => console.log(`- ${p.display_name} [${p.role}]`));

        console.log('\nReading directus_activity...');
        const activity = await client.request(readItems('directus_activity', {
            limit: 5,
            fields: ['action', 'collection', 'timestamp']
        }));
        console.log('Activity found:', activity.length);
        activity.forEach(a => console.log(`- ${a.action} on ${a.collection} at ${a.timestamp}`));

        console.log('\nReading directus_files...');
        const files = await client.request(readItems('directus_files', {
            limit: 5
        }));
        console.log('Files found:', files.length);

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
