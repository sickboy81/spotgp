
import { createDirectus, rest, authentication, createCollection, createField, readCollections, createPermission, readPermissions } from '@directus/sdk';
import 'dotenv/config';

const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

console.log(`Connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated.');

        const collectionsToAdd = [
            {
                collection: 'plans',
                meta: { icon: 'workspace_premium', note: 'Subscription plans' },
                fields: [
                    { field: 'name', type: 'string', meta: { interface: 'input' } },
                    { field: 'price', type: 'decimal', meta: { interface: 'input' } },
                    { field: 'duration_days', type: 'integer', meta: { interface: 'input' } },
                    { field: 'description', type: 'text', meta: { interface: 'textarea' } },
                    { field: 'is_active', type: 'boolean', schema: { default_value: true } },
                ]
            },
            {
                collection: 'subscriptions',
                meta: { icon: 'card_membership', note: 'User subscriptions' },
                fields: [
                    { field: 'user_id', type: 'string', meta: { interface: 'input' } },
                    { field: 'plan_id', type: 'string', meta: { interface: 'input' } },
                    { field: 'start_date', type: 'dateTime', meta: { interface: 'datetime' } },
                    { field: 'end_date', type: 'dateTime', meta: { interface: 'datetime' } },
                    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Expired', value: 'expired' }, { text: 'Canceled', value: 'canceled' }] } } },
                    { field: 'amount_paid', type: 'decimal', meta: { interface: 'input' } },
                ]
            }
        ];

        const existing = await client.request(readCollections());
        const existingNames = new Set(existing.map(c => c.collection));

        for (const def of collectionsToAdd) {
            if (!existingNames.has(def.collection)) {
                console.log(`Creating collection ${def.collection}...`);
                await client.request(createCollection({
                    collection: def.collection,
                    schema: {},
                    meta: def.meta
                }));
            } else {
                console.log(`Collection ${def.collection} already exists.`);
            }

            // Create fields
            for (const field of def.fields) {
                try {
                    console.log(`  Creating field ${field.field}...`);
                    await client.request(createField(def.collection, field));
                } catch (e) {
                    // Ignore if exists
                    if (e.errors?.[0]?.extensions?.code === 'FIELD_ALREADY_EXISTS' || e.message.includes('already exists')) {
                        console.log(`  Field ${field.field} already exists.`);
                    } else {
                        console.error(`  Error creating field ${field.field}:`, e.message);
                    }
                }
            }
        }

        // Permissions for Plans (Public Read)
        try {
            await client.request(createPermission({
                collection: 'plans',
                role: null, // Public
                action: 'read',
                permissions: {},
                fields: ['*']
            }));
            console.log('✅ Public read permission on plans granted.');
        } catch (e) {
            console.log('Permission might already exist or failed:', e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
