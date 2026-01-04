// Debug the exact permission configuration for profiles
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function debugPermissions() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const { data: { access_token } } = await loginRes.json();
        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // Get ALL permissions for profiles collection on App Access policy
        console.log('\n📋 Permissions for "profiles" collection:');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&fields=*`, { headers: authHeaders });
        const permsData = await permsRes.json();

        for (const p of permsData.data || []) {
            console.log(`\n--- ${p.action.toUpperCase()} ---`);
            console.log(`  ID: ${p.id}`);
            console.log(`  fields: ${JSON.stringify(p.fields)}`);
            console.log(`  permissions: ${JSON.stringify(p.permissions)}`);
            console.log(`  validation: ${JSON.stringify(p.validation)}`);
            console.log(`  presets: ${JSON.stringify(p.presets)}`);
        }

        // Specifically check the READ permission
        const readPerm = permsData.data?.find(p => p.action === 'read');
        if (readPerm) {
            console.log('\n🔍 ANALYSIS OF READ PERMISSION:');
            console.log(`  fields: ${JSON.stringify(readPerm.fields)}`);
            if (readPerm.fields === null || (Array.isArray(readPerm.fields) && readPerm.fields.includes('*'))) {
                console.log('  ✅ Should have access to ALL fields');
            } else if (Array.isArray(readPerm.fields)) {
                console.log('  ⚠️ Limited to specific fields:', readPerm.fields);
                if (!readPerm.fields.includes('user') && !readPerm.fields.includes('*')) {
                    console.log('  ❌ The "user" field is NOT in the allowed fields list!');
                }
            }
        }

        // Delete and recreate the read permission with explicit null fields
        console.log('\n🔧 Deleting and recreating READ permission with proper config...');
        if (readPerm) {
            // Delete existing
            await fetch(`${URL}/permissions/${readPerm.id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            console.log('  Deleted old permission');
        }

        // Create new read permission
        const createRes = await fetch(`${URL}/permissions`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                policy: APP_ACCESS_POLICY_ID,
                collection: 'profiles',
                action: 'read',
                fields: null,  // null means ALL fields
                permissions: null,  // no filter restrictions
                validation: null,
                presets: null
            })
        });

        if (createRes.ok) {
            console.log('  ✅ Created new READ permission with fields: null (all fields)');
        } else {
            const errText = await createRes.text();
            console.log('  ❌ Failed:', errText);
        }

        // Also fix UPDATE permission
        const updatePerm = permsData.data?.find(p => p.action === 'update');
        if (updatePerm) {
            await fetch(`${URL}/permissions/${updatePerm.id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
        }

        await fetch(`${URL}/permissions`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                policy: APP_ACCESS_POLICY_ID,
                collection: 'profiles',
                action: 'update',
                fields: null,
                permissions: null,
                validation: null,
                presets: null
            })
        });
        console.log('  ✅ Created new UPDATE permission with fields: null');

        // Also fix CREATE permission
        const createPerm = permsData.data?.find(p => p.action === 'create');
        if (createPerm) {
            await fetch(`${URL}/permissions/${createPerm.id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
        }

        await fetch(`${URL}/permissions`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                policy: APP_ACCESS_POLICY_ID,
                collection: 'profiles',
                action: 'create',
                fields: null,
                permissions: null,
                validation: null,
                presets: null
            })
        });
        console.log('  ✅ Created new CREATE permission with fields: null');

        // Now test as user
        console.log('\n📋 Testing as user after permission fix...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // Test profiles with filter
            const filterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`/items/profiles (with user filter): ${filterRes.status} ${filterRes.ok ? '✅' : '❌'}`);
            if (!filterRes.ok) {
                const errText = await filterRes.text();
                console.log(`  Error: ${errText}`);
            } else {
                const data = await filterRes.json();
                console.log(`  Found ${data.data?.length || 0} profiles`);
            }
        }

        console.log('\n💡 Users must logout and login again to get fresh tokens!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugPermissions();
