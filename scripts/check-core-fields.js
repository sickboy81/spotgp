
import { createDirectus, rest, readFields, createField, authentication } from '@directus/sdk';
import 'dotenv/config';

let URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        console.log('Authenticating...');
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const json = await response.json();
        await client.setToken(json.data.access_token);

        console.log('Checking core fields (user, ad_id)...');
        const fields = await client.request(readFields('profiles'));
        const fieldNames = fields.map(f => f.field);

        // Check ad_id
        if (!fieldNames.includes('ad_id')) {
            console.log('❌ Missing ad_id. Creating...');
            await client.request(createField('profiles', {
                field: 'ad_id',
                type: 'string',
                schema: { is_unique: true, is_nullable: false }
            }));
            console.log('✅ Created ad_id');
        } else {
            console.log('✅ ad_id exists');
        }

        // Check user
        if (!fieldNames.includes('user')) {
            console.log('❌ Missing user relation. Creating...');
            await client.request(createField('profiles', {
                field: 'user',
                type: 'uuid', // directus_users id is uuid
                schema: { is_nullable: true },
                meta: { special: ['m2o'] }
            }));
            // NOTE: Linking relation to directus_users requires creating a Relation object too, 
            // but createField usually handles basic column. 
            // However, strictly speaking we need a RELATION.
            // But let's see if column exists first.
            // If we create it via API as 'uuid', it's just a column.
            console.log('⚠️ Created "user" column, but might lack Relation metadata if created this way without full relation setup. Prefer using Admin UI for relations if possible.');
        } else {
            console.log('✅ user field exists');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
