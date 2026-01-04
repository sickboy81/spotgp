// Refresh the profiles permissions to ensure new fields are included
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function refreshPermissions() {
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

        // Get current profiles permissions
        console.log('\n📋 Current profiles permissions:');
        const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
        const permsData = await permsRes.json();

        for (const p of permsData.data || []) {
            console.log(`  ${p.id}: ${p.action} - fields: ${JSON.stringify(p.fields)}`);
        }

        // Delete and recreate each permission to refresh
        console.log('\n🔄 Refreshing permissions...');
        for (const perm of permsData.data || []) {
            // Delete
            await fetch(`${URL}/permissions/${perm.id}`, { method: 'DELETE', headers: authHeaders });

            // Recreate with fields: null
            const createRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: APP_ACCESS_POLICY_ID,
                    collection: 'profiles',
                    action: perm.action,
                    fields: null,
                    permissions: null,
                    validation: null,
                    presets: null
                })
            });

            if (createRes.ok) {
                console.log(`  ✅ Refreshed: ${perm.action}`);
            } else {
                const err = await createRes.text();
                console.log(`  ❌ Failed ${perm.action}: ${err}`);
            }
        }

        // Verify permissions
        console.log('\n📋 Refreshed permissions:');
        const newPermsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=profiles&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
        const newPermsData = await newPermsRes.json();
        for (const p of newPermsData.data || []) {
            console.log(`  ${p.action}: fields=${JSON.stringify(p.fields)}`);
        }

        // Test as user
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // Test with sort
            console.log('\n  Testing /items/profiles?sort=-date_created...');
            const sortRes = await fetch(`${URL}/items/profiles?sort=-date_created&limit=1`, { headers: userHeaders });
            console.log(`    Status: ${sortRes.status} ${sortRes.ok ? '✅' : '❌'}`);
            if (!sortRes.ok) {
                const err = await sortRes.json().catch(() => ({}));
                console.log(`    Error: ${err.errors?.[0]?.message || 'Unknown'}`);
            }

            // Test with user filter
            console.log('\n  Testing /items/profiles?filter[user]=...');
            const userRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`    Status: ${userRes.status} ${userRes.ok ? '✅' : '❌'}`);
            if (userRes.ok) {
                const data = await userRes.json();
                console.log(`    Found: ${data.data?.length || 0} profiles`);
            }
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

refreshPermissions();
