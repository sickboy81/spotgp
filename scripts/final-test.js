// Final verification test
const URL = 'https://base.spotgp.com';

async function finalTest() {
    try {
        console.log('=== FINAL PERMISSION TEST ===\n');

        // Login as user
        console.log('🔐 Logging in as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (!userLoginRes.ok) {
            console.log('❌ Login failed');
            return;
        }

        const { data: { access_token: userToken } } = await userLoginRes.json();
        console.log('✅ User logged in\n');
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        // Test all endpoints
        const tests = [
            { name: '/users/me', url: `${URL}/users/me?fields=*,role.name` },
            { name: '/items/profiles (no filter)', url: `${URL}/items/profiles?limit=1` },
            { name: '/items/profiles (with user filter)', url: `${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32` },
            { name: '/items/profiles (with sort)', url: `${URL}/items/profiles?sort=-date_created&limit=1` },
            { name: '/items/notifications', url: `${URL}/items/notifications?limit=1` },
            { name: '/items/profile_views', url: `${URL}/items/profile_views?limit=1` },
            { name: '/items/profile_clicks', url: `${URL}/items/profile_clicks?limit=1` },
        ];

        console.log('📋 Testing endpoints:\n');
        for (const test of tests) {
            const res = await fetch(test.url, { headers: userHeaders });
            const status = res.ok ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${res.status}`);

            if (!res.ok) {
                const errText = await res.text();
                console.log(`   Error: ${errText.substring(0, 150)}`);
            }
        }

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

finalTest();
