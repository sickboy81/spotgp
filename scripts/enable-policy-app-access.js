// Enable app_access on the policy - THIS IS THE ROOT CAUSE FIX!
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function enableAppAccess() {
    try {
        // 1. Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const { data: { access_token } } = await loginRes.json();
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get current policy state
        console.log('📋 Current policy state:');
        const currentRes = await fetch(`${URL}/policies/${APP_ACCESS_POLICY_ID}`, {
            headers: authHeaders
        });
        const currentData = await currentRes.json();
        console.log(`  - name: ${currentData.data.name}`);
        console.log(`  - app_access: ${currentData.data.app_access}`);
        console.log(`  - admin_access: ${currentData.data.admin_access}`);

        // 3. Enable app_access on the policy
        console.log('\n🔧 Enabling app_access on policy...');
        const updateRes = await fetch(`${URL}/policies/${APP_ACCESS_POLICY_ID}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({
                app_access: true
            })
        });

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            throw new Error(`Update failed: ${updateRes.status} - ${errorText}`);
        }

        const updateData = await updateRes.json();
        console.log('✅ Policy updated!');
        console.log(`  - app_access: ${updateData.data.app_access}`);
        console.log(`  - admin_access: ${updateData.data.admin_access}`);

        // 4. Verify the change
        console.log('\n📋 Verifying policy update:');
        const verifyRes = await fetch(`${URL}/policies/${APP_ACCESS_POLICY_ID}`, {
            headers: authHeaders
        });
        const verifyData = await verifyRes.json();
        console.log(`  - app_access: ${verifyData.data.app_access}`);

        if (verifyData.data.app_access === true) {
            console.log('\n✅ SUCCESS! app_access is now TRUE');
            console.log('\n💡 IMPORTANT: Users MUST logout and login again to get a new token with the updated permissions!');
        } else {
            console.log('\n❌ FAILED: app_access is still not true');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

enableAppAccess();
