import 'dotenv/config';

const DIRECTUS_URL = 'https://base.spotgp.com';
const USER_ID = '26438ac6-9d0e-4050-8a93-3f5906d5ca32'; // Joana Maria
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

async function checkUserProfiles() {
    try {
        console.log('Authenticating...');
        const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginResponse.ok) throw new Error('Login failed');
        const { data: { access_token } } = await loginResponse.json();

        console.log(`Searching profiles with name containing "Joana"...`);
        const response = await fetch(`${DIRECTUS_URL}/items/profiles?filter[display_name][_contains]=Joana&fields=id,display_name,ad_id,status,user`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const { data: profiles } = await response.json();

        console.log(`Found ${profiles.length} profiles:`);
        console.table(profiles);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkUserProfiles();
