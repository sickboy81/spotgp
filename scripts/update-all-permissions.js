// Update all permissions to use ["*"] instead of null
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function updateAllPermissions() {
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

        // Get all permissions for App Access policy
        console.log('\n📋 Getting all permissions...');
        const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&limit=-1`, { headers: authHeaders });
        const permsData = await permsRes.json();
        console.log(`  Found ${permsData.data?.length || 0} permissions`);

        // Update each permission to use ["*"]
        console.log('\n🔧 Updating permissions to use fields: ["*"]...');
        for (const perm of permsData.data || []) {
            if (perm.fields === null) {
                const updateRes = await fetch(`${URL}/permissions/${perm.id}`, {
                    method: 'PATCH',
                    headers: authHeaders,
                    body: JSON.stringify({ fields: ['*'] })
                });

                if (updateRes.ok) {
                    console.log(`  ✅ ${perm.action} on ${perm.collection}`);
                } else {
                    console.log(`  ❌ Failed: ${perm.action} on ${perm.collection}`);
                }
            } else {
                console.log(`  ⏭️ ${perm.action} on ${perm.collection} (already has fields)`);
            }
        }

        // Final test
        console.log('\n📋 Final test as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            const tests = [
                { name: '/users/me', url: `${URL}/users/me?fields=*,role.name` },
                { name: 'profiles (sort)', url: `${URL}/items/profiles?sort=-date_created&limit=1` },
                { name: 'profiles (user filter)', url: `${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32` },
                { name: 'notifications', url: `${URL}/items/notifications?limit=1` },
                { name: 'profile_views', url: `${URL}/items/profile_views?limit=1` },
                { name: 'profile_clicks', url: `${URL}/items/profile_clicks?limit=1` },
            ];

            console.log('');
            for (const test of tests) {
                const res = await fetch(test.url, { headers: userHeaders });
                console.log(`${res.ok ? '✅' : '❌'} ${test.name}: ${res.status}`);
            }
        }

        console.log('\n✅ All permissions updated!');
        console.log('\n💡 IMPORTANT: Users must logout and login again!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

updateAllPermissions();
