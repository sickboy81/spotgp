// Check Directus version and find correct way to enable app_access
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_USER_ROLE_ID = '9b41dbf8-90a0-4c39-a7b9-20f25990bebf';

async function checkVersionAndAccess() {
    try {
        // 1. Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const { data: { access_token } } = await loginRes.json();
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // 2. Check Directus server info
        console.log('📋 Checking Directus version...');
        const serverRes = await fetch(`${URL}/server/info`, {
            headers: authHeaders
        });
        if (serverRes.ok) {
            const serverData = await serverRes.json();
            console.log('Server info:', JSON.stringify(serverData, null, 2));
        } else {
            console.log('Cannot get server info:', serverRes.status);
        }

        // 3. Check schema for directus_roles
        console.log('\n📋 Checking directus_roles schema...');
        const fieldsRes = await fetch(`${URL}/fields/directus_roles`, {
            headers: authHeaders
        });
        if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json();
            console.log('directus_roles fields:');
            for (const field of fieldsData.data || []) {
                console.log(`  - ${field.field}: ${field.type}`);
            }
        }

        // 4. Check directus_access table (Directus 10+ style)
        console.log('\n📋 Checking directus_access table...');
        const accessRes = await fetch(`${URL}/items/directus_access?filter[role][_eq]=${APP_USER_ROLE_ID}`, {
            headers: authHeaders
        });
        if (accessRes.ok) {
            const accessData = await accessRes.json();
            console.log('Access policies:', JSON.stringify(accessData.data, null, 2));
        } else {
            console.log('directus_access not found or error:', accessRes.status);
        }

        // 5. List all policies to understand structure
        console.log('\n📋 Listing all policies...');
        const policiesRes = await fetch(`${URL}/policies?limit=-1`, {
            headers: authHeaders
        });
        if (policiesRes.ok) {
            const policiesData = await policiesRes.json();
            console.log('All policies:');
            for (const p of policiesData.data || []) {
                console.log(`  - ${p.id}: ${p.name}, app_access=${p.app_access}, admin_access=${p.admin_access}`);
            }
        } else {
            console.log('Cannot list policies:', policiesRes.status);
        }

        // 6. Check if there's an access entry for App User role
        console.log('\n📋 Checking access entries...');
        const accessEntriesRes = await fetch(`${URL}/access?filter[role][_eq]=${APP_USER_ROLE_ID}`, {
            headers: authHeaders
        });
        if (accessEntriesRes.ok) {
            const accessEntriesData = await accessEntriesRes.json();
            console.log('Access entries:', JSON.stringify(accessEntriesData.data, null, 2));
        } else {
            console.log('Cannot get access entries:', accessEntriesRes.status);
        }

        // 7. Get the Ghost Policy itself
        console.log('\n📋 Getting Ghost Policy details...');
        const policyRes = await fetch(`${URL}/policies/3043f967-c650-4c42-bddc-efc84f1ffaca`, {
            headers: authHeaders
        });
        if (policyRes.ok) {
            const policyData = await policyRes.json();
            console.log('Ghost Policy:', JSON.stringify(policyData.data, null, 2));
        } else {
            console.log('Cannot get policy:', policyRes.status);
        }

        // 8. Check the access table
        console.log('\n📋 All access table entries...');
        const allAccessRes = await fetch(`${URL}/access?limit=-1`, {
            headers: authHeaders
        });
        if (allAccessRes.ok) {
            const allAccessData = await allAccessRes.json();
            console.log('All access entries:', JSON.stringify(allAccessData.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkVersionAndAccess();
