// Complete field check for profiles collection
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function checkAllFields() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const { data: { access_token } } = await loginRes.json();
        const authHeaders = { 'Authorization': `Bearer ${access_token}` };

        // Get ALL fields from profiles
        const res = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const data = await res.json();

        console.log('\n=== ALL FIELDS IN PROFILES COLLECTION ===\n');
        const fields = data.data || [];
        for (const f of fields) {
            console.log(`${f.field} (${f.type})`);
        }
        console.log(`\nTotal fields: ${fields.length}`);

        // Check specifically for "user" field
        const userField = fields.find(f => f.field === 'user');
        console.log('\n=== USER FIELD CHECK ===');
        if (userField) {
            console.log('✅ "user" field EXISTS');
            console.log(JSON.stringify(userField, null, 2));
        } else {
            console.log('❌ "user" field DOES NOT EXIST');
            console.log('\nThese are the available M2O or relation fields:');
            for (const f of fields) {
                if (f.type === 'uuid' || f.schema?.foreign_key_table) {
                    console.log(`  - ${f.field}`);
                }
            }
        }

        // Get a sample profile
        console.log('\n=== SAMPLE PROFILE ===');
        const profileRes = await fetch(`${URL}/items/profiles?limit=1`, { headers: authHeaders });
        const profileData = await profileRes.json();
        if (profileData.data?.[0]) {
            console.log('Keys:', Object.keys(profileData.data[0]).join(', '));
            console.log('Sample:', JSON.stringify(profileData.data[0], null, 2));
        } else {
            console.log('No profiles found');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAllFields();
