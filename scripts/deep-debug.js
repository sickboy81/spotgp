// Deep debug of the 403 error
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function deepDebug() {
    try {
        console.log('=== DEEP DEBUG ===\n');

        // 1. Admin login
        const adminLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const { data: { access_token: adminToken } } = await adminLoginRes.json();
        const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

        // 2. Try as admin first
        console.log('📋 Testing as ADMIN:');

        // Simple read
        const adminSimpleRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: adminHeaders });
        console.log(`  Simple read: ${adminSimpleRes.status}`);

        // With date_created sort
        const adminSortRes = await fetch(`${URL}/items/profiles?sort=-date_created&limit=1`, { headers: adminHeaders });
        console.log(`  Sort by date_created: ${adminSortRes.status}`);

        // With user filter
        const adminFilterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: adminHeaders });
        console.log(`  Filter by user: ${adminFilterRes.status}`);
        if (adminFilterRes.ok) {
            const data = await adminFilterRes.json();
            console.log(`    Found: ${data.data?.length || 0} profiles`);
        }

        // 3. Now test as user
        console.log('\n📋 Testing as USER:');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });
        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        // Simple read
        const userSimpleRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: userHeaders });
        console.log(`  Simple read: ${userSimpleRes.status}`);
        if (userSimpleRes.ok) {
            const data = await userSimpleRes.json();
            if (data.data?.[0]) {
                console.log(`    Profile has 'user' key: ${data.data[0].hasOwnProperty('user')}`);
                console.log(`    Profile has 'date_created' key: ${data.data[0].hasOwnProperty('date_created')}`);
            }
        }

        // With date_created sort
        const userSortRes = await fetch(`${URL}/items/profiles?sort=-date_created&limit=1`, { headers: userHeaders });
        console.log(`  Sort by date_created: ${userSortRes.status}`);
        if (!userSortRes.ok) {
            const err = await userSortRes.json().catch(() => null);
            console.log(`    Error: ${err?.errors?.[0]?.message || 'Unknown'}`);
        }

        // With user filter
        const userFilterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
        console.log(`  Filter by user: ${userFilterRes.status}`);
        if (!userFilterRes.ok) {
            const err = await userFilterRes.json().catch(() => null);
            console.log(`    Error: ${err?.errors?.[0]?.message || 'Unknown'}`);
        }

        // 4. Check what policies the user has
        console.log('\n📋 Checking user token claims...');
        // Decode JWT to see claims
        try {
            const parts = userToken.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log(`  User ID: ${payload.id}`);
            console.log(`  Role: ${payload.role}`);
            console.log(`  App access: ${payload.app_access}`);
            console.log(`  Admin access: ${payload.admin_access}`);
        } catch (e) {
            console.log('  Could not decode token');
        }

        // 5. Check the user's actual role assignment
        console.log('\n📋 Checking user role in database...');
        const userDataRes = await fetch(`${URL}/users/26438ac6-9d0e-4050-8a93-3f5906d5ca32?fields=*,role.*`, { headers: adminHeaders });
        if (userDataRes.ok) {
            const userData = await userDataRes.json();
            console.log(`  Role ID: ${userData.data?.role?.id || userData.data?.role}`);
            console.log(`  Role Name: ${userData.data?.role?.name}`);
        }

        console.log('\n=== DONE ===');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

deepDebug();
