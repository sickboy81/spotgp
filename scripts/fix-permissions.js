
import { createDirectus, rest, authentication, readRoles, updateRole, createPermission, readPermissions, updatePermission } from '@directus/sdk';
import 'dotenv/config';

// Load env vars
const URL = 'https://base.spotgp.com';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

console.log(`Connecting to ${URL}...`);

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        if (!EMAIL || !PASSWORD) {
            throw new Error('Missing Admin Email or Password in env');
        }

        console.log('Authenticating...');
        const response = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }
        const json = await response.json();
        await client.setToken(json.data.access_token);
        console.log('Logged in successfully!');

        // 1. Get "App User" Role
        console.log('Finding "App User" role...');
        const roles = await client.request(readRoles({
            filter: { name: { _eq: 'App User' } }
        }));

        if (!roles || roles.length === 0) {
            throw new Error('"App User" role not found! Run setup-roles.js first.');
        }
        const appUserRoleId = roles[0].id; // UUID
        console.log(`Found "App User" role ID: ${appUserRoleId}`);

        // 2. Define Permissions to Grant
        // Directus v10+ uses 'directus_permissions' collection.
        // We will try to create permissions. If they fail because they exist, we ignore.

        const permissionsToGrant = [
            // DIRECTUS ROLES (System) - Needed for AuthContext to normalize role names
            { role: appUserRoleId, collection: 'directus_roles', action: 'read', fields: ['*'] },

            // PROFILES
            { role: appUserRoleId, collection: 'profiles', action: 'read', fields: ['*'] },
            { role: appUserRoleId, collection: 'profiles', action: 'create', fields: ['*'] },
            { role: appUserRoleId, collection: 'profiles', action: 'update', fields: ['*'] }, // Ideally restrict to owner

            // NOTIFICATIONS
            { role: appUserRoleId, collection: 'notifications', action: 'read', fields: ['*'] },
            { role: appUserRoleId, collection: 'notifications', action: 'update', fields: ['*'] }, // To mark as read

            // ANALYTICS (Views & Clicks)
            { role: appUserRoleId, collection: 'profile_views', action: 'create', fields: ['*'] },
            { role: appUserRoleId, collection: 'profile_views', action: 'read', fields: ['*'] }, // To show on dashboard

            { role: appUserRoleId, collection: 'profile_clicks', action: 'create', fields: ['*'] },
            { role: appUserRoleId, collection: 'profile_clicks', action: 'read', fields: ['*'] }, // To show on dashboard

            // PUBLIC ACCESS (For Home Page) - Role is null for public usually
            { role: null, collection: 'profiles', action: 'read', fields: ['*'] }
        ];

        for (const perm of permissionsToGrant) {
            const roleName = perm.role ? 'App User' : 'Public';
            console.log(`Granting ${perm.action} on ${perm.collection} to ${roleName}...`);

            try {
                await client.request(createPermission({
                    role: perm.role,
                    collection: perm.collection,
                    action: perm.action,
                    fields: perm.fields
                }));
                console.log('✅ Granted.');
            } catch (e) {
                // If error is RECORD_NOT_UNIQUE, permission already exists.
                // But Directus SDK error managing is tricky.
                const isConflict = e.errors?.some(err => err.extensions?.code === 'RECORD_NOT_UNIQUE');
                if (isConflict) {
                    console.log('ℹ️ Permission already exists (Record Not Unique).');
                    // Optional: Update it to ensure fields are [*]
                } else {
                    console.log(`⚠️ Warning: ${e.message}`);
                }
            }
        }

        console.log('Done! All policies applied.');

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();
