
import { createDirectus, rest, authentication, readRelations } from '@directus/sdk';
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

        const relations = await client.request(readRelations());

        const profilesUserRelation = relations.find(r => r.collection === 'profiles' && r.field === 'user');

        if (profilesUserRelation) {
            console.log('✅ Relation found for profiles.user:', JSON.stringify(profilesUserRelation, null, 2));
        } else {
            console.log('❌ Relation MISSING for profiles.user');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
