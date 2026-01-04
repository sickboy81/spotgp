// Fix media permissions
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function fixMedia() {
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

        // Get existing media permissions
        console.log('\n📋 Checking media permissions...');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=media&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
        const permsData = await permsRes.json();
        console.log(`  Found ${permsData.data?.length || 0} permissions`);

        // Delete and recreate with ["*"]
        for (const perm of permsData.data || []) {
            await fetch(`${URL}/permissions/${perm.id}`, { method: 'DELETE', headers: authHeaders });
        }

        // Create proper permissions
        console.log('\n🔧 Creating media permissions with fields: ["*"]...');
        for (const action of ['create', 'read', 'update', 'delete']) {
            const createRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: APP_ACCESS_POLICY_ID,
                    collection: 'media',
                    action: action,
                    fields: ['*'],
                    permissions: null,
                    validation: null,
                    presets: null
                })
            });
            console.log(`  ${createRes.ok ? '✅' : '❌'} ${action} on media`);
        }

        // Test
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        const mediaRes = await fetch(`${URL}/items/media?limit=1`, { headers: userHeaders });
        console.log(`  /items/media: ${mediaRes.status} ${mediaRes.ok ? '✅' : '❌'}`);
        if (!mediaRes.ok) {
            const err = await mediaRes.json().catch(() => ({}));
            console.log(`    Error: ${err.errors?.[0]?.message || 'Unknown'}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixMedia();
