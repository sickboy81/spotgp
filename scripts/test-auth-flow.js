// Test the complete user authentication flow
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

// Test user credentials (from the log - Joanamaria1)
const TEST_USER_EMAIL = 'joana@test.com'; // Placeholder - need to find actual email

async function testAuthFlow() {
    try {
        console.log('=== TESTING AUTHENTICATION FLOW ===\n');

        // 1. Login as admin first to investigate user
        console.log('🔐 Step 1: Logging in as admin...');
        const adminLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!adminLoginRes.ok) {
            throw new Error(`Admin login failed: ${adminLoginRes.status}`);
        }

        const { data: { access_token: adminToken } } = await adminLoginRes.json();
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Get all users to find the test user
        console.log('📋 Step 2: Getting all users...');
        const usersRes = await fetch(`${URL}/users?fields=id,email,role,first_name,last_name,status&limit=-1`, {
            headers: authHeaders
        });
        const usersData = await usersRes.json();
        console.log('Users found:');
        for (const user of usersData.data || []) {
            console.log(`  - ${user.email} (role: ${user.role}, status: ${user.status})`);
        }

        // 3. Find a non-admin user with App User role
        const appUserRoleId = '9b41dbf8-90a0-4c39-a7b9-20f25990bebf';
        const testUser = usersData.data?.find(u => u.role === appUserRoleId && u.email !== ADMIN_EMAIL);

        if (!testUser) {
            console.log('\n❌ No test user found with App User role!');
            console.log('Creating a test user...');

            // Create a test user
            const createRes = await fetch(`${URL}/users`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    email: 'test@saphira.app',
                    password: 'TestPassword123!',
                    role: appUserRoleId,
                    status: 'active'
                })
            });

            if (createRes.ok) {
                console.log('✅ Test user created');
            } else {
                const errText = await createRes.text();
                console.log('Failed to create test user:', errText);
            }
        } else {
            console.log(`\n✅ Found test user: ${testUser.email}`);
        }

        // 4. Check the App User role configuration
        console.log('\n📋 Step 3: Checking App User role configuration...');
        const roleRes = await fetch(`${URL}/roles/${appUserRoleId}?fields=*,policies.*`, {
            headers: authHeaders
        });
        const roleData = await roleRes.json();
        console.log('Role:', roleData.data?.name);
        console.log('Policies linked:', roleData.data?.policies?.length || 0);

        // 5. Check access table
        console.log('\n📋 Step 4: Checking access table...');
        const accessRes = await fetch(`${URL}/access?filter[role][_eq]=${appUserRoleId}`, {
            headers: authHeaders
        });
        const accessData = await accessRes.json();
        console.log('Access entries for App User role:', accessData.data?.length || 0);
        for (const entry of accessData.data || []) {
            console.log(`  - Policy: ${entry.policy}, Sort: ${entry.sort}`);

            // Get policy details
            const policyRes = await fetch(`${URL}/policies/${entry.policy}`, {
                headers: authHeaders
            });
            const policyData = await policyRes.json();
            console.log(`    Name: ${policyData.data?.name}`);
            console.log(`    app_access: ${policyData.data?.app_access}`);
            console.log(`    admin_access: ${policyData.data?.admin_access}`);
        }

        // 6. Test login as a regular user
        console.log('\n📋 Step 5: Testing login as regular user...');

        // Get a user with App User role
        const userToTest = testUser || { email: 'test@saphira.app' };
        console.log(`Testing with user: ${userToTest.email}`);

        // We can't login because we don't know the password, but we can test the token generation
        // by checking if the admin can access the same endpoints

        // 7. Test API endpoints as admin (simulating what the user would access)
        console.log('\n📋 Step 6: Testing API endpoints...');

        // Test /users/me
        console.log('  Testing /users/me...');
        const meRes = await fetch(`${URL}/users/me`, {
            headers: authHeaders
        });
        if (meRes.ok) {
            console.log('    ✅ /users/me works as admin');
        } else {
            console.log(`    ❌ /users/me failed: ${meRes.status}`);
        }

        // Test /items/profiles
        console.log('  Testing /items/profiles...');
        const profilesRes = await fetch(`${URL}/items/profiles?limit=1`, {
            headers: authHeaders
        });
        if (profilesRes.ok) {
            console.log('    ✅ /items/profiles works as admin');
        } else {
            console.log(`    ❌ /items/profiles failed: ${profilesRes.status}`);
        }

        console.log('\n📋 Step 7: Checking if the user ID matches what the frontend is using...');
        console.log('Frontend is using user ID: 26438ac6-9d0e-4050-8a93-3f5906d5ca32');

        const specificUserRes = await fetch(`${URL}/users/26438ac6-9d0e-4050-8a93-3f5906d5ca32?fields=*,role.*`, {
            headers: authHeaders
        });
        if (specificUserRes.ok) {
            const specificUser = await specificUserRes.json();
            console.log('User details:');
            console.log(`  Email: ${specificUser.data?.email}`);
            console.log(`  Role: ${specificUser.data?.role?.name || specificUser.data?.role}`);
            console.log(`  Status: ${specificUser.data?.status}`);
        } else {
            console.log('Could not find user:', specificUserRes.status);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAuthFlow();
