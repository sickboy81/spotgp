
import { createDirectus, rest, authentication, readRoles, readPolicies, readPermissions } from '@directus/sdk';
import 'dotenv/config';

// Load env vars
const URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

console.log(`Debug script connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        if (!EMAIL || !PASSWORD) throw new Error('Missing credentials');

        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const json = await response.json();
        await client.setToken(json.data.access_token);

        console.log('--- ROLES ---');
        const roles = await client.request(readRoles({ limit: 5 }));
        roles.forEach(r => console.log(`Role: ${r.name} (ID: ${r.id})`));

        console.log('\n--- POLICIES ---');
        try {
            const policies = await client.request(readPolicies({ limit: 5 }));
            policies.forEach(p => console.log(`Policy: ${p.name} (ID: ${p.id})`));
        } catch (e) { console.log('Could not read policies (SDK match?):', e.message); }

        console.log('\n--- APP USER ROLE DETAILS ---');
        const appUser = roles.find(r => r.name === 'App User');
        if (appUser) {
            console.log('App User:', appUser);
            // Check if it has policies field
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
