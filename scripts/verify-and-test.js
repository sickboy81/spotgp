// Verify profiles fields and test all endpoints clearly
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function verifyAndTest() {
    try {
        console.log('=== VERIFICATION TEST ===\n');

        // Admin login
        const adminLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const { data: { access_token: adminToken } } = await adminLoginRes.json();
        const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

        // 1. List all fields in profiles
        console.log('📋 Fields in profiles collection:');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: adminHeaders });
        const fieldsData = await fieldsRes.json();
        const allFields = (fieldsData.data || []).map(f => f.field);
        console.log(allFields.join('\n'));

        console.log('\n📋 Checking for specific fields:');
        console.log(`  user: ${allFields.includes('user') ? '✅ exists' : '❌ missing'}`);
        console.log(`  date_created: ${allFields.includes('date_created') ? '✅ exists' : '❌ missing'}`);
        console.log(`  date_updated: ${allFields.includes('date_updated') ? '✅ exists' : '❌ missing'}`);

        // 2. User login test
        console.log('\n🔐 Logging in as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (!userLoginRes.ok) {
            console.log('❌ User login failed');
            return;
        }

        const { data: { access_token: userToken } } = await userLoginRes.json();
        console.log('✅ User logged in');
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        // 3. Test each endpoint individually
        console.log('\n📋 Endpoint Tests:\n');

        const endpoints = [
            { name: '/users/me', url: `${URL}/users/me?fields=*,role.name` },
            { name: 'profiles (basic)', url: `${URL}/items/profiles?limit=1` },
            { name: 'profiles (user filter)', url: `${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32` },
            { name: 'profiles (sort date)', url: `${URL}/items/profiles?sort=-date_created&limit=1` },
            { name: 'notifications', url: `${URL}/items/notifications?limit=1` },
            { name: 'profile_views', url: `${URL}/items/profile_views?limit=1` },
            { name: 'profile_clicks', url: `${URL}/items/profile_clicks?limit=1` },
        ];

        for (const ep of endpoints) {
            const res = await fetch(ep.url, { headers: userHeaders });
            if (res.ok) {
                console.log(`✅ ${ep.name}: ${res.status}`);
            } else {
                console.log(`❌ ${ep.name}: ${res.status}`);
                try {
                    const err = await res.json();
                    console.log(`   Error: ${err.errors?.[0]?.message || JSON.stringify(err)}`);
                } catch (e) {
                    const errText = await res.text();
                    console.log(`   Error: ${errText.substring(0, 100)}`);
                }
            }
        }

        console.log('\n=== DONE ===');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

verifyAndTest();
