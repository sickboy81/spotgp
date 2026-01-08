
import { createDirectus, rest, authentication, readUsers, readItems } from '@directus/sdk';
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

        console.log('Fetching system users (directus_users)...');
        const users = await client.request(readUsers({
            limit: -1,
            fields: ['id', 'email', 'first_name', 'last_name', 'role.name']
        }));
        console.log(`Total System Users: ${users.length}`);

        console.log('Fetching profiles...');
        const profiles = await client.request(readItems('profiles', {
            limit: -1,
            fields: ['id', 'user']
        }));
        console.log(`Total Profiles: ${profiles.length}`);

        // Find users without profile
        const usersWithProfile = new Set(profiles.map(p => typeof p.user === 'object' ? p.user.id : p.user));
        const usersWithoutProfile = users.filter(u => !usersWithProfile.has(u.id));

        console.log(`Users without profile: ${usersWithoutProfile.length}`);
        usersWithoutProfile.forEach(u => console.log(`- ${u.email} (${u.role?.name})`));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
