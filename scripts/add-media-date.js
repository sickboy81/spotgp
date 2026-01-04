// Add date_created to media collection
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addDateCreated() {
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

        // Check existing fields
        console.log('\n📋 Checking media fields...');
        const fieldsRes = await fetch(`${URL}/fields/media`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const existingFields = new Set((fieldsData.data || []).map(f => f.field));
        console.log('  Existing:', Array.from(existingFields).join(', '));

        // Add date_created if missing
        if (!existingFields.has('date_created')) {
            console.log('\n➕ Adding date_created field...');
            const res = await fetch(`${URL}/fields/media`, {
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
            console.log(`  ${res.ok ? '✅ Created' : '❌ Failed'}`);
        } else {
            console.log('\n⏭️ date_created already exists');
        }

        // Test
        console.log('\n📋 Testing media sort...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });
        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        const mediaRes = await fetch(`${URL}/items/media?sort=-date_created&limit=1`, { headers: userHeaders });
        console.log(`  media (sort -date_created): ${mediaRes.status} ${mediaRes.ok ? '✅' : '❌'}`);

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

addDateCreated();
