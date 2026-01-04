// Check and fix media permissions
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function checkAndFixMedia() {
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

        // 1. Get ALL permissions for media
        console.log('\n📋 All media permissions:');
        const allPermsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=media`, { headers: authHeaders });
        const allPermsData = await allPermsRes.json();

        if (!allPermsData.data || allPermsData.data.length === 0) {
            console.log('  ❌ No permissions found for media!');
        } else {
            for (const p of allPermsData.data) {
                const isCorrectPolicy = p.policy === APP_ACCESS_POLICY_ID;
                console.log(`  ${isCorrectPolicy ? '✅' : '⚠️'} ${p.action} - policy: ${p.policy} ${isCorrectPolicy ? '(correct)' : '(wrong policy!)'}`);
            }
        }

        // 2. Get media permissions on the correct policy specifically
        console.log('\n📋 Media permissions on App Access policy:');
        const correctPermsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=media&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
        const correctPermsData = await correctPermsRes.json();
        console.log(`  Found: ${correctPermsData.data?.length || 0}`);

        // 3. If missing, create them
        if (!correctPermsData.data || correctPermsData.data.length === 0) {
            console.log('\n🔧 Creating media permissions on correct policy...');
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
        }

        // 4. Now verify by listing permission count
        console.log('\n📋 Final count of ALL permissions on App Access policy:');
        const finalPermsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&limit=-1`, { headers: authHeaders });
        const finalPermsData = await finalPermsRes.json();
        console.log(`  Total: ${finalPermsData.data?.length || 0}`);

        // Group by collection
        const byCollection = {};
        for (const p of finalPermsData.data || []) {
            if (!byCollection[p.collection]) byCollection[p.collection] = [];
            byCollection[p.collection].push(p.action);
        }
        for (const [coll, actions] of Object.entries(byCollection)) {
            console.log(`  ${coll}: ${actions.join(', ')}`);
        }

        // 5. Final test
        console.log('\n📋 Final test as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        const tests = [
            { name: '/users/me', url: `${URL}/users/me` },
            { name: 'profiles', url: `${URL}/items/profiles?limit=1` },
            { name: 'media', url: `${URL}/items/media?limit=1` },
            { name: 'notifications', url: `${URL}/items/notifications?limit=1` },
        ];

        for (const t of tests) {
            const res = await fetch(t.url, { headers: userHeaders });
            console.log(`  ${res.ok ? '✅' : '❌'} ${t.name}: ${res.status}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAndFixMedia();
