const URL = 'https://base.spotgp.com';

// This script will help diagnose why permissions are still failing
// We'll test with YOUR actual user credentials (not admin)

const USER_EMAIL = 'sickboy810@gmail.com'; // Your user email
const USER_PASSWORD = 'Joanamaria1'; // Your user password

async function testUserPermissions() {
    try {
        console.log('🔐 Logging in as regular user...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            console.error(`❌ Login failed: ${loginRes.status} - ${txt}`);
            return;
        }

        const { data } = await loginRes.json();
        const token = data.access_token;
        console.log('✅ Logged in successfully');
        console.log(`Token (first 50 chars): ${token.substring(0, 50)}...\n`);

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. Check /users/me endpoint
        console.log('1️⃣ Testing /users/me endpoint...');
        const meRes = await fetch(`${URL}/users/me?fields=*,role.name,role.policies`, {
            headers: authHeaders
        });

        if (!meRes.ok) {
            console.error(`   ❌ FAILED: ${meRes.status} ${meRes.statusText}`);
            const errText = await meRes.text();
            console.error(`   Error: ${errText}`);
        } else {
            const meData = await meRes.json();
            console.log(`   ✅ SUCCESS`);
            console.log(`   User ID: ${meData.data.id}`);
            console.log(`   Email: ${meData.data.email}`);
            console.log(`   Role: ${meData.data.role?.name || 'NULL'}`);
            console.log(`   Role Policies: ${JSON.stringify(meData.data.role?.policies || 'NULL')}\n`);
        }

        // 2. Check profiles collection read
        console.log('2️⃣ Testing profiles collection (read)...');
        const profilesRes = await fetch(`${URL}/items/profiles?limit=1`, {
            headers: authHeaders
        });

        if (!profilesRes.ok) {
            console.error(`   ❌ FAILED: ${profilesRes.status} ${profilesRes.statusText}`);
            const errText = await profilesRes.text();
            console.error(`   Error: ${errText}\n`);
        } else {
            const profilesData = await profilesRes.json();
            console.log(`   ✅ SUCCESS - Found ${profilesData.data.length} profiles\n`);
        }

        // 3. Check notifications collection
        console.log('3️⃣ Testing notifications collection...');
        const notifsRes = await fetch(`${URL}/items/notifications?aggregate={"count":"*"}`, {
            headers: authHeaders
        });

        if (!notifsRes.ok) {
            console.error(`   ❌ FAILED: ${notifsRes.status} ${notifsRes.statusText}`);
            const errText = await notifsRes.text();
            console.error(`   Error: ${errText}\n`);
        } else {
            console.log(`   ✅ SUCCESS\n`);
        }

        // 4. Check profile_views collection
        console.log('4️⃣ Testing profile_views collection...');
        const viewsRes = await fetch(`${URL}/items/profile_views?limit=1`, {
            headers: authHeaders
        });

        if (!viewsRes.ok) {
            console.error(`   ❌ FAILED: ${viewsRes.status} ${viewsRes.statusText}`);
            const errText = await viewsRes.text();
            console.error(`   Error: ${errText}\n`);
        } else {
            console.log(`   ✅ SUCCESS\n`);
        }

        console.log('✅ Diagnosis complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUserPermissions();
