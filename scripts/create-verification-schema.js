
import { createDirectus, rest, authentication, createCollection, createField, readFields } from '@directus/sdk';
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

        // 1. Create verification_documents
        console.log('Creating collection "verification_documents"...');
        try {
            await client.request(createCollection({
                collection: 'verification_documents',
                schema: {},
                meta: {
                    icon: 'verified',
                    note: 'User identity verification documents'
                }
            }));
            console.log('✅ Collection created.');
        } catch (e) {
            console.log('⚠️ Collection might already exist or error:', e.message);
        }

        console.log('Creating fields for verification_documents...');
        const docFields = [
            { field: 'profile_id', type: 'string', meta: { note: 'Relation to Profile' } },
            { field: 'document_front_url', type: 'string' },
            { field: 'document_back_url', type: 'string' },
            { field: 'selfie_url', type: 'string' },
            { field: 'status', type: 'string', schema: { default_value: 'pending' } },
            { field: 'rejected_reason', type: 'text' },
            { field: 'reviewed_by', type: 'string' },
            { field: 'reviewed_at', type: 'dateTime' }
        ];

        for (const f of docFields) {
            try {
                // Check if exists first to avoid error spam? Directus errors if exists.
                await client.request(createField('verification_documents', f));
                console.log(`✅ Field ${f.field} created.`);
            } catch (e) {
                console.log(`⚠️ Field ${f.field} error (maybe exists):`, e.message);
            }
        }

        // 2. Add fields to profiles
        console.log('Checking/Creating fields for profiles...');
        const profileFields = [
            { field: 'verified', type: 'boolean', schema: { default_value: false } },
            { field: 'verification_status', type: 'string', schema: { default_value: 'unverified' } },
            { field: 'verification_rejected_reason', type: 'text' }
        ];

        for (const f of profileFields) {
            try {
                await client.request(createField('profiles', f));
                console.log(`✅ Field profiles.${f.field} created.`);
            } catch (e) {
                console.log(`⚠️ Field profiles.${f.field} error (maybe exists):`, e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
