const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function investigateCollectionAccess() {
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
        console.log('✅ Admin logged in\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Check if collections even exist
        console.log('📋 Checking if collections exist...\n');
        const collectionsRes = await fetch(`${URL}/collections`, {
            headers: authHeaders
        });

        const collectionsData = await collectionsRes.json();
        const targetCollections = ['profiles', 'notifications', 'profile_views', 'profile_clicks'];

        targetCollections.forEach(name => {
            const exists = collectionsData.data.find(c => c.collection === name);
            console.log(`   ${exists ? '✅' : '❌'} ${name}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        });

        // Check fields for each collection
        console.log('\n🔍 Checking collection fields...\n');
        for (const collName of targetCollections) {
            const fieldsRes = await fetch(`${URL}/fields/${collName}`, {
                headers: authHeaders
            });

            if (fieldsRes.ok) {
                const fieldsData = await fieldsRes.json();
                console.log(`${collName}: ${fieldsData.data.length} fields`);
                fieldsData.data.slice(0, 5).forEach(f => {
                    console.log(`   - ${f.field} (${f.type})`);
                });
                if (fieldsData.data.length > 5) {
                    console.log(`   ... and ${fieldsData.data.length - 5} more`);
                }
                console.log('');
            } else {
                console.log(`❌ ${collName}: Failed to get fields (${fieldsRes.status})\n`);
            }
        }

        console.log('✅ Investigation complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

investigateCollectionAccess();
