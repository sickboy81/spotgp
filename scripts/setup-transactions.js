
import { createDirectus, rest, authentication, createCollection, createField, readCollections, createPermission } from '@directus/sdk';
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
                collection: 'transactions',
                meta: { icon: 'receipt_long', note: 'Financial transactions' },
                fields: [
                    { field: 'user_id', type: 'string', meta: { interface: 'input' } },
                    { field: 'type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Payment', value: 'payment' }, { text: 'Refund', value: 'refund' }, { text: 'Fee', value: 'fee' }, { text: 'Commission', value: 'commission' }] } } },
                    { field: 'amount', type: 'decimal', meta: { interface: 'input' } },
                    { field: 'currency', type: 'string', schema: { default_value: 'BRL' } },
                    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'pending' }, { text: 'Completed', value: 'completed' }, { text: 'Failed', value: 'failed' }, { text: 'Refunded', value: 'refunded' }] } } },
                    { field: 'description', type: 'text', meta: { interface: 'textarea' } },
                    { field: 'payment_method', type: 'string', meta: { interface: 'input' } },
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
                    if (e.errors?.[0]?.extensions?.code === 'FIELD_ALREADY_EXISTS' || e.message.includes('already exists')) {
                        console.log(`  Field ${field.field} already exists.`);
                    } else {
                        console.error(`  Error creating field ${field.field}:`, e.message);
                    }
                }
            }
        }

        // Permissions for Transactions (Public Read? Maybe not entire public, but for now let's allow read for admin dashboard to work easily if using API via client)
        // Ideally admin dashboard uses admin token. But directus.ts often uses a static one or public if not logged in.
        // The admin panel usually requires login. 
        // Let's safe-guard by not exposing blindly, assuming the admin user has admin privileges.
        // Wait, the client log-in uses the admin email from env. User in browser logs in as well.
        // The authenticated user (admin) will have access.

        console.log('✅ Transactions setup finished.');

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
