
import { createDirectus, rest, authentication, readItems, readFields } from '@directus/sdk';
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

        console.log('Reading fields of "profiles"...');
        const fields = await client.request(readFields('profiles'));
        const relevantFields = fields.map(f => f.field).filter(f =>
            f.includes('img') || f.includes('photo') || f.includes('file') || f.includes('image') || f.includes('gallery') || f.includes('pic')
        );
        console.log('Potential image fields:', relevantFields);

        console.log('\nReading profiles data...');
        const profiles = await client.request(readItems('profiles', {
            limit: 5,
            fields: ['id', 'display_name', ...relevantFields]
        }));

        profiles.forEach(p => {
            console.log(`Profile: ${p.display_name}`);
            relevantFields.forEach(f => {
                const val = p[f];
                if (val) console.log(`  - ${f}:`, val); // Log value length or type if too long?
            });
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
