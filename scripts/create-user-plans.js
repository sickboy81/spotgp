
import { createDirectus, rest, authentication, createCollection, createField } from '@directus/sdk';
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

        console.log('Creating collection "user_plans"...');
        await client.request(createCollection({
            collection: 'user_plans',
            schema: {},
            meta: {
                icon: 'card_membership',
                note: 'User subscriptions'
            }
        }));

        console.log('Creating fields...');
        const fields = [
            { field: 'user_id', type: 'string', meta: { note: 'Relation to Profile ID' } }, // Simple string for now to avoid relation complexity in script, or I can try relation
            { field: 'plan_id', type: 'string', meta: { note: 'Relation to Plan ID' } },
            { field: 'start_date', type: 'dateTime' },
            { field: 'end_date', type: 'dateTime' },
            { field: 'is_active', type: 'boolean', schema: { default_value: true } },
            { field: 'is_trial', type: 'boolean', schema: { default_value: false } },
            { field: 'payment_status', type: 'string', schema: { default_value: 'pending' } }
        ];

        for (const f of fields) {
            console.log(`Creating field ${f.field}...`);
            await client.request(createField('user_plans', f));
        }

        console.log('✅ Collection user_plans created.');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
