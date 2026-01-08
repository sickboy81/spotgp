
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

        // 1. Categories
        console.log('--- Categories ---');
        try {
            await client.request(createCollection({
                collection: 'categories',
                schema: {},
                meta: { icon: 'category', note: 'Ad categories' }
            }));
            await client.request(createField('categories', { field: 'name', type: 'string' }));
            await client.request(createField('categories', { field: 'slug', type: 'string' }));
            await client.request(createField('categories', { field: 'icon', type: 'string' }));
            await client.request(createField('categories', { field: 'is_active', type: 'boolean', schema: { default_value: true } }));
            console.log('✅ categories created.');
        } catch (e) {
            console.log('⚠️ categories error:', e.message);
        }

        // 2. Coupons
        console.log('--- Coupons ---');
        try {
            await client.request(createCollection({
                collection: 'coupons',
                schema: {},
                meta: { icon: 'local_offer', note: 'Discount coupons' }
            }));
            await client.request(createField('coupons', { field: 'code', type: 'string' }));
            await client.request(createField('coupons', { field: 'discount_percent', type: 'integer' }));
            await client.request(createField('coupons', { field: 'max_uses', type: 'integer' }));
            await client.request(createField('coupons', { field: 'used_count', type: 'integer', schema: { default_value: 0 } }));
            await client.request(createField('coupons', { field: 'expires_at', type: 'dateTime' }));
            await client.request(createField('coupons', { field: 'is_active', type: 'boolean', schema: { default_value: true } }));
            console.log('✅ coupons created.');
        } catch (e) {
            console.log('⚠️ coupons error:', e.message);
        }

        // 3. Bans
        console.log('--- Bans ---');
        try {
            await client.request(createCollection({
                collection: 'bans',
                schema: {},
                meta: { icon: 'block', note: 'Banned users' }
            }));
            await client.request(createField('bans', { field: 'user_id', type: 'string', meta: { note: 'Profile/User ID' } }));
            await client.request(createField('bans', { field: 'reason', type: 'text' }));
            await client.request(createField('bans', { field: 'expires_at', type: 'dateTime' }));
            await client.request(createField('bans', { field: 'banned_by', type: 'string' }));
            await client.request(createField('bans', { field: 'ip_address', type: 'string' }));
            console.log('✅ bans created.');
        } catch (e) {
            console.log('⚠️ bans error:', e.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
