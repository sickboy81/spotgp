import 'dotenv/config';

const DIRECTUS_URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

async function checkBodyFields() {
    try {
        console.log('Authenticating as admin...');

        // 1. Login
        const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.data.access_token;
        console.log('Login successful.');

        // 2. Fetch Fields
        console.log('Fetching fields for collection: profiles');
        const fieldsResponse = await fetch(`${DIRECTUS_URL}/fields/profiles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!fieldsResponse.ok) {
            throw new Error(`Failed to fetch fields: ${fieldsResponse.statusText}`);
        }

        const fieldsData = await fieldsResponse.json();
        const fields = fieldsData.data;

        // 3. Filter for body fields
        const relevantFields = fields.filter(f =>
            ['height', 'weight', 'stature', 'peso', 'altura'].includes(f.field)
        );

        if (relevantFields.length > 0) {
            console.log('✅ Found relevant fields:', relevantFields.map(f => f.field));
            console.log('Details:', JSON.stringify(relevantFields.map(f => ({ field: f.field, type: f.type })), null, 2));
        } else {
            console.log('❌ No height/weight fields found in profiles collection.');
            console.log('Available fields:', fields.map(f => f.field).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkBodyFields();
