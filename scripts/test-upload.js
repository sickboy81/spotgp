
import { createDirectus, rest, authentication, uploadFiles } from '@directus/sdk';
import 'dotenv/config';
import { FormData } from 'formdata-node';
import { Blob } from 'buffer';

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
        console.log('Authenticated. Attempting upload...');

        const form = new FormData();
        const blob = new Blob(['Hello Directus'], { type: 'text/plain' });
        form.append('file', blob, 'test_upload.txt');

        const result = await client.request(uploadFiles(form));

        console.log('✅ Upload Successful!');
        console.log('File ID:', result.id);
        console.log('Title:', result.title);
        console.log('Type:', result.type);

    } catch (err) {
        console.error('❌ Upload Failed:', err);
    }
}

main();
