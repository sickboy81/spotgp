
import { createDirectus, rest, login, createRole, createPermission, readRoles, readUsers, updateUser, staticToken, authentication } from '@directus/sdk';
import 'dotenv/config';

// Load env vars
// Found in vite.config.ts: target: 'https://base.spotgp.com'
let URL = 'https://base.spotgp.com';
console.log(`Connecting to ${URL}...`);
// The user provided these in .env file seen previously
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;


const client = createDirectus(URL)
    .with(authentication()) // Use default session/json auth
    .with(rest());

async function main() {
    try {
        if (!EMAIL || !PASSWORD) {
            throw new Error('Missing Admin Email or Password in env');
        }

        console.log('Authenticating via fetch...');
        // Manual fetch to avoid SDK argument issues
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Login failed: ${response.status} ${errText} `);
        }

        const json = await response.json();
        const accessToken = json.data?.access_token;

        if (!accessToken) {
            throw new Error('No access token in login response');
        }

        // Manually set token on client
        await client.setToken(accessToken);
        console.log('Logged in successfully!');

        // 1. Check/Create Role "App User"
        console.log('Checking for "App User" role...');
        const roles = await client.request(readRoles({
            filter: { name: { _eq: 'App User' } }
        }));

        let roleId;
        if (roles && roles.length > 0) {
            console.log('"App User" role already exists.');
            roleId = roles[0].id;
        } else {
            console.log('Creating "App User" role...');
            const newRole = await client.request(createRole({
                name: 'App User',
                icon: 'verified_user',
                description: 'Default role for app users/advertisers',
                app_access: true, // Allow app access
                admin_access: false
            }));
            roleId = newRole.id;
            console.log(`Role created with ID: ${roleId} `);
        }

        // 2. Create Permissions
        const collections = ['profiles'];
        const actions = ['create', 'read', 'update', 'delete'];

        for (const collection of collections) {
            for (const action of actions) {
                try {
                    console.log(`Granting ${action} on ${collection}...`);
                    // We try to create. If it fails (exists), we catch it.
                    // Ideally we check existence first but create is faster for script
                    await client.request(createPermission({
                        role: roleId,
                        collection: collection,
                        action: action,
                        fields: ['*'], // Full access to fields
                        permissions: {}, // No row-level restriction (or add { user: { _eq: '$CURRENT_USER' } })
                        // For 'profiles', usually users should only edit THEIR profile.
                        // Let's set permissions: { user: { _eq: '$CURRENT_USER' } }
                    }));
                } catch (e) {
                    // Ignore if permission already exists
                    if (e.errors?.[0]?.extensions?.code !== 'RECORD_NOT_UNIQUE') {
                        console.log(`Permission ${action} on ${collection} might represent loaded or error: `, e.message);
                    }
                }
            }
        }

        // Also give read access to public/files if needed? 
        // We use R2 so maybe irrelevant, but users table read is sometimes needed.

        // 3. Assign Role to Users without Role (or specific user?)
        // Let's find users with NO role and assign this one.
        console.log('Checking users without role...');
        const users = await client.request(readUsers({
            filter: { role: { _null: true } },
            limit: 100
        }));

        console.log(`Found ${users.length} users without role.`);
        for (const user of users) {
            // Skip if it's the admin user (usually admin has role, but just in case)
            if (user.email === EMAIL) continue;

            console.log(`Assigning "App User" role to ${user.email}...`);
            await client.request(updateUser(user.id, {
                role: roleId
            }));
        }

        console.log('Done! Setup complete.');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
