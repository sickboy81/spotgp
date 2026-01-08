
import { createDirectus, rest, authentication, readFiles } from '@directus/sdk';
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

        console.log('Reading files...');
        const files = await client.request(readFiles({
            limit: -1, // Get all
            fields: ['id', 'type', 'filename_download', 'uploaded_on']
        }));

        console.log(`Total files in Directus: ${files.length}`);
        files.forEach(f => console.log(`- [${f.id}] ${f.filename_download} (${f.type})`));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
