
import { createDirectus, rest, authentication, readUsers, readRoles, updateUser } from '@directus/sdk';
import 'dotenv/config';

const envUrl = process.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const URL = envUrl.startsWith('/') ? 'https://base.spotgp.com' : envUrl;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const client = createDirectus(URL)
    .with(authentication())
    .with(rest());

async function main() {
    try {
        await client.login({ email: EMAIL, password: PASSWORD });
        console.log('✅ Authenticated as Admin.');

        // 1. Find the user 'sickboy81@gmail.com'
        const users = await client.request(readUsers({
            filter: { email: { _eq: 'sickboy81@gmail.com' } }
        }));

        if (users.length === 0) {
            console.log('❌ User sickboy81@gmail.com not found.');
            return;
        }

        const targetUser = users[0];
        console.log(`Found user: ${targetUser.first_name} (${targetUser.id}) - Current Role: ${targetUser.role}`);

        // 2. Find the Administrator role
        const roles = await client.request(readRoles());
        const adminRole = roles.find(r => r.name === 'Administrator');

        if (!adminRole) {
            console.log('❌ Administrator role not found.');
            return;
        }

        console.log(`Administrator Role ID: ${adminRole.id}`);

        if (targetUser.role === adminRole.id) {
            console.log('✅ User is already Administrator.');
        } else {
            console.log('Promoting user to Administrator...');
            await client.request(updateUser(targetUser.id, {
                role: adminRole.id
            }));
            console.log('✅ User promoted successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
