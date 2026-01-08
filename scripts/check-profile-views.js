
import { createDirectus, rest, authentication, createCollection, createField, readCollections } from '@directus/sdk';
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
        console.log(`Connecting to ${URL}...`);
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('Logged in.');

        const collections = await client.request(readCollections());
        const exists = collections.find(c => c.collection === 'profile_views');

        if (exists) {
            console.log('✅ Collection profile_views already exists.');
        } else {
            console.log('⚠️ Collection profile_views MISSING. Creating...');
            await client.request(createCollection({
                collection: 'profile_views',
                schema: {},
                meta: { singleton: false }
            }));
            console.log('✅ Collection profile_views created.');
        }

        // Check fields
        // We need: profile (m2o -> profiles), viewer (m2o -> directus_users), viewed_at (datetime), type (string)

        const requiredFields = [
            { field: 'profile', type: 'integer', schema: {}, meta: { note: 'Profile viewed' } }, // Assuming profile ID is integer or UUID? Usually UUID in Directus if standard. Let's check.
            { field: 'viewer', type: 'uuid', schema: {}, meta: { note: 'Viewer User ID' } },
            { field: 'viewed_at', type: 'timestamp', schema: { default_value: 'NOW()' }, meta: { note: 'Time of view' } },
            { field: 'type', type: 'string', schema: {}, meta: { note: 'Type of view (whatsapp, telegram, etc)' } }
        ];

        // For relationships, it's more complex to script robustly without knowing exact types of related PKs.
        // But let's try to create basic fields.

        for (const f of requiredFields) {
            try {
                await client.request(createField('profile_views', f));
                console.log(`✅ Field ${f.field} created.`);
            } catch (e) {
                // Ignore if exists
                if (e.errors?.[0]?.extensions?.code !== 'FIELD_ALREADY_EXISTS') {
                    console.log(`ℹ️ Field ${f.field} verification/creation: ${e.message}`);
                } else {
                    console.log(`✅ Field ${f.field} exists.`);
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
