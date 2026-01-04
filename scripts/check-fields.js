
import { createDirectus, rest, readFields, authentication } from '@directus/sdk';
import 'dotenv/config';

// Found in vite.config.ts: target: 'https://base.spotgp.com'
let URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

console.log(`Connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        if (!EMAIL || !PASSWORD) {
            throw new Error('Missing Admin Email or Password in env');
        }

        console.log('Authenticating via fetch...');
        // Manual fetch to avoid SDK argument issues
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Login failed: ${response.status} ${errText}`);
        }

        const json = await response.json();
        const accessToken = json.data?.access_token;
        await client.setToken(accessToken);
        console.log('Logged in successfully!');

        // Check Fields
        console.log('Fetching fields for collection "profiles"...');
        const fields = await client.request(readFields('profiles'));

        const existingFieldNames = fields.map(f => f.field);

        const expectedFields = [
            'prices',
            'weekly_schedule',
            'virtualFantasies',
            'forSale',
            'serviceLocations',
            'map_coordinates',
            'map_address',
            'schedule_24h',
            'schedule_same_everyday',
            'schedule_from',
            'schedule_to',
            'photos',
            'videos',
            'audio_url',
            'price',
            'display_name',
            'category',
            'about',
            'age',
            'height',
            'weight',
            'whatsapp'
        ];

        console.log('\n--- Field Verification ---');
        const missing = expectedFields.filter(f => !existingFieldNames.includes(f));

        if (missing.length === 0) {
            console.log('✅ All expected fields represent in schema!');
        } else {
            console.log('❌ MISSING FIELDS:');
            missing.forEach(f => console.log(` - ${f}`));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
