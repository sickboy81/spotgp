
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

        console.log('Checking profiles for avatars...');
        const profiles = await client.request(readItems('profiles', {
            limit: 10,
            fields: ['id', 'display_name', 'avatar']
        }));

        let profilesWithAvatar = 0;
        filesReferenced = [];

        profiles.forEach(p => {
            if (p.avatar) {
                profilesWithAvatar++;
                filesReferenced.push(p.avatar);
                console.log(`- User ${p.display_name} has avatar: ${p.avatar}`);
            }
        });

        console.log(`Total Profiles: ${profiles.length}`);
        console.log(`Profiles with Avatar: ${profilesWithAvatar}`);

        if (filesReferenced.length > 0) {
            console.log('Checking if these files exist in directus_files...');
            // Try to fetch one
            try {
                const file = await client.request(readItem('directus_files', filesReferenced[0]));
                console.log('Found file record:', file.id);
            } catch (e) {
                console.log('Failed to fetch file record:', e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
