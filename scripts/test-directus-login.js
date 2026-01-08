
const DIRECTUS_URL = 'https://base.spotgp.com';
const EMAIL = 'YOUR_ADMIN_EMAIL';
const PASSWORD = 'YOUR_ADMIN_PASSWORD';

async function testLogin() {
    try {
        console.log(`Connecting to ${DIRECTUS_URL}...`);

        // 1. Login
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }

        console.log('✅ Login Successful!');
        const token = loginData.data.access_token;
        console.log('Token acquired.');

        // 2. Check Permissions / Flows Access
        const flowsRes = await fetch(`${DIRECTUS_URL}/flows`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (flowsRes.ok) {
            console.log('✅ Access to Flows confirmed!');
            console.log('Flows Status:', flowsRes.status);
        } else {
            console.log('⚠️ Cannot access Flows. Status:', flowsRes.status);
        }

        // 3. Check Extensions (just to see if we can list them)
        const extRes = await fetch(`${DIRECTUS_URL}/extensions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (extRes.ok) {
            console.log('✅ Extensions endpoint accessible (Read-only usually).');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
