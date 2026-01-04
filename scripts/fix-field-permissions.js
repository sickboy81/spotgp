const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const GHOST_POLICY_ID = '084586e1-0e33-460b-a02b-b6188aa7390d';

async function fixFieldPermissions() {
    try {
        // Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const { data } = await loginRes.json();
        const token = data.access_token;
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // First, DELETE all existing permissions for Ghost Policy
        console.log('🗑️ Deleting existing permissions for Ghost Policy...');
        const existingPermsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${GHOST_POLICY_ID}&limit=-1`, {
            headers: authHeaders
        });
        const existingPerms = await existingPermsRes.json();

        for (const perm of existingPerms.data || []) {
            await fetch(`${URL}/permissions/${perm.id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            console.log(`   Deleted permission: ${perm.collection}.${perm.action}`);
        }

        console.log('\n✅ Old permissions deleted\n');

        // Now create NEW permissions with NULL permissions rules (no filtering)
        console.log('📋 Creating new permissions with NULL rules...\n');

        const newPermissions = [
            // directus_roles - read only
            {
                collection: 'directus_roles',
                action: 'read',
                fields: ['*'],
                permissions: null,  // NULL = no filtering, allow all
                validation: null,
                presets: null
            },
            // directus_users - read and update with NULL filters
            {
                collection: 'directus_users',
                action: 'read',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'directus_users',
                action: 'update',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            // profiles - full access with NULL filters
            {
                collection: 'profiles',
                action: 'create',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'profiles',
                action: 'read',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'profiles',
                action: 'update',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            // notifications - full access with NULL filters
            {
                collection: 'notifications',
                action: 'create',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'notifications',
                action: 'read',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'notifications',
                action: 'update',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            // profile_views - create and read with NULL filters
            {
                collection: 'profile_views',
                action: 'create',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'profile_views',
                action: 'read',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            // profile_clicks - create and read with NULL filters
            {
                collection: 'profile_clicks',
                action: 'create',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            },
            {
                collection: 'profile_clicks',
                action: 'read',
                fields: ['*'],
                permissions: null,
                validation: null,
                presets: null
            }
        ];

        for (const perm of newPermissions) {
            const createRes = await fetch(`${URL}/permissions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    policy: GHOST_POLICY_ID,
                    ...perm
                })
            });

            if (createRes.ok) {
                console.log(`✅ ${perm.collection}.${perm.action}`);
            } else {
                const errText = await createRes.text();
                console.log(`❌ ${perm.collection}.${perm.action}: ${errText.substring(0, 100)}`);
            }
        }

        console.log('\n✅ All permissions recreated with NULL filtering!');
        console.log('\n💡 Users must logout and login to get fresh tokens with new permissions.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixFieldPermissions();
