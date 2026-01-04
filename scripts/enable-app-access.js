const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

const APP_USER_ROLE_ID = '9b41dbf8-90a0-4c39-a7b9-20f25990bebf';

async function enableAppAccess() {
    try {
        // Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const { data } = await loginRes.json();
        const token = data.access_token;
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Update App User role to enable app_access
        console.log('🔧 Enabling app_access for App User role...');
        const updateRes = await fetch(`${URL}/roles/${APP_USER_ROLE_ID}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({
                app_access: true,
                admin_access: false,
                enforce_tfa: false
            })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error(`Failed to update role: ${updateRes.status} - ${errText}`);
        }

        const updateData = await updateRes.json();
        console.log('✅ App User role updated!');
        console.log(`   app_access: ${updateData.data.app_access}`);
        console.log(`   admin_access: ${updateData.data.admin_access}`);
        console.log(`   enforce_tfa: ${updateData.data.enforce_tfa}\n`);

        console.log('✅ App access enabled successfully!');
        console.log('\n💡 Users should now logout and login again to get fresh tokens with app access enabled.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

enableAppAccess();
