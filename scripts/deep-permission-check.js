const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

// We'll use admin access to IMPERSONATE the App User and test permissions
const TARGET_USER_ID = '26438ac6-9d0e-4050-8a93-3f5906d5ca32'; // joanamaria@jm.com

async function deepPermissionCheck() {
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
        const adminToken = data.access_token;
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        // Get the App User role and its policies
        console.log('📋 Checking App User role configuration...');
        const roleRes = await fetch(`${URL}/roles/9b41dbf8-90a0-4c39-a7b9-20f25990bebf`, {
            headers: authHeaders
        });
        const roleData = await roleRes.json();
        console.log(`   Role Name: ${roleData.data.name}`);
        console.log(`   Policies: ${JSON.stringify(roleData.data.policies)}`);
        console.log(`   Admin Access: ${roleData.data.admin_access}`);
        console.log(`   App Access: ${roleData.data.app_access}\n`);

        // Check ALL permissions for the Ghost Policy with full details
        const GHOST_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';
        console.log(`🔍 Detailed permission check for Ghost Policy (${GHOST_ID})...\n`);

        const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${GHOST_ID}&limit=-1`, {
            headers: authHeaders
        });
        const permsData = await permsRes.json();

        permsData.data.forEach(perm => {
            console.log(`📌 ${perm.collection}.${perm.action}:`);
            console.log(`   ID: ${perm.id}`);
            console.log(`   Fields: ${perm.fields ? perm.fields.join(', ') : 'NULL'}`);
            console.log(`   Permissions (filter rules): ${perm.permissions ? JSON.stringify(perm.permissions) : 'NULL'}`);
            console.log(`   Validation: ${perm.validation ? JSON.stringify(perm.validation) : 'NULL'}`);
            console.log(`   Presets: ${perm.presets ? JSON.stringify(perm.presets) : 'NULL'}`);
            console.log('');
        });

        // Now check if there are hidden system permissions blocking
        console.log('\n🔒 Checking for system-level blocks...');

        // Test direct collection access
        const collectionsToTest = ['profiles', 'notifications', 'profile_views', 'profile_clicks'];

        for (const collection of collectionsToTest) {
            const testRes = await fetch(`${URL}/items/${collection}?limit=1`, {
                headers: authHeaders
            });

            const status = testRes.ok ? '✅' : '❌';
            console.log(`   ${status} ${collection}: ${testRes.status} ${testRes.statusText}`);

            if (!testRes.ok) {
                const errText = await testRes.text();
                console.log(`      Error: ${errText.substring(0, 200)}`);
            }
        }

        console.log('\n✅ Deep check complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

deepPermissionCheck();
