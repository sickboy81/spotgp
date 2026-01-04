// Add missing fields to profiles collection
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addMissingFields() {
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

        // Get current fields
        console.log('\n📋 Current fields in profiles:');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const existingFields = (fieldsData.data || []).map(f => f.field);
        console.log(`  ${existingFields.join(', ')}`);

        // Fields to add
        const fieldsToAdd = [
            {
                name: 'user',
                definition: {
                    field: 'user',
                    type: 'uuid',
                    schema: {
                        is_nullable: true,
                        is_unique: false,
                        foreign_key_table: 'directus_users',
                        foreign_key_column: 'id'
                    },
                    meta: {
                        special: ['m2o'],
                        interface: 'select-dropdown-m2o',
                        display: 'related-values',
                        options: {
                            template: '{{email}}'
                        }
                    }
                }
            },
            {
                name: 'date_created',
                definition: {
                    field: 'date_created',
                    type: 'timestamp',
                    schema: {
                        is_nullable: true,
                        default_value: 'now()'
                    },
                    meta: {
                        special: ['date-created'],
                        interface: 'datetime',
                        display: 'datetime',
                        readonly: true,
                        width: 'half'
                    }
                }
            },
            {
                name: 'date_updated',
                definition: {
                    field: 'date_updated',
                    type: 'timestamp',
                    schema: {
                        is_nullable: true
                    },
                    meta: {
                        special: ['date-updated'],
                        interface: 'datetime',
                        display: 'datetime',
                        readonly: true,
                        width: 'half'
                    }
                }
            }
        ];

        // Create missing fields
        for (const fieldInfo of fieldsToAdd) {
            if (existingFields.includes(fieldInfo.name)) {
                console.log(`\n⏭️ Field '${fieldInfo.name}' already exists`);
                continue;
            }

            console.log(`\n➕ Creating field '${fieldInfo.name}'...`);
            const createRes = await fetch(`${URL}/fields/profiles`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(fieldInfo.definition)
            });

            if (createRes.ok) {
                console.log(`  ✅ Created successfully`);
            } else {
                const errText = await createRes.text();
                console.log(`  ❌ Failed: ${errText}`);
            }
        }

        // Verify
        console.log('\n📋 Updated fields in profiles:');
        const newFieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const newFieldsData = await newFieldsRes.json();
        console.log(`  ${(newFieldsData.data || []).map(f => f.field).join(', ')}`);

        // Now update existing profiles to set user field
        console.log('\n📋 Updating existing profiles with user field...');

        // Get all profiles
        const profilesRes = await fetch(`${URL}/items/profiles?limit=-1&fields=id`, { headers: authHeaders });
        const profilesData = await profilesRes.json();
        const profileIds = profilesData.data?.map(p => p.id) || [];
        console.log(`  Found ${profileIds.length} profiles`);

        // We need to set the user for the test profile
        // The frontend shows profile filtering by user 26438ac6-9d0e-4050-8a93-3f5906d5ca32
        if (profileIds.length > 0) {
            console.log(`  Updating first profile to belong to user 26438ac6-9d0e-4050-8a93-3f5906d5ca32...`);
            const updateRes = await fetch(`${URL}/items/profiles/${profileIds[0]}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({
                    user: '26438ac6-9d0e-4050-8a93-3f5906d5ca32'
                })
            });

            if (updateRes.ok) {
                console.log(`  ✅ Profile updated`);
            } else {
                const errText = await updateRes.text();
                console.log(`  ❌ Failed: ${errText}`);
            }
        }

        // Test the filter now
        console.log('\n📋 Testing filter[user] as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });

        if (userLoginRes.ok) {
            const { data: { access_token: userToken } } = await userLoginRes.json();
            const userHeaders = { 'Authorization': `Bearer ${userToken}` };

            const filterRes = await fetch(`${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32`, { headers: userHeaders });
            console.log(`  Status: ${filterRes.status} ${filterRes.ok ? '✅' : '❌'}`);

            if (filterRes.ok) {
                const data = await filterRes.json();
                console.log(`  Found ${data.data?.length || 0} profiles`);
            } else {
                const errText = await filterRes.text();
                console.log(`  Error: ${errText.substring(0, 200)}`);
            }
        }

        console.log('\n✅ Done! Users must logout and login again.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

addMissingFields();
