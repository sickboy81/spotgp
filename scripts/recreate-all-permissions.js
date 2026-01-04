// Complete permission recreation with fields: null
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

const COLLECTIONS_TO_FIX = [
    'profiles',
    'notifications',
    'profile_views',
    'profile_clicks',
    'directus_users',
    'directus_files',
    'directus_roles'
];

async function recreateAllPermissions() {
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

        // Get all current permissions for the policy
        console.log('\n📋 Getting current permissions for App Access policy...');
        const allPermsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&limit=-1`, { headers: authHeaders });
        const allPermsData = await allPermsRes.json();
        console.log(`Found ${allPermsData.data?.length || 0} permissions`);

        // Delete all existing permissions
        console.log('\n🗑️ Deleting all existing permissions...');
        for (const perm of allPermsData.data || []) {
            const delRes = await fetch(`${URL}/permissions/${perm.id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            if (delRes.ok) {
                console.log(`  Deleted: ${perm.action} on ${perm.collection}`);
            }
        }

        // Define all permissions to create
        const permissions = [
            // profiles - full access
            { collection: 'profiles', action: 'create' },
            { collection: 'profiles', action: 'read' },
            { collection: 'profiles', action: 'update' },
            { collection: 'profiles', action: 'delete' },
            { collection: 'profiles', action: 'share' },
            // notifications
            { collection: 'notifications', action: 'create' },
            { collection: 'notifications', action: 'read' },
            { collection: 'notifications', action: 'update' },
            // profile_views
            { collection: 'profile_views', action: 'create' },
            { collection: 'profile_views', action: 'read' },
            // profile_clicks
            { collection: 'profile_clicks', action: 'create' },
            { collection: 'profile_clicks', action: 'read' },
            // directus_users
            { collection: 'directus_users', action: 'read' },
            { collection: 'directus_users', action: 'update' },
            // directus_files
            { collection: 'directus_files', action: 'create' },
            { collection: 'directus_files', action: 'read' },
            { collection: 'directus_files', action: 'update' },
            // directus_roles
            { collection: 'directus_roles', action: 'read' },
        ];

        // Create all permissions with fields: null (NOT ["*"])
        console.log('\n✅ Creating new permissions with fields: null...');
        for (const perm of permissions) {
            const createRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: APP_ACCESS_POLICY_ID,
                    collection: perm.collection,
                    action: perm.action,
                    fields: null,  // NULL means ALL fields including system/relational
                    permissions: null,  // No filter restrictions
                    validation: null,
                    presets: null
                })
            });

            if (createRes.ok) {
                console.log(`  ✅ ${perm.action} on ${perm.collection}`);
            } else {
                const errText = await createRes.text();
                console.log(`  ❌ ${perm.action} on ${perm.collection}: ${errText}`);
            }
        }

        // Verify by testing
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            // Test /users/me
            const meRes = await fetch(`${URL}/users/me?fields=*,role.name`, { headers: userHeaders });
            console.log(`  /users/me: ${meRes.status} ${meRes.ok ? '✅' : '❌'}`);

            // Test profiles (no filter)
            const profilesRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: userHeaders });
            console.log(`  /items/profiles: ${profilesRes.status} ${profilesRes.ok ? '✅' : '❌'}`);

            // Test profiles with user filter  
            const filterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`  /items/profiles (user filter): ${filterRes.status} ${filterRes.ok ? '✅' : '❌'}`);
            if (!filterRes.ok) {
                const errText = await filterRes.text();
                console.log(`    Error: ${errText.substring(0, 200)}`);
            }

            // Test notifications
            const notifRes = await fetch(`${URL}/items/notifications?limit=1`, { headers: userHeaders });
            console.log(`  /items/notifications: ${notifRes.status} ${notifRes.ok ? '✅' : '❌'}`);
        }

        console.log('\n✅ Done! Users must logout and login again.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

recreateAllPermissions();
