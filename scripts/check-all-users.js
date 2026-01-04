const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function checkAllUsers() {
    try {
        // Login as admin
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const { data } = await loginRes.json();
        const token = data.access_token;
        console.log('✅ Logged in successfully\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get all users with their roles
        console.log('📋 Fetching all users and their roles...\n');
        const usersRes = await fetch(`${URL}/users?fields=id,email,role.id,role.name&limit=-1`, {
            headers: authHeaders
        });

        if (!usersRes.ok) {
            throw new Error(`Failed to fetch users: ${usersRes.status}`);
        }

        const usersData = await usersRes.json();

        console.log(`Found ${usersData.data.length} users:\n`);
        usersData.data.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role?.name || 'NO ROLE'} (${user.role?.id || 'NULL'})`);
            console.log('');
        });

        // Check which users have "App User" role
        const appUsers = usersData.data.filter(u => u.role?.name === 'App User');
        console.log(`\n👥 Users with "App User" role: ${appUsers.length}`);
        appUsers.forEach(u => {
            console.log(`   - ${u.email} (${u.id})`);
        });

        // Get the App User role ID
        console.log('\n📜 Fetching App User role details...');
        const rolesRes = await fetch(`${URL}/roles?filter[name][_eq]=App User`, {
            headers: authHeaders
        });
        const rolesData = await rolesRes.json();

        if (rolesData.data && rolesData.data.length > 0) {
            const appUserRole = rolesData.data[0];
            console.log(`   App User Role ID: ${appUserRole.id}`);
            console.log(`   Policies: ${JSON.stringify(appUserRole.policies)}`);
        }

        console.log('\n✅ Check complete.');
        console.log('\n💡 Next step: Create a test user with App User role OR assign App User role to existing user');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAllUsers();
