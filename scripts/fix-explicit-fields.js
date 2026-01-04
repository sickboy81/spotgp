// Try with explicit field list
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function fixWithExplicitFields() {
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

        // 1. Get ALL field names from profiles
        console.log('\n📋 Getting all field names from profiles...');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const allFieldNames = (fieldsData.data || []).map(f => f.field);
        console.log(`  Found ${allFieldNames.length} fields`);
        console.log(`  Fields: ${allFieldNames.join(', ')}`);

        // 2. Get current profiles read permission
        console.log('\n📋 Getting current profiles read permission...');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&filter[action][_eq]=read`, { headers: authHeaders });
        const permsData = await permsRes.json();
        const readPerm = permsData.data?.[0];

        if (readPerm) {
            console.log(`  Current read permission ID: ${readPerm.id}`);
            console.log(`  Current fields: ${JSON.stringify(readPerm.fields)}`);

            // 3. Update to use explicit field list [*]
            console.log('\n🔧 Updating read permission with fields: ["*"]...');
            const updateRes = await fetch(`${URL}/permissions/${readPerm.id}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({
                    fields: ['*']
                })
            });

            if (updateRes.ok) {
                const updated = await updateRes.json();
                console.log(`  ✅ Updated to fields: ${JSON.stringify(updated.data?.fields)}`);
            } else {
                const err = await updateRes.text();
                console.log(`  ❌ Failed: ${err}`);
            }
        }

        // 4. Test as user
        console.log('\n📋 Testing as user after update...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // Simple read
            const readRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: userHeaders });
            console.log(`  Simple read: ${readRes.status}`);
            if (readRes.ok) {
                const data = await readRes.json();
                if (data.data?.[0]) {
                    const keys = Object.keys(data.data[0]);
                    console.log(`    Keys returned: ${keys.join(', ')}`);
                    console.log(`    Has 'user': ${keys.includes('user')}`);
                    console.log(`    Has 'date_created': ${keys.includes('date_created')}`);
                }
            }

            // Sort test
            const sortRes = await fetch(`${URL}/items/profiles?sort=-date_created&limit=1`, { headers: userHeaders });
            console.log(`  Sort by date_created: ${sortRes.status} ${sortRes.ok ? '✅' : '❌'}`);

            // Filter test
            const filterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`  Filter by user: ${filterRes.status} ${filterRes.ok ? '✅' : '❌'}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixWithExplicitFields();
