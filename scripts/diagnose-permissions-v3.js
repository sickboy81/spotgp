const URL = 'https://base.spotgp.com';
const EMAIL = 'egeohub101@gmail.com';
const PASSWORD = '041052.11setemB';

async function diagnose() {
    try {
        // 1. Login
        console.log('🔐 Logging in...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} - ${txt}`);
        }

        const { data } = await loginRes.json();
        const token = data.access_token;
        console.log('✅ Logged in successfully\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get App User role
        console.log('📋 Fetching App User role...');
        const rolesRes = await fetch(`${URL}/roles?filter[name][_eq]=App User`, {
            headers: authHeaders
        });
        const rolesData = await rolesRes.json();

        if (!rolesData.data || rolesData.data.length === 0) {
            console.error('❌ App User role not found!');
            return;
        }

        const appUserRole = rolesData.data[0];
        console.log(`   ID: ${appUserRole.id}`);
        console.log(`   Policies: ${JSON.stringify(appUserRole.policies || [])}\n`);

        // 3. Get all policies
        console.log('📜 Fetching all policies...');
        const policiesRes = await fetch(`${URL}/policies`, {
            headers: authHeaders
        });
        const policiesData = await policiesRes.json();
        console.log(` Found ${policiesData.data.length} policies:`);
        policiesData.data.forEach(p => {
            console.log(`   - ${p.name} (${p.id})`);
        });

        // 4. Check Ghost Policy permissions
        const GHOST_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';
        console.log(`\n🔍 Checking permissions for Ghost Policy (${GHOST_ID})...`);
        const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${GHOST_ID}&limit=-1`, {
            headers: authHeaders
        });
        const permsData = await permsRes.json();

        if (!permsData.data || permsData.data.length === 0) {
            console.log('   ❌ NO PERMISSIONS FOUND FOR GHOST POLICY!');
        } else {
            console.log(`   Found ${permsData.data.length} permissions:`);
            permsData.data.forEach(p => {
                console.log(`   - ${p.collection}.${p.action}`);
                console.log(`     Fields: ${p.fields ? p.fields.join(', ') : 'NULL'}`);
                console.log(`     Permissions: ${p.permissions ? JSON.stringify(p.permissions) : 'NULL'}`);
            });
        }

        console.log('\n✅ Diagnosis complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

diagnose();
