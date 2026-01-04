// Add public read permissions for media and profiles
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addPublicPermissions() {
    console.log('='.repeat(60));
    console.log('🔓 ADDING PUBLIC PERMISSIONS');
    console.log('='.repeat(60));

    // 1. Login as admin
    console.log('\n📋 Step 1: Admin login');
    const loginRes = await fetch(`${URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginRes.ok) {
        console.log('  ❌ Admin login failed!');
        return;
    }

    const { data: { access_token } } = await loginRes.json();
    console.log(`  ✅ Admin login successful!`);
    const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    };

    // 2. Check for public role
    console.log('\n📋 Step 2: Finding Public role');
    const rolesRes = await fetch(`${URL}/roles`, { headers });
    const rolesData = await rolesRes.json();
    console.log('  Roles found:', rolesData.data?.map(r => `${r.name} (${r.id})`));

    // Find public role (null role_id means public access)
    // In Directus 11, we need to check access table with role = null for public
    console.log('\n📋 Step 3: Checking public access policy');
    const accessRes = await fetch(`${URL}/access?filter[role][_null]=true`, { headers });
    const accessData = await accessRes.json();
    console.log('  Public access entries:', accessData.data?.length || 0);

    let publicPolicyId = null;

    if (accessData.data && accessData.data.length > 0) {
        publicPolicyId = accessData.data[0].policy;
        console.log(`  ✅ Found public policy: ${publicPolicyId}`);
    } else {
        console.log('  No public access found, need to create one...');

        // First create a public policy
        console.log('\n📋 Creating public policy...');
        const policyRes = await fetch(`${URL}/policies`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Public Access',
                description: 'Policy for unauthenticated public access',
                app_access: false,
                admin_access: false
            })
        });

        if (policyRes.ok) {
            const policyData = await policyRes.json();
            publicPolicyId = policyData.data.id;
            console.log(`  ✅ Created public policy: ${publicPolicyId}`);

            // Link policy to public (null role)
            const linkRes = await fetch(`${URL}/access`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    role: null,
                    policy: publicPolicyId
                })
            });

            if (linkRes.ok) {
                console.log('  ✅ Linked policy to public access');
            } else {
                console.log('  ❌ Failed to link policy:', await linkRes.text());
            }
        } else {
            console.log('  ❌ Failed to create policy:', await policyRes.text());
            return;
        }
    }

    // 3. Get existing public permissions
    console.log('\n📋 Step 4: Checking existing public permissions');
    const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${publicPolicyId}`, { headers });
    const permsData = await permsRes.json();
    const existingPerms = permsData.data || [];
    console.log('  Existing public permissions:', existingPerms.length);
    existingPerms.forEach(p => console.log(`    - ${p.collection} (${p.action})`));

    // 4. Define required public permissions
    const requiredPublicPerms = [
        { collection: 'profiles', action: 'read' },
        { collection: 'media', action: 'read' },
        { collection: 'profile_views', action: 'create' },  // Allow anonymous view tracking
        { collection: 'profile_clicks', action: 'create' }, // Allow anonymous click tracking
    ];

    // 5. Add missing permissions
    console.log('\n📋 Step 5: Adding missing public permissions');
    for (const perm of requiredPublicPerms) {
        const exists = existingPerms.some(p => p.collection === perm.collection && p.action === perm.action);
        if (exists) {
            console.log(`  ⏭️ ${perm.collection} ${perm.action} - already exists`);
            continue;
        }

        const createRes = await fetch(`${URL}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                policy: publicPolicyId,
                collection: perm.collection,
                action: perm.action,
                permissions: null,
                validation: null,
                fields: ['*']
            })
        });

        if (createRes.ok) {
            console.log(`  ✅ Added ${perm.collection} ${perm.action}`);
        } else {
            console.log(`  ❌ Failed ${perm.collection} ${perm.action}:`, await createRes.text());
        }
    }

    // 6. Test public access (no auth)
    console.log('\n📋 Step 6: Testing public access (no auth)');
    const tests = [
        { name: 'profiles', url: `${URL}/items/profiles?limit=1` },
        { name: 'media', url: `${URL}/items/media?limit=1` },
    ];

    for (const t of tests) {
        const res = await fetch(t.url);  // NO auth header
        console.log(`  ${res.ok ? '✅' : '❌'} ${t.name}: ${res.status}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.log(`      Error: ${err.errors?.[0]?.message || 'Unknown'}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DONE!');
    console.log('='.repeat(60));
}

addPublicPermissions().catch(console.error);
