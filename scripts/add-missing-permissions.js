// Add missing permissions to the CORRECT policy (App Access)
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

// Missing permissions that need to be added
const MISSING_PERMISSIONS = [
    // notifications
    { collection: 'notifications', action: 'create', fields: ['*'], permissions: null },
    { collection: 'notifications', action: 'read', fields: ['*'], permissions: null },
    { collection: 'notifications', action: 'update', fields: ['*'], permissions: null },
    // profile_views
    { collection: 'profile_views', action: 'create', fields: ['*'], permissions: null },
    { collection: 'profile_views', action: 'read', fields: ['*'], permissions: null },
    // profile_clicks
    { collection: 'profile_clicks', action: 'create', fields: ['*'], permissions: null },
    { collection: 'profile_clicks', action: 'read', fields: ['*'], permissions: null },
    // directus_users update (for user to update their own data)
    { collection: 'directus_users', action: 'update', fields: ['*'], permissions: null },
    // directus_files (for uploading photos)
    { collection: 'directus_files', action: 'read', fields: ['*'], permissions: null },
    { collection: 'directus_files', action: 'create', fields: ['*'], permissions: null },
    { collection: 'directus_files', action: 'update', fields: ['*'], permissions: null },
];

async function addMissingPermissions() {
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

        // 2. Current permissions
        console.log('📋 Current permissions on App Access policy:');
        const currentRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, {
            headers: authHeaders
        });
        const currentData = await currentRes.json();
        const existingPerms = new Set();
        for (const p of currentData.data || []) {
            const key = `${p.collection}:${p.action}`;
            existingPerms.add(key);
            console.log(`  ✓ [${p.action}] ${p.collection}`);
        }

        // 3. Add missing permissions
        console.log('\n🔧 Adding missing permissions...');
        for (const perm of MISSING_PERMISSIONS) {
            const key = `${perm.collection}:${perm.action}`;
            if (existingPerms.has(key)) {
                console.log(`  ⏭️ [${perm.action}] ${perm.collection} - already exists`);
                continue;
            }

            console.log(`  ➕ [${perm.action}] ${perm.collection}...`);
            const createRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: APP_ACCESS_POLICY_ID,
                    collection: perm.collection,
                    action: perm.action,
                    fields: perm.fields,
                    permissions: perm.permissions,
                    validation: null,
                    presets: null
                })
            });

            if (!createRes.ok) {
                const errText = await createRes.text();
                console.log(`    ❌ Failed: ${errText}`);
            } else {
                console.log(`    ✅ Created`);
            }
        }

        // 4. Verify
        console.log('\n📋 Final permissions on App Access policy:');
        const finalRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, {
            headers: authHeaders
        });
        const finalData = await finalRes.json();
        for (const p of finalData.data || []) {
            console.log(`  ✓ [${p.action}] ${p.collection}`);
        }
        console.log(`\nTotal permissions: ${finalData.data?.length || 0}`);

        console.log('\n💡 IMPORTANT: Users MUST logout and login again to get a new token!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addMissingPermissions();
