// Force create date_created field
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function createFields() {
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

        // Check current fields
        console.log('\n📋 Current fields:');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const existingFields = (fieldsData.data || []).map(f => f.field);
        console.log(existingFields.join(', '));

        // Create date_created if missing
        if (!existingFields.includes('date_created')) {
            console.log('\n➕ Creating date_created field...');
            const res = await fetch(`${URL}/fields/profiles`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    field: 'date_created',
                    type: 'timestamp',
                    meta: {
                        special: ['date-created'],
                        interface: 'datetime',
                        display: 'datetime',
                        readonly: true
                    }
                })
            });

            console.log(`  Status: ${res.status}`);
            if (!res.ok) {
                const err = await res.text();
                console.log(`  Error: ${err}`);
            } else {
                console.log('  ✅ Created!');
            }
        } else {
            console.log('\n✅ date_created already exists');
        }

        // Create user if missing
        if (!existingFields.includes('user')) {
            console.log('\n➕ Creating user field...');
            const res = await fetch(`${URL}/fields/profiles`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    field: 'user',
                    type: 'uuid',
                    schema: {
                        is_nullable: true,
                        foreign_key_table: 'directus_users',
                        foreign_key_column: 'id'
                    },
                    meta: {
                        special: ['m2o'],
                        interface: 'select-dropdown-m2o'
                    }
                })
            });

            console.log(`  Status: ${res.status}`);
            if (!res.ok) {
                const err = await res.text();
                console.log(`  Error: ${err}`);
            } else {
                console.log('  ✅ Created!');
            }
        } else {
            console.log('\n✅ user already exists');
        }

        // Final verification
        console.log('\n📋 Final fields:');
        const finalRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const finalData = await finalRes.json();
        const finalFields = (finalData.data || []).map(f => f.field);
        console.log(finalFields.join(', '));

        console.log('\n📋 Checking key fields:');
        console.log(`  user: ${finalFields.includes('user') ? '✅' : '❌'}`);
        console.log(`  date_created: ${finalFields.includes('date_created') ? '✅' : '❌'}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createFields();
