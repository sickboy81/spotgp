// Add ALL missing fields from ProfileData interface
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addAllProfileFields() {
    console.log('='.repeat(60));
    console.log('📝 ADDING ALL MISSING PROFILE FIELDS');
    console.log('='.repeat(60));

    const loginRes = await fetch(`${URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const { data: { access_token } } = await loginRes.json();
    const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    };

    // Get existing fields
    const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers });
    const fieldsData = await fieldsRes.json();
    const existingFields = fieldsData.data?.map(f => f.field) || [];
    console.log(`\n✅ Found ${existingFields.length} existing fields\n`);

    // ALL fields from ProfileData
    const allFields = [
        // Basic info
        { field: 'category', type: 'string' },
        { field: 'display_name', type: 'string' },
        { field: 'title', type: 'string' },
        { field: 'bio', type: 'text' },
        { field: 'username', type: 'string', schema: { is_unique: true } },

        // Location
        { field: 'city', type: 'string' },
        { field: 'state', type: 'string' },
        { field: 'neighborhood', type: 'string' },
        { field: 'street_address', type: 'string' },
        { field: 'address_reference', type: 'string' },
        { field: 'latitude', type: 'float' },
        { field: 'longitude', type: 'float' },

        // Contact
        { field: 'phone', type: 'string' },
        { field: 'telegram', type: 'string' },
        { field: 'instagram', type: 'string' },
        { field: 'twitter', type: 'string' },

        // Pricing
        { field: 'price', type: 'integer' },
        { field: 'prices', type: 'json' },

        // Physical attributes
        { field: 'age', type: 'integer' },
        { field: 'gender', type: 'string' },
        { field: 'height', type: 'string' },
        { field: 'weight', type: 'string' },
        { field: 'hairColor', type: 'json' },
        { field: 'bodyType', type: 'json' },
        { field: 'ethnicity', type: 'string' },
        { field: 'stature', type: 'json' },
        { field: 'breastType', type: 'json' },
        { field: 'pubisType', type: 'json' },

        // Services
        { field: 'services', type: 'json' },
        { field: 'paymentMethods', type: 'json' },
        { field: 'hasPlace', type: 'boolean' },
        { field: 'videoCall', type: 'boolean' },
        { field: 'chat_enabled', type: 'boolean', schema: { default_value: true } },

        // Schedule
        { field: 'schedule_24h', type: 'boolean' },
        { field: 'schedule_from', type: 'string' },
        { field: 'schedule_to', type: 'string' },
        { field: 'schedule_same_everyday', type: 'boolean' },
        { field: 'weekly_schedule', type: 'json' },

        // Media
        { field: 'audio_url', type: 'string' },

        // Massage specific
        { field: 'massageTypes', type: 'json' },
        { field: 'otherServices', type: 'json' },
        { field: 'happyEnding', type: 'json' },
        { field: 'facilities', type: 'json' },
        { field: 'serviceTo', type: 'json' },
        { field: 'serviceLocations', type: 'json' },
        { field: 'certified_masseuse', type: 'boolean' },

        // Escort specific
        { field: 'escortServices', type: 'json' },
        { field: 'escortSpecialServices', type: 'json' },
        { field: 'oralSex', type: 'string' },

        // Online specific
        { field: 'onlineServices', type: 'json' },
        { field: 'onlineServiceTo', type: 'json' },
        { field: 'virtualFantasies', type: 'json' },
        { field: 'forSale', type: 'json' },

        // Map fields
        { field: 'map_address', type: 'string' },
        { field: 'map_coordinates', type: 'json' },
        { field: 'map_location_type', type: 'string', schema: { default_value: 'exact' } },
        { field: 'map_region_string', type: 'string' },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const fieldDef of allFields) {
        if (existingFields.includes(fieldDef.field)) {
            skippedCount++;
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
                            fieldDef.type === 'text' ? 'input-multiline' :
                                fieldDef.type === 'float' ? 'input' :
                                    fieldDef.type === 'integer' ? 'input' : 'input',
                    options: fieldDef.type === 'json' ? { language: 'json' } : null
                }
            })
        });

        if (createRes.ok) {
            console.log(`  ✅ ${fieldDef.field} (${fieldDef.type})`);
            addedCount++;
        } else {
            const error = await createRes.text();
            console.log(`  ❌ ${fieldDef.field}: ${error.substring(0, 100)}`);
        }
    }

    // Update permissions
    console.log('\n📋 Updating permissions...');
    const APP_ACCESS_POLICY = '3043f967-c650-4c42-bddc-efc84f1ffaca';
    const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY}&filter[collection][_eq]=profiles`, { headers });
    const permsData = await permsRes.json();

    for (const perm of permsData.data || []) {
        await fetch(`${URL}/permissions/${perm.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields: ['*'] })
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 DONE!`);
    console.log(`   Added: ${addedCount} fields`);
    console.log(`   Skipped: ${skippedCount} (already exist)`);
    console.log(`   Total: ${allFields.length} fields`);
    console.log('='.repeat(60));
}

addAllProfileFields().catch(console.error);
