// Deep investigation of why authentication still fails
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const GHOST_POLICY_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';
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

        // 2. Check the App User role details
        console.log('📋 Checking App User role configuration...');
        const roleRes = await fetch(`${URL}/roles/${APP_USER_ROLE_ID}?fields=*,policies.*`, {
            headers: authHeaders
        });
        const roleData = await roleRes.json();
        console.log('Role data:', JSON.stringify(roleData.data, null, 2));

        // 3. Check if app_access and admin_access are set on the role
        console.log('\n📋 Checking role access flags...');
        if (roleData.data) {
            console.log('  - Role name:', roleData.data.name);
            console.log('  - app_access:', roleData.data.app_access);
            console.log('  - admin_access:', roleData.data.admin_access);
            console.log('  - policies:', roleData.data.policies?.map(p => p.id || p));
        }

        // 4. Check all permissions for the Ghost Policy
        console.log('\n📋 Checking Ghost Policy permissions...');
        const permRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${GHOST_POLICY_ID}&limit=-1`, {
            headers: authHeaders
        });
        const permData = await permRes.json();
        console.log(`Found ${permData.data?.length || 0} permissions:\n`);

        if (permData.data) {
            for (const p of permData.data) {
                console.log(`  - ${p.collection}.${p.action}: fields=${JSON.stringify(p.fields)}, permissions=${JSON.stringify(p.permissions)}`);
            }
        }

        // 5. Check if there's a PUBLIC role with conflicting permissions
        console.log('\n📋 Checking Public role...');
        const publicRoleRes = await fetch(`${URL}/roles?filter[name][_eq]=Public&fields=*,policies.*`, {
            headers: authHeaders
        });
        const publicRoleData = await publicRoleRes.json();
        if (publicRoleData.data?.length > 0) {
            console.log('Public role:', JSON.stringify(publicRoleData.data[0], null, 2));
        } else {
            console.log('No Public role found');
        }

        // 6. Check $t:public_label role (Directus uses this as default public)
        console.log('\n📋 Listing all roles...');
        const allRolesRes = await fetch(`${URL}/roles?fields=id,name,app_access,admin_access`, {
            headers: authHeaders
        });
        const allRolesData = await allRolesRes.json();
        console.log('All roles:');
        for (const role of allRolesData.data || []) {
            console.log(`  - ${role.name || role.id}: app_access=${role.app_access}, admin_access=${role.admin_access}`);
        }

        // 7. Check if Ghost Policy is actually linked to the role
        console.log('\n📋 Checking role-policy link...');
        const rolePolicyRes = await fetch(`${URL}/items/directus_roles/${APP_USER_ROLE_ID}?fields=policies.*`, {
            headers: authHeaders
        });
        const rolePolicyData = await rolePolicyRes.json();
        console.log('Role policies:', JSON.stringify(rolePolicyData.data?.policies, null, 2));

        // 8. Test getting a user to see if their role is valid
        console.log('\n📋 Finding a user with App User role...');
        const usersRes = await fetch(`${URL}/users?filter[role][_eq]=${APP_USER_ROLE_ID}&limit=1&fields=id,email,role`, {
            headers: authHeaders
        });
        const usersData = await usersRes.json();
        if (usersData.data?.length > 0) {
            console.log('Test user:', JSON.stringify(usersData.data[0], null, 2));
        }

        // 9. Check if role has app_access - THIS IS CRITICAL
        console.log('\n🔑 CRITICAL: Checking app_access for App User role...');
        if (roleData.data?.app_access === true) {
            console.log('✅ app_access is TRUE - role can access frontend');
        } else if (roleData.data?.app_access === false) {
            console.log('❌ app_access is FALSE - role CANNOT access frontend!');
            console.log('   This is likely the root cause of 401 errors!');
        } else {
            console.log('⚠️ app_access is undefined/null - this may cause issues');
        }

        // 10. Try to enable app_access if it's not set
        if (roleData.data?.app_access !== true) {
            console.log('\n🔧 Attempting to enable app_access...');
            const updateRes = await fetch(`${URL}/roles/${APP_USER_ROLE_ID}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ app_access: true })
            });
            const updateData = await updateRes.json();
            console.log('Update result:', JSON.stringify(updateData, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

investigate();
