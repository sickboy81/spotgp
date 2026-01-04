// Investigate media collection issue
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function investigateMedia() {
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

        // 1. Check if media collection exists and its structure
        console.log('\n📋 Media collection details:');
        const collRes = await fetch(`${URL}/collections/media`, { headers: authHeaders });
        if (collRes.ok) {
            const collData = await collRes.json();
            console.log('  ✅ Collection exists');
            console.log('  Meta:', JSON.stringify(collData.data?.meta, null, 2));
        } else {
            console.log('  ❌ Collection does not exist!');
            console.log('  Status:', collRes.status);
            const err = await collRes.text();
            console.log('  Error:', err);
        }

        // 2. Check media fields
        console.log('\n📋 Media fields:');
        const fieldsRes = await fetch(`${URL}/fields/media`, { headers: authHeaders });
        if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json();
            console.log('  Fields:', (fieldsData.data || []).map(f => f.field).join(', '));
        } else {
            console.log('  ❌ Could not get fields');
        }

        // 3. Check ALL permissions for media
        console.log('\n📋 All media permissions (any policy):');
        const allPermsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=media`, { headers: authHeaders });
        const allPermsData = await allPermsRes.json();
        for (const p of allPermsData.data || []) {
            console.log(`  ${p.action} - policy: ${p.policy}, fields: ${JSON.stringify(p.fields)}`);
        }

        // 4. Test as admin
        console.log('\n📋 Testing media as ADMIN:');
        const adminMediaRes = await fetch(`${URL}/items/media?limit=1`, { headers: authHeaders });
        console.log(`  Status: ${adminMediaRes.status}`);
        if (adminMediaRes.ok) {
            const data = await adminMediaRes.json();
            console.log(`  Items: ${data.data?.length || 0}`);
        }

        // 5. Get all items to see what collections exist
        console.log('\n📋 All collections in database:');
        const allCollsRes = await fetch(`${URL}/collections`, { headers: authHeaders });
        const allCollsData = await allCollsRes.json();
        const colls = (allCollsData.data || []).map(c => c.collection);
        console.log('  ', colls.join(', '));

        // 6. Check if the user's role has proper access
        console.log('\n📋 Checking user access table:');
        const accessRes = await fetch(`${URL}/access?filter[role][_eq]=9b41dbf8-90a0-4c39-a7b9-20f25990bebf`, { headers: authHeaders });
        const accessData = await accessRes.json();
        console.log(`  Access entries: ${accessData.data?.length || 0}`);
        for (const a of accessData.data || []) {
            console.log(`    Policy: ${a.policy}`);
        }

        console.log('\n✅ Done');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

investigateMedia();
