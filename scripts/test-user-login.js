// Test a real user login and API access
const URL = 'https://base.spotgp.com';

// User credentials from the console log - password was Joanamaria1
const USER_EMAIL = 'joanamaria@jm.com';
const USER_PASSWORD = 'Joanamaria1';

async function testUserLogin() {
    try {
        console.log('=== TESTING USER LOGIN ===\n');

        // 1. Login as the actual user
        console.log(`🔐 Step 1: Logging in as ${USER_EMAIL}...`);
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
        });

        console.log(`Login response status: ${loginRes.status}`);
        const loginBody = await loginRes.text();
        console.log(`Login response body: ${loginBody}`);

        if (!loginRes.ok) {
            console.log('❌ User login failed!');
            return;
        }

        const loginData = JSON.parse(loginBody);
        const userToken = loginData.data.access_token;
        console.log('✅ User logged in successfully!');
        console.log(`Token (first 50 chars): ${userToken.substring(0, 50)}...`);

        const authHeaders = {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Test /users/me
        console.log('\n📋 Step 2: Testing /users/me with user token...');
        const meRes = await fetch(`${URL}/users/me?fields=*,role.name`, {
            headers: authHeaders
        });
        console.log(`/users/me status: ${meRes.status}`);
        if (meRes.ok) {
            const meData = await meRes.json();
            console.log('✅ /users/me works!');
            console.log(`  User ID: ${meData.data.id}`);
            console.log(`  Email: ${meData.data.email}`);
            console.log(`  Role: ${meData.data.role?.name || meData.data.role}`);
        } else {
            const errText = await meRes.text();
            console.log(`❌ /users/me failed: ${errText}`);
        }

        // 3. Test /items/profiles
        console.log('\n📋 Step 3: Testing /items/profiles with user token...');
        const profilesRes = await fetch(`${URL}/items/profiles?limit=1`, {
            headers: authHeaders
        });
        console.log(`/items/profiles status: ${profilesRes.status}`);
        if (profilesRes.ok) {
            const profilesData = await profilesRes.json();
            console.log('✅ /items/profiles works!');
            console.log(`  Count: ${profilesData.data?.length || 0}`);
        } else {
            const errText = await profilesRes.text();
            console.log(`❌ /items/profiles failed: ${errText}`);
        }

        // 4. Test /items/profiles with user filter
        console.log('\n📋 Step 4: Testing /items/profiles with user filter...');
        const myProfileRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32&limit=1`, {
            headers: authHeaders
        });
        console.log(`/items/profiles (with filter) status: ${myProfileRes.status}`);
        if (myProfileRes.ok) {
            const myProfileData = await myProfileRes.json();
            console.log('✅ Filtered profiles works!');
            console.log(`  Count: ${myProfileData.data?.length || 0}`);
        } else {
            const errText = await myProfileRes.text();
            console.log(`❌ Filtered profiles failed: ${errText}`);
        }

        // 5. Test /items/notifications
        console.log('\n📋 Step 5: Testing /items/notifications...');
        const notifRes = await fetch(`${URL}/items/notifications?limit=1`, {
            headers: authHeaders
        });
        console.log(`/items/notifications status: ${notifRes.status}`);
        if (notifRes.ok) {
            console.log('✅ /items/notifications works!');
        } else {
            const errText = await notifRes.text();
            console.log(`❌ /items/notifications failed: ${errText}`);
        }

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUserLogin();
