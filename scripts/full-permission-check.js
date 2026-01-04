// Full investigation of the permission setup
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_USER_ROLE_ID = '9b41dbf8-90a0-4c39-a7b9-20f25990bebf';

async function investigate() {
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

        // 2. Get the access entry for App User role
        console.log('📋 Getting access entry for App User role...');
        const accessRes = await fetch(`${URL}/access?filter[role][_eq]=${APP_USER_ROLE_ID}`, {
            headers: authHeaders
        });
        const accessData = await accessRes.json();
        console.log('Access entry:', JSON.stringify(accessData.data, null, 2));

        const linkedPolicyId = accessData.data[0]?.policy;
        console.log(`\n➡️ App User role is linked to policy: ${linkedPolicyId}`);

        // 3. Get the linked policy and its permissions
        console.log(`\n📋 Getting linked policy details...`);
        const policyRes = await fetch(`${URL}/policies/${linkedPolicyId}?fields=*,permissions.*`, {
            headers: authHeaders
        });
        const policyData = await policyRes.json();
        console.log('Policy:', policyData.data.name);
        console.log('app_access:', policyData.data.app_access);
        console.log('admin_access:', policyData.data.admin_access);
        console.log('Permission count:', policyData.data.permissions?.length || 0);

        // 4. Get all permissions for this policy
        console.log(`\n📋 Getting all permissions for policy ${linkedPolicyId}...`);
        const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${linkedPolicyId}`, {
            headers: authHeaders
        });
        const permsData = await permsRes.json();
        console.log('Permissions:');
        for (const perm of permsData.data || []) {
            console.log(`  - [${perm.action}] ${perm.collection}: fields=${JSON.stringify(perm.fields)}`);
        }

        // 5. Check if there are permissions on other policy
        console.log('\n📋 Checking all policies...');
        const allPoliciesRes = await fetch(`${URL}/policies?limit=-1`, {
            headers: authHeaders
        });
        const allPoliciesData = await allPoliciesRes.json();
        for (const p of allPoliciesData.data || []) {
            console.log(`\n  Policy: ${p.name} (${p.id})`);
            console.log(`    app_access: ${p.app_access}, admin_access: ${p.admin_access}`);

            // Get permissions for this policy
            const pPermsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${p.id}`, {
                headers: authHeaders
            });
            const pPermsData = await pPermsRes.json();
            console.log(`    Permissions: ${pPermsData.data?.length || 0}`);
            for (const perm of pPermsData.data || []) {
                console.log(`      - [${perm.action}] ${perm.collection}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

investigate();
