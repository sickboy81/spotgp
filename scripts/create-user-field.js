// Check if user field exists and create it if not
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function checkAndCreateUserField() {
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

        // Get ALL fields from profiles  
        const res = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const data = await res.json();
        const fields = data.data || [];

        // List all field names
        console.log('\nField names in profiles:', fields.map(f => f.field).join(', '));

        // Check for user field
        const hasUserField = fields.some(f => f.field === 'user');
        console.log('\nHas "user" field:', hasUserField);

        if (!hasUserField) {
            console.log('\n🔧 Creating "user" field in profiles collection...');

            const createFieldRes = await fetch(`${URL}/fields/profiles`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    field: 'user',
                    type: 'uuid',
                    schema: {
                        name: 'user',
                        table: 'profiles',
                        data_type: 'uuid',
                        is_nullable: true,
                        is_unique: false,
                        foreign_key_table: 'directus_users',
                        foreign_key_column: 'id'
                    },
                    meta: {
                        interface: 'select-dropdown-m2o',
                        display: 'related-values',
                        special: ['m2o'],
                        required: false,
                        options: {
                            template: '{{email}}'
                        },
                        display_options: {
                            template: '{{email}}'
                        }
                    }
                })
            });

            if (createFieldRes.ok) {
                console.log('✅ "user" field created successfully!');
            } else {
                const errText = await createFieldRes.text();
                console.log('❌ Failed to create field:', errText);
            }
        }

        // Now get a sample profile to see what fields exist
        console.log('\n📋 Sample profile from database:');
        const profileRes = await fetch(`${URL}/items/profiles?limit=1&fields=*`, { headers: authHeaders });
        const profileData = await profileRes.json();
        if (profileData.data?.[0]) {
            console.log('Profile keys:', Object.keys(profileData.data[0]).join(', '));
        }

        // Also check if there's a field like user_created or owner
        const alternativeFields = fields.filter(f =>
            f.field.includes('user') ||
            f.field.includes('owner') ||
            f.field.includes('created_by') ||
            f.field === 'user_created'
        );
        console.log('\nAlternative user-related fields:', alternativeFields.map(f => f.field).join(', ') || 'none');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAndCreateUserField();
