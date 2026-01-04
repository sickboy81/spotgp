// Check the profiles collection fields and test access
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function checkProfiles() {
    try {
        // 1. Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const { data: { access_token } } = await loginRes.json();
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // 2. Check profiles collection fields
        console.log('📋 Checking profiles collection fields...');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, {
            headers: authHeaders
        });
        const fieldsData = await fieldsRes.json();
        console.log('Fields in profiles:');
        for (const field of fieldsData.data || []) {
            console.log(`  - ${field.field} (${field.type})`);
        }

        // 3. Check if "user" field exists
        const userField = fieldsData.data?.find(f => f.field === 'user');
        if (userField) {
            console.log('\n✅ "user" field exists!');
            console.log(`   Type: ${userField.type}`);
            console.log(`   Schema:`, JSON.stringify(userField.schema, null, 2));
        } else {
            console.log('\n❌ "user" field does NOT exist!');
            console.log('This is the problem - the profiles collection has no "user" field');
        }

        // 4. Get the permission for profiles read
        console.log('\n📋 Checking profiles permissions...');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=3043f967-c650-4c42-bddc-efc84f1ffaca`, {
            headers: authHeaders
        });
        const permsData = await permsRes.json();
        console.log('Permissions for profiles on App Access policy:');
        for (const p of permsData.data || []) {
            console.log(`  - ${p.action}: fields=${JSON.stringify(p.fields)}, permissions=${JSON.stringify(p.permissions)}`);
        }

        // 5. Try to get profiles without filter
        console.log('\n📋 Testing profiles access (no filter)...');
        const noFilterRes = await fetch(`${URL}/items/profiles?limit=1`, {
            headers: authHeaders
        });
        if (noFilterRes.ok) {
            const data = await noFilterRes.json();
            console.log('✅ Works! Got', data.data?.length, 'profiles');
            if (data.data?.[0]) {
                console.log('First profile keys:', Object.keys(data.data[0]).join(', '));
            }
        } else {
            console.log('❌ Failed:', noFilterRes.status);
        }

        // 6. Now login as user and test
        console.log('\n📋 Testing as regular user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            console.log('✅ User logged in');

            const userHeaders = {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            };

            // Test /users/me
            const meRes = await fetch(`${URL}/users/me`, { headers: userHeaders });
            console.log(`/users/me: ${meRes.status} ${meRes.ok ? '✅' : '❌'}`);

            // Test profiles without filter
            const profilesRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: userHeaders });
            console.log(`/items/profiles (no filter): ${profilesRes.status} ${profilesRes.ok ? '✅' : '❌'}`);
            if (!profilesRes.ok) {
                const errText = await profilesRes.text();
                console.log(`  Error: ${errText}`);
            }

            // Test profiles with filter on "user" field
            const filterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`/items/profiles (with user filter): ${filterRes.status} ${filterRes.ok ? '✅' : '❌'}`);
            if (!filterRes.ok) {
                const errText = await filterRes.text();
                console.log(`  Error: ${errText}`);
            }
        } else {
            console.log('❌ User login failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkProfiles();
