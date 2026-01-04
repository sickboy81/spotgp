
import { createDirectus, rest, createField, authentication, readFields } from '@directus/sdk';
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
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }
        const json = await response.json();
        await client.setToken(json.data.access_token);
        console.log('Logged in successfully!');

        // Check existing fields first to avoid errors
        const existingFields = await client.request(readFields('profiles'));
        const existingNames = existingFields.map(f => f.field);

        const fieldsToCreate = [
            { field: 'prices', type: 'json', schema: { is_nullable: true } },
            { field: 'weekly_schedule', type: 'json', schema: { is_nullable: true } },
            { field: 'virtualFantasies', type: 'json', schema: { is_nullable: true } },
            { field: 'forSale', type: 'json', schema: { is_nullable: true } },
            { field: 'serviceLocations', type: 'json', schema: { is_nullable: true } },
            { field: 'map_coordinates', type: 'json', schema: { is_nullable: true } },
            { field: 'photos', type: 'json', schema: { is_nullable: true } },
            { field: 'videos', type: 'json', schema: { is_nullable: true } },

            { field: 'map_address', type: 'string', schema: { is_nullable: true } },
            { field: 'audio_url', type: 'string', schema: { is_nullable: true } },
            { field: 'whatsapp', type: 'string', schema: { is_nullable: true } },

            { field: 'about', type: 'text', schema: { is_nullable: true }, meta: { interface: 'textarea' } },

            { field: 'schedule_24h', type: 'boolean', schema: { default_value: false } },
            { field: 'schedule_same_everyday', type: 'boolean', schema: { default_value: true } },

            { field: 'schedule_from', type: 'time', schema: { is_nullable: true } },
            { field: 'schedule_to', type: 'time', schema: { is_nullable: true } },
        ];

        for (const fieldDef of fieldsToCreate) {
            if (existingNames.includes(fieldDef.field)) {
                console.log(`Skipping ${fieldDef.field} (already exists)`);
                continue;
            }

            console.log(`Creating field: ${fieldDef.field} (${fieldDef.type})...`);
            try {
                await client.request(createField('profiles', {
                    field: fieldDef.field,
                    type: fieldDef.type,
                    schema: fieldDef.schema,
                    meta: fieldDef.meta
                }));
                console.log(`✅ Created ${fieldDef.field}`);
            } catch (err) {
                console.error(`❌ Failed to create ${fieldDef.field}:`, err.message);
            }
        }

        console.log('Field creation process completed.');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
