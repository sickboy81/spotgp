// Create all missing collections and fields
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';
const APP_ACCESS_POLICY_ID = '3043f967-c650-4c42-bddc-efc84f1ffaca';

async function createAllMissing() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const { data: { access_token } } = await loginRes.json();
        const authHeaders = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        };

        // 1. Check existing collections
        console.log('\n📋 Checking existing collections...');
        const collectionsRes = await fetch(`${URL}/collections`, { headers: authHeaders });
        const collectionsData = await collectionsRes.json();
        const existingCollections = new Set((collectionsData.data || []).map(c => c.collection));

        // 2. Create conversations collection if missing
        if (!existingCollections.has('conversations')) {
            console.log('\n➕ Creating conversations collection...');
            const res = await fetch(`${URL}/collections`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    collection: 'conversations',
                    meta: { icon: 'chat', note: 'User conversations' },
                    schema: {}
                })
            });
            if (res.ok) {
                console.log('  ✅ Created');
                // Add fields
                const fields = [
                    { field: 'participant1_id', type: 'uuid', schema: { is_nullable: true } },
                    { field: 'participant2_id', type: 'uuid', schema: { is_nullable: true } },
                    { field: 'last_message', type: 'text', schema: { is_nullable: true } },
                    { field: 'last_message_at', type: 'timestamp', schema: { is_nullable: true } },
                    { field: 'unread_count', type: 'integer', schema: { default_value: 0 } }
                ];
                for (const f of fields) {
                    await fetch(`${URL}/fields/conversations`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify(f)
                    });
                }
                // Add permissions
                for (const action of ['create', 'read', 'update', 'delete']) {
                    await fetch(`${URL}/permissions`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            policy: APP_ACCESS_POLICY_ID,
                            collection: 'conversations',
                            action,
                            fields: ['*'],
                            permissions: null
                        })
                    });
                }
            }
        } else {
            console.log('\n⏭️ conversations collection exists');
            // Just add permissions if missing
            const permsRes = await fetch(`${URL}/permissions?filter[collection][_eq]=conversations&filter[policy][_eq]=${APP_ACCESS_POLICY_ID}`, { headers: authHeaders });
            const permsData = await permsRes.json();
            if (!permsData.data || permsData.data.length === 0) {
                console.log('  Adding permissions...');
                for (const action of ['create', 'read', 'update', 'delete']) {
                    await fetch(`${URL}/permissions`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            policy: APP_ACCESS_POLICY_ID,
                            collection: 'conversations',
                            action,
                            fields: ['*'],
                            permissions: null
                        })
                    });
                }
            }
        }

        // 3. Create messages collection if missing
        if (!existingCollections.has('messages')) {
            console.log('\n➕ Creating messages collection...');
            const res = await fetch(`${URL}/collections`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    collection: 'messages',
                    meta: { icon: 'message', note: 'Chat messages' },
                    schema: {}
                })
            });
            if (res.ok) {
                console.log('  ✅ Created');
                const fields = [
                    { field: 'conversation_id', type: 'integer', schema: { is_nullable: true } },
                    { field: 'sender_id', type: 'uuid', schema: { is_nullable: true } },
                    { field: 'content', type: 'text', schema: { is_nullable: true } },
                    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'] } },
                    { field: 'read', type: 'boolean', schema: { default_value: false } }
                ];
                for (const f of fields) {
                    await fetch(`${URL}/fields/messages`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify(f)
                    });
                }
                for (const action of ['create', 'read', 'update']) {
                    await fetch(`${URL}/permissions`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            policy: APP_ACCESS_POLICY_ID,
                            collection: 'messages',
                            action,
                            fields: ['*'],
                            permissions: null
                        })
                    });
                }
            }
        }

        // 4. Add verification fields to profiles
        console.log('\n📋 Adding verification fields to profiles...');
        const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers: authHeaders });
        const fieldsData = await fieldsRes.json();
        const existingFields = new Set((fieldsData.data || []).map(f => f.field));

        const verificationFields = [
            { field: 'verified', type: 'boolean', schema: { default_value: false } },
            { field: 'verification_status', type: 'string', schema: { default_value: 'pending', is_nullable: true } },
            { field: 'verification_rejected_reason', type: 'text', schema: { is_nullable: true } }
        ];

        for (const f of verificationFields) {
            if (!existingFields.has(f.field)) {
                const res = await fetch(`${URL}/fields/profiles`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(f)
                });
                console.log(`  ${res.ok ? '✅' : '❌'} ${f.field}`);
            } else {
                console.log(`  ⏭️ ${f.field} (exists)`);
            }
        }

        // 5. Final summary
        console.log('\n📋 Final permission count:');
        const finalPermsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY_ID}&limit=-1`, { headers: authHeaders });
        const finalPermsData = await finalPermsRes.json();
        const byCollection = {};
        for (const p of finalPermsData.data || []) {
            if (!byCollection[p.collection]) byCollection[p.collection] = [];
            byCollection[p.collection].push(p.action);
        }
        for (const [coll, actions] of Object.entries(byCollection)) {
            console.log(`  ${coll}: ${actions.join(', ')}`);
        }
        console.log(`\nTotal permissions: ${finalPermsData.data?.length || 0}`);

        // 6. Test
        console.log('\n📋 Testing as user...');
        const userLoginRes = await fetch(`${URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
        });
        const { data: { access_token: userToken } } = await userLoginRes.json();
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        const tests = [
            '/users/me',
            '/items/profiles?limit=1',
            '/items/conversations?limit=1',
            '/items/notifications?limit=1',
        ];

        for (const t of tests) {
            const res = await fetch(`${URL}${t}`, { headers: userHeaders });
            console.log(`  ${res.ok ? '✅' : '❌'} ${t.split('?')[0]}: ${res.status}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createAllMissing();
