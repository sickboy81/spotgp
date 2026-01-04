// Delete and recreate media collection
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function recreateMedia() {
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

        // 1. First delete media permissions
        console.log('\n🗑️ Deleting media permissions...');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=media`, { headers: authHeaders });
        const permsData = await permsRes.json();
        for (const p of permsData.data || []) {
            await fetch(`${URL}/permissions/${p.id}`, { method: 'DELETE', headers: authHeaders });
        }
        console.log('  Deleted permissions');

        // 2. Delete media collection
        console.log('\n🗑️ Deleting media collection...');
        const delRes = await fetch(`${URL}/collections/media`, {
            method: 'DELETE',
            headers: authHeaders
        });
        console.log(`  Status: ${delRes.status}`);

        // 3. Create new media collection
        console.log('\n➕ Creating fresh media collection...');
        const createRes = await fetch(`${URL}/collections`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                collection: 'media',
                meta: {
                    icon: 'image',
                    note: 'Media files for profiles',
                    hidden: false,
                    singleton: false
                },
                schema: {}
            })
        });

        if (createRes.ok) {
            console.log('  ✅ Collection created');
        } else {
            const err = await createRes.text();
            console.log('  ❌ Failed:', err.substring(0, 200));
            return;
        }

        // 4. Add fields
        console.log('\n➕ Adding fields...');
        const fields = [
            { field: 'profile_id', type: 'integer', schema: { is_nullable: true } },
            { field: 'file_url', type: 'string', schema: { is_nullable: true } },
            { field: 'type', type: 'string', schema: { is_nullable: true, default_value: 'image' } },
            { field: 'sort', type: 'integer', schema: { is_nullable: true, default_value: 0 } }
        ];

        for (const field of fields) {
            const res = await fetch(`${URL}/fields/media`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(field)
            });
            console.log(`  ${res.ok ? '✅' : '❌'} ${field.field}`);
        }

        // 5. Create permissions
        console.log('\n➕ Creating permissions...');
        for (const action of ['create', 'read', 'update', 'delete']) {
            const res = await fetch(`${URL}/permissions`, {
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
            console.log(`  ${res.ok ? '✅' : '❌'} ${action}`);
        }

        // 6. Test as admin first
        console.log('\n📋 Testing as admin...');
        const adminMediaRes = await fetch(`${URL}/items/media?limit=1`, { headers: authHeaders });
        console.log(`  media: ${adminMediaRes.status}`);

        // 7. Test as user
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        const userMediaRes = await fetch(`${URL}/items/media?limit=1`, { headers: userHeaders });
        console.log(`  media: ${userMediaRes.status} ${userMediaRes.ok ? '✅' : '❌'}`);
        if (!userMediaRes.ok) {
            const err = await userMediaRes.json().catch(() => ({}));
            console.log(`  Error: ${err.errors?.[0]?.message || 'Unknown'}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

recreateMedia();
