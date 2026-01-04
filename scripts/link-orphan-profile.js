import 'dotenv/config';

const DIRECTUS_URL = 'https://base.spotgp.com';
const ORPHAN_PROFILE_ID = 2; // ID do perfil órfão encontrado
const CORRECT_USER_ID = '26438ac6-9d0e-4050-8a93-3f5906d5ca32'; // Joana Maria

const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

async function linkProfile() {
    try {
        console.log('Authenticating...');
        const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginResponse.ok) throw new Error('Login failed');
        const { data: { access_token } } = await loginResponse.json();

        console.log(`Linking profile ${ORPHAN_PROFILE_ID} to user ${CORRECT_USER_ID}...`);

        const response = await fetch(`${DIRECTUS_URL}/items/profiles/${ORPHAN_PROFILE_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: CORRECT_USER_ID
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Failed to update profile: ${JSON.stringify(err)}`);
        }

        const result = await response.json();
        console.log('Profile updated successfully:', result.data);

    } catch (error) {
        console.error('Error:', error);
    }
}

linkProfile();
