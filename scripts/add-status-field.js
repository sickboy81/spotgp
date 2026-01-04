// Add status field to profiles and implement hide/show/delete actions
const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function addStatusField() {
    console.log('='.repeat(60));
    console.log('📝 ADDING STATUS FIELD TO PROFILES');
    console.log('='.repeat(60));

    const loginRes = await fetch(`${URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const { data: { access_token } } = await loginRes.json();
    const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    };

    // Check if status field exists
    const fieldsRes = await fetch(`${URL}/fields/profiles`, { headers });
    const fieldsData = await fieldsRes.json();
    const existingFields = fieldsData.data?.map(f => f.field) || [];

    if (existingFields.includes('status')) {
        console.log('\n✅ Status field already exists');
    } else {
        console.log('\n📋 Adding status field...');
        const createRes = await fetch(`${URL}/fields/profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                field: 'status',
                type: 'string',
                schema: {
                    default_value: 'active',
                    max_length: 20
                },
                meta: {
                    interface: 'select-dropdown',
                    options: {
                        choices: [
                            { text: 'Ativo', value: 'active' },
                            { text: 'Oculto', value: 'hidden' },
                            { text: 'Deletado', value: 'deleted' }
                        ]
                    }
                }
            })
        });

        if (createRes.ok) {
            console.log('  ✅ Added status field');
        } else {
            console.log('  ❌ Failed to add status field');
        }
    }

    // Update permissions
    console.log('\n📋 Updating permissions...');
    const APP_ACCESS_POLICY = '3043f967-c650-4c42-bddc-efc84f1ffaca';
    const permsRes = await fetch(`${URL}/permissions?filter[policy][_eq]=${APP_ACCESS_POLICY}&filter[collection][_eq]=profiles`, { headers });
    const permsData = await permsRes.json();

    for (const perm of permsData.data || []) {
        await fetch(`${URL}/permissions/${perm.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields: ['*'] })
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DONE!');
    console.log('='.repeat(60));
}

addStatusField().catch(console.error);
