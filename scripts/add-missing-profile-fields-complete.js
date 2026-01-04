// Add all missing fields to profiles collection
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addMissingProfileFields() {
    console.log('='.repeat(60));
    console.log('📝 ADDING MISSING PROFILE FIELDS');
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

    // 2. Get existing fields
    console.log('\n📋 Step 2: Checking existing fields');
    const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers });
    const fieldsData = await fieldsRes.json();
    const existingFields = fieldsData.data?.map(f => f.field) || [];
    console.log(`  Found ${existingFields.length} existing fields`);

    // 3. Define all required fields
    const requiredFields = [
        // Basic info
        { field: 'title', type: 'string', schema: { max_length: 255 } },
        { field: 'bio', type: 'text' },
        { field: 'username', type: 'string', schema: { max_length: 100, is_unique: true } },
        { field: 'phone', type: 'string', schema: { max_length: 20 } },

        // Physical attributes
        { field: 'height', type: 'string', schema: { max_length: 50 } },
        { field: 'stature', type: 'json' },
        { field: 'breastType', type: 'json' },
        { field: 'pubisType', type: 'json' },

        // Settings
        { field: 'chat_enabled', type: 'boolean', schema: { default_value: true } },
        { field: 'certified_masseuse', type: 'boolean', schema: { default_value: false } },

        // Services
        { field: 'escortServices', type: 'json' },
        { field: 'escortSpecialServices', type: 'json' },
        { field: 'oralSex', type: 'string', schema: { max_length: 100 } },
        { field: 'onlineServices', type: 'json' },
        { field: 'onlineServiceTo', type: 'json' },

        // Map fields
        { field: 'map_location_type', type: 'string', schema: { max_length: 50, default_value: 'exact' } },
        { field: 'map_region_string', type: 'string', schema: { max_length: 255 } },
    ];

    // 4. Add missing fields
    console.log('\n📋 Step 3: Adding missing fields');
    let addedCount = 0;

    for (const fieldDef of requiredFields) {
        if (existingFields.includes(fieldDef.field)) {
            console.log(`  ⏭️  ${fieldDef.field} - already exists`);
            continue;
        }

        const createRes = await fetch(`${URL}/fields/profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                field: fieldDef.field,
                type: fieldDef.type,
                schema: fieldDef.schema || {},
                meta: {
                    interface: fieldDef.type === 'boolean' ? 'boolean' :
                        fieldDef.type === 'json' ? 'input-code' :
                            fieldDef.type === 'text' ? 'input-multiline' : 'input',
                    options: fieldDef.type === 'json' ? { language: 'json' } : null
                }
            })
        });

        if (createRes.ok) {
            console.log(`  ✅ Added ${fieldDef.field} (${fieldDef.type})`);
            addedCount++;
        } else {
            const error = await createRes.text();
            console.log(`  ❌ Failed ${fieldDef.field}: ${error}`);
        }
    }

    // 5. Update permissions to include new fields
    console.log('\n📋 Step 4: Updating permissions');
    const APP_ACCESS_POLICY = '3043f967-c650-4c42-bddc-efc84f1ffaca';

    // Get all permissions for profiles
    const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY}&filter[collection][_eq]=profiles`, { headers });
    const permsData = await permsRes.json();
    const permissions = permsData.data || [];

    console.log(`  Found ${permissions.length} permissions for profiles`);

    // Update each permission to use fields: ["*"]
    for (const perm of permissions) {
        const updateRes = await fetch(`${URL}/permissions/${perm.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                fields: ['*']
            })
        });

        if (updateRes.ok) {
            console.log(`  ✅ Updated ${perm.action} permission`);
        } else {
            console.log(`  ❌ Failed to update ${perm.action} permission`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 DONE! Added ${addedCount} new fields`);
    console.log('='.repeat(60));
    console.log('\nTry creating an ad again!');
}

addMissingProfileFields().catch(console.error);
