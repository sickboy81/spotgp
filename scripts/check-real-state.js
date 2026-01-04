// Check what fields are actually accessible and the real permission state
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function checkRealState() {
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

        // Check current permissions
        console.log('\n📋 Current permissions for profiles:');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
        const permsData = await permsRes.json();
        for (const p of permsData.data || []) {
            console.log(`  ${p.action}: fields=${JSON.stringify(p.fields)}`);
        }

        // Get fields of profiles collection
        console.log('\n📋 Fields in profiles collection:');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const allFields = (fieldsData.data || []).map(f => f.field);
        console.log(`  ${allFields.join(', ')}`);

        // Check specifically for date_created and user fields
        console.log('\n📋 Checking system fields:');
        for (const fieldName of ['date_created', 'date_updated', 'user', 'user_created', 'user_updated']) {
            const field = fieldsData.data?.find(f => f.field === fieldName);
            if (field) {
                console.log(`  ✅ ${fieldName} exists (type: ${field.type})`);
            } else {
                console.log(`  ❌ ${fieldName} does not exist`);
            }
        }

        // Get a sample profile as admin to see what fields are returned
        console.log('\n📋 Sample profile as admin:');
        const profileRes = await fetch(`${URL}/items/profiles?limit=1&fields=*`, { headers: authHeaders });
        const profileData = await profileRes.json();
        if (profileData.data?.[0]) {
            console.log(`  Keys: ${Object.keys(profileData.data[0]).join(', ')}`);
        }

        // Now test as user - what do they see?
        console.log('\n📋 Testing as user:');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // What can user see without filter?
            const userProfileRes = await fetch(`${URL}/items/profiles?limit=1&fields=*`, { headers: userHeaders });
            if (userProfileRes.ok) {
                const data = await userProfileRes.json();
                if (data.data?.[0]) {
                    console.log(`  User can see keys: ${Object.keys(data.data[0]).join(', ')}`);
                    console.log(`  Has 'user' field: ${data.data[0].hasOwnProperty('user')}`);
                    console.log(`  Has 'date_created' field: ${data.data[0].hasOwnProperty('date_created')}`);
                }
            } else {
                console.log('  ❌ User cannot access profiles at all');
                const errText = await userProfileRes.text();
                console.log(`     Error: ${errText}`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkRealState();
