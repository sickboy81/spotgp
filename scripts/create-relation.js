
import { createDirectus, rest, authentication, createRelation } from '@directus/sdk';
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

        console.log('Creating relation profiles.user -> directus_users.id ...');

        await client.request(createRelation({
            collection: 'profiles',
            field: 'user',
            related_collection: 'directus_users',
            schema: {
                on_delete: 'CASCADE', // If user is deleted, delete profile? Or SET NULL? usually cascade for user->profile 1:1 or 1:M
            },
            meta: {
                many_collection: 'profiles',
                many_field: 'user',
                one_collection: 'directus_users',
                one_field: null, // One-Way usually fine, or 'profiles' if we added a O2M field on users
                one_allowed_collections: null,
                one_collection_field: null,
                one_deselect_action: 'nullify',
                junction_field: null,
                sort_field: null,
            }
        }));

        console.log('✅ Relation created successfully.');

    } catch (err) {
        console.error('Error creating relation:', err);
        // Log details if available
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
}

main();
