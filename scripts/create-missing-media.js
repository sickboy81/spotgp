// Create missing media collection and profile fields
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function createMissing() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const { data: { access_token } } = await loginRes.json();
        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // 1. Check if media collection exists
        console.log('\n📋 Checking for media collection...');
        const collectionsRes = await fetch(`${URL}/collections`, { headers: authHeaders });
        const collectionsData = await collectionsRes.json();
        const hasMedia = collectionsData.data?.some(c => c.collection === 'media');

        if (!hasMedia) {
            console.log('  Creating media collection...');
            const createCollRes = await fetch(`${URL}/collections`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    collection: 'media',
                    meta: {
                        icon: 'image',
                        note: 'Media files for profiles'
                    },
                    schema: {},
                    fields: [
                        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
                        { field: 'profile_id', type: 'integer', schema: { is_nullable: true } },
                        { field: 'file_url', type: 'string', schema: { is_nullable: true } },
                        { field: 'type', type: 'string', schema: { is_nullable: true, default_value: 'image' } },
                        { field: 'sort', type: 'integer', schema: { is_nullable: true, default_value: 0 } }
                    ]
                })
            });

            if (createCollRes.ok) {
                console.log('  ✅ Created media collection');
            } else {
                const err = await createCollRes.text();
                console.log('  ❌ Failed:', err.substring(0, 200));
            }
        } else {
            console.log('  ✅ media collection exists');
        }

        // 2. Add permissions for media
        console.log('\n📋 Adding permissions for media...');
        for (const action of ['create', 'read', 'update', 'delete']) {
            const createPermRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: APP_ACCESS_POLICY_ID,
                    collection: 'media',
                    action: action,
                    fields: ['*'],
                    permissions: null
                })
            });
            if (createPermRes.ok) {
                console.log(`  ✅ ${action} on media`);
            } else {
                const err = await createPermRes.text();
                if (err.includes('unique')) {
                    console.log(`  ⏭️ ${action} on media (already exists)`);
                } else {
                    console.log(`  ❌ ${action} on media: ${err.substring(0, 100)}`);
                }
            }
        }

        // 3. Add missing fields to profiles
        console.log('\n📋 Checking/adding missing fields to profiles...');
        const fieldsToAdd = [
            { field: 'is_featured', type: 'boolean', schema: { default_value: false } },
            { field: 'is_sponsored', type: 'boolean', schema: { default_value: false } },
            { field: 'views', type: 'integer', schema: { default_value: 0 } },
            { field: 'clicks', type: 'integer', schema: { default_value: 0 } },
            { field: 'photos', type: 'json', schema: { is_nullable: true } }
        ];

        // Get existing fields
        const existingFieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const existingFieldsData = await existingFieldsRes.json();
        const existingFields = (existingFieldsData.data || []).map(f => f.field);

        for (const fieldDef of fieldsToAdd) {
            if (existingFields.includes(fieldDef.field)) {
                console.log(`  ⏭️ ${fieldDef.field} (exists)`);
                continue;
            }

            const createFieldRes = await fetch(`${URL}/fields/profiles`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(fieldDef)
            });

            if (createFieldRes.ok) {
                console.log(`  ✅ Created ${fieldDef.field}`);
            } else {
                const err = await createFieldRes.text();
                console.log(`  ❌ Failed ${fieldDef.field}: ${err.substring(0, 100)}`);
            }
        }

        // 4. Test as user
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // Test /users/me
            const meRes = await fetch(`${URL}/users/me`, { headers: userHeaders });
            console.log(`  /users/me: ${meRes.status} ${meRes.ok ? '✅' : '❌'}`);

            // Test media
            const mediaRes = await fetch(`${URL}/items/media?limit=1`, { headers: userHeaders });
            console.log(`  /items/media: ${mediaRes.status} ${mediaRes.ok ? '✅' : '❌'}`);

            // Test profiles with new fields
            const profilesRes = await fetch(`${URL}/items/profiles?fields=id,is_featured,is_sponsored,views,clicks,photos&limit=1`, { headers: userHeaders });
            console.log(`  /items/profiles (new fields): ${profilesRes.status} ${profilesRes.ok ? '✅' : '❌'}`);
            if (!profilesRes.ok) {
                const err = await profilesRes.json().catch(() => ({}));
                console.log(`    Error: ${err.errors?.[0]?.message || 'Unknown'}`);
            }
        }

        console.log('\n✅ Done! Users must clear browser cache and re-login!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createMissing();
