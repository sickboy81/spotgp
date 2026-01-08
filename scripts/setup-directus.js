
import { createDirectus, rest, authentication, createCollection, createField, updatePermission, createPermission, readCollections, readFields, readPermissions } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Env Parser ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim();
        }
    });
}

const URL = process.env.VITE_DIRECTUS_URL === '/api' ? 'https://base.spotgp.com' : (process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com');
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error('❌ Error: DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
}

console.log(`Connecting to ${URL} as ${EMAIL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated successfully.');

        // --- Schema Definition ---
        const collections = [
            {
                collection: 'profiles',
                schema: {},
                meta: { icon: 'person', note: 'User profiles' },
                fields: [
                    { field: 'user', type: 'string', meta: { interface: 'input', special: ['user-created'] } }, // FK to directus_users
                    { field: 'ad_id', type: 'string', meta: { interface: 'input', unique: true } },
                    { field: 'display_name', type: 'string', meta: { interface: 'input' } },
                    { field: 'role', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Advertiser', value: 'advertiser' }, { text: 'User', value: 'user' }] } } },
                    { field: 'gender', type: 'string', meta: { interface: 'select-dropdown' } },
                    { field: 'category', type: 'string', meta: { interface: 'select-dropdown' } },
                    { field: 'is_banned', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
                    { field: 'age', type: 'integer', meta: { interface: 'input' } },
                    { field: 'height', type: 'string', meta: { interface: 'input' } },
                    { field: 'weight', type: 'string', meta: { interface: 'input' } },
                    { field: 'city', type: 'string', meta: { interface: 'input' } },
                    { field: 'state', type: 'string', meta: { interface: 'input' } },
                    { field: 'neighborhood', type: 'string', meta: { interface: 'input' } },
                    { field: 'street_address', type: 'string', meta: { interface: 'input' } },
                    { field: 'address_reference', type: 'string', meta: { interface: 'input' } },
                    { field: 'latitude', type: 'float', meta: { interface: 'input' } },
                    { field: 'longitude', type: 'float', meta: { interface: 'input' } },
                    { field: 'price', type: 'integer', meta: { interface: 'input' } },
                    { field: 'is_online', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
                    { field: 'online_until', type: 'dateTime', meta: { interface: 'datetime' } },
                    { field: 'verified', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
                    { field: 'verification_status', type: 'string', meta: { interface: 'select-dropdown' } },
                    { field: 'rating', type: 'float', meta: { interface: 'input' } },
                    { field: 'reviews_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
                    { field: 'views', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
                    { field: 'services', type: 'json', meta: { interface: 'tags' } },
                    { field: 'paymentMethods', type: 'json', meta: { interface: 'tags' } },
                    { field: 'description', type: 'text', meta: { interface: 'textarea' } },
                    { field: 'hairColor', type: 'string', meta: { interface: 'input' } },
                    { field: 'bodyType', type: 'string', meta: { interface: 'input' } },
                    { field: 'ethnicity', type: 'string', meta: { interface: 'input' } },
                    { field: 'hasPlace', type: 'boolean', meta: { interface: 'boolean' } },
                    { field: 'videoCall', type: 'boolean', meta: { interface: 'boolean' } },
                    { field: 'telegram', type: 'string', meta: { interface: 'input' } },
                    { field: 'instagram', type: 'string', meta: { interface: 'input' } },
                    { field: 'twitter', type: 'string', meta: { interface: 'input' } },
                    // Add relationship fields like facilities later or as JSON for now
                    { field: 'facilities', type: 'json', meta: { interface: 'tags' } },
                    { field: 'massageTypes', type: 'json', meta: { interface: 'tags' } },
                    { field: 'happyEnding', type: 'json', meta: { interface: 'tags' } },
                    { field: 'serviceTo', type: 'json', meta: { interface: 'tags' } },
                    { field: 'otherServices', type: 'json', meta: { interface: 'tags' } },
                ]
            },
            {
                collection: 'media',
                meta: { icon: 'image', note: 'User photos and videos' },
                fields: [
                    { field: 'profile_id', type: 'string', meta: { interface: 'input' } }, // FK to profiles
                    { field: 'url', type: 'string', meta: { interface: 'input' } },
                    { field: 'type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Image', value: 'image' }, { text: 'Video', value: 'video' }] } } },
                ]
            },
            {
                collection: 'conversations',
                meta: { icon: 'chat', note: 'Chat conversations' },
                fields: [
                    { field: 'participant1_id', type: 'string' },
                    { field: 'participant2_id', type: 'string' },
                    { field: 'last_message_at', type: 'dateTime' },
                ]
            },
            {
                collection: 'messages',
                meta: { icon: 'message', note: 'Chat messages' },
                fields: [
                    { field: 'conversation_id', type: 'string' },
                    { field: 'sender_id', type: 'string' },
                    { field: 'content', type: 'text' },
                    { field: 'is_read', type: 'boolean', schema: { default_value: false } },
                ]
            },
            {
                collection: 'notifications',
                meta: { icon: 'notifications', note: 'User notifications' },
                fields: [
                    { field: 'user_id', type: 'string' },
                    { field: 'type', type: 'string' },
                    { field: 'title', type: 'string' },
                    { field: 'message', type: 'text' },
                    { field: 'link', type: 'string' },
                    { field: 'is_read', type: 'boolean', schema: { default_value: false } },
                ]
            },
            {
                collection: 'reports',
                meta: { icon: 'flag', note: 'User reports' },
                fields: [
                    { field: 'profile_id', type: 'string' },
                    { field: 'reported_by', type: 'string' },
                    { field: 'type', type: 'string' },
                    { field: 'description', type: 'text' },
                    { field: 'status', type: 'string', schema: { default_value: 'pending' } },
                    { field: 'reviewed_by', type: 'string' },
                    { field: 'reviewed_at', type: 'dateTime' },
                ]
            },
            {
                collection: 'favorites',
                meta: { icon: 'favorite', note: 'User favorites' },
                fields: [
                    { field: 'user_id', type: 'string' },
                    { field: 'profile_id', type: 'string' },
                ]
            },
            {
                collection: 'plans',
                meta: { icon: 'workspace_premium', note: 'Subscription plans' },
                fields: [
                    { field: 'name', type: 'string', meta: { interface: 'input' } },
                    { field: 'price', type: 'decimal', meta: { interface: 'input' } }, // Use decimal/float
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
                    { field: 'plan_id', type: 'string', meta: { interface: 'input' } }, // FK to plans
                    { field: 'start_date', type: 'dateTime', meta: { interface: 'datetime' } },
                    { field: 'end_date', type: 'dateTime', meta: { interface: 'datetime' } },
                    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Expired', value: 'expired' }, { text: 'Canceled', value: 'canceled' }] } } },
                    { field: 'amount_paid', type: 'decimal', meta: { interface: 'input' } },
                ]
            }
        ];

        // --- Execution ---
        const existingCollections = await client.request(readCollections());
        const existingNames = new Set(existingCollections.map(c => c.collection));

        for (const def of collections) {
            if (!existingNames.has(def.collection)) {
                console.log(`Creating collection: ${def.collection}...`);
                await client.request(createCollection({
                    collection: def.collection,
                    schema: def.schema,
                    meta: def.meta
                }));
            } else {
                console.log(`Collection ${def.collection} already exists.`);
            }

            // check fields
            const existingFields = await client.request(readFields(def.collection));
            const existingFieldNames = new Set(existingFields.map(f => f.field));

            for (const fieldDef of def.fields) {
                if (!existingFieldNames.has(fieldDef.field)) {
                    console.log(`  Creating field ${def.collection}.${fieldDef.field}...`);
                    await client.request(createField(def.collection, fieldDef));
                }
            }
        } // End of collections loop
    } catch (error) {
        console.warn('⚠️ non-critical schema error:', error.message);
    }

    // --- Permissions Setup (Independent Block) ---
    try {
        console.log('\nConfiguring Public Permissions...');

        const publicCollections = ['profiles', 'media', 'ads', 'conversations', 'messages', 'plans']; // Add relevant public read collections
        // For public read:
        for (const col of publicCollections) {
            try {
                const existingPerms = await client.request(readPermissions({
                    filter: {
                        role: { _null: true },
                        collection: { _eq: col },
                        action: { _eq: 'read' }
                    }
                }));

                if (existingPerms.length === 0) {
                    console.log(`  Granting Public READ to ${col}...`);
                    await client.request(createPermission({
                        collection: col,
                        role: null,
                        action: 'read',
                        permissions: {}, // Full access to rows? or filter? Empty object = full access
                        fields: ['*']
                    }));
                } else {
                    console.log(`  Public READ on ${col} already exists.`);
                }
            } catch (e) { console.log(`  Skipping ${col} (maybe not created yet): ${e.message}`); }
        }

        // Public Create for Users (Registration)
        try {
            const userRegisterPerms = await client.request(readPermissions({
                filter: {
                    role: { _null: true },
                    collection: { _eq: 'directus_users' },
                    action: { _eq: 'create' }
                }
            }));

            if (userRegisterPerms.length === 0) {
                console.log(`  Granting Public CREATE to directus_users...`);
                await client.request(createPermission({
                    collection: 'directus_users',
                    role: null,
                    action: 'create',
                    permissions: {},
                    fields: ['*']
                }));
            } else {
                console.log(`  Public CREATE on directus_users already exists.`);
            }
        } catch (e) { console.log(`  Error setting user permissions: ${e.message}`); }


        console.log('\n✅ Script execution finished.');

    } catch (error) {
        console.error('❌ Permission Error:', error);
    }
}

main();

