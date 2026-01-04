const URL = 'https://base.spotgp.com';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

async function createMissingCollections() {
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

        // 1. Create notifications collection
        console.log('📋 Creating notifications collection...');
        const notificationsRes = await fetch(`${URL}/collections`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                collection: 'notifications',
                meta: {
                    collection: 'notifications',
                    icon: 'notifications',
                    note: 'User notifications',
                    display_template: null,
                    hidden: false,
                    singleton: false,
                    archive_field: null,
                    archive_value: null,
                    unarchive_value: null,
                    sort_field: null
                },
                schema: {
                    name: 'notifications'
                },
                fields: [
                    {
                        field: 'id',
                        type: 'integer',
                        schema: { is_primary_key: true, has_auto_increment: true },
                        meta: { hidden: true, readonly: true }
                    },
                    {
                        field: 'user_id',
                        type: 'uuid',
                        schema: {},
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'type',
                        type: 'string',
                        schema: {},
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'message',
                        type: 'text',
                        schema: {},
                        meta: { interface: 'input-multiline' }
                    },
                    {
                        field: 'read',
                        type: 'boolean',
                        schema: { default_value: false },
                        meta: { interface: 'boolean' }
                    },
                    {
                        field: 'date_created',
                        type: 'timestamp',
                        schema: {},
                        meta: { special: ['date-created'], interface: 'datetime', readonly: true }
                    }
                ]
            })
        });

        if (notificationsRes.ok) {
            console.log('✅ notifications collection created\n');
        } else {
            const errText = await notificationsRes.text();
            console.log(`⚠️ notifications: ${notificationsRes.status} - ${errText}\n`);
        }

        // 2. Create profile_views collection
        console.log('📋 Creating profile_views collection...');
        const viewsRes = await fetch(`${URL}/collections`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                collection: 'profile_views',
                meta: {
                    collection: 'profile_views',
                    icon: 'visibility',
                    note: 'Profile view analytics',
                    hidden: false,
                    singleton: false
                },
                schema: {
                    name: 'profile_views'
                },
                fields: [
                    {
                        field: 'id',
                        type: 'integer',
                        schema: { is_primary_key: true, has_auto_increment: true },
                        meta: { hidden: true, readonly: true }
                    },
                    {
                        field: 'profile_id',
                        type: 'uuid',
                        schema: {},
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'viewer_id',
                        type: 'uuid',
                        schema: { is_nullable: true },
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'date_created',
                        type: 'timestamp',
                        schema: {},
                        meta: { special: ['date-created'], interface: 'datetime', readonly: true }
                    }
                ]
            })
        });

        if (viewsRes.ok) {
            console.log('✅ profile_views collection created\n');
        } else {
            const errText = await viewsRes.text();
            console.log(`⚠️ profile_views: ${viewsRes.status} - ${errText}\n`);
        }

        // 3. Create profile_clicks collection
        console.log('📋 Creating profile_clicks collection...');
        const clicksRes = await fetch(`${URL}/collections`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                collection: 'profile_clicks',
                meta: {
                    collection: 'profile_clicks',
                    icon: 'touch_app',
                    note: 'Profile click analytics',
                    hidden: false,
                    singleton: false
                },
                schema: {
                    name: 'profile_clicks'
                },
                fields: [
                    {
                        field: 'id',
                        type: 'integer',
                        schema: { is_primary_key: true, has_auto_increment: true },
                        meta: { hidden: true, readonly: true }
                    },
                    {
                        field: 'profile_id',
                        type: 'uuid',
                        schema: {},
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'click_type',
                        type: 'string',
                        schema: {},
                        meta: { interface: 'input' }
                    },
                    {
                        field: 'date_created',
                        type: 'timestamp',
                        schema: {},
                        meta: { special: ['date-created'], interface: 'datetime', readonly: true }
                    }
                ]
            })
        });

        if (clicksRes.ok) {
            console.log('✅ profile_clicks collection created\n');
        } else {
            const errText = await clicksRes.text();
            console.log(`⚠️ profile_clicks: ${clicksRes.status} - ${errText}\n`);
        }

        console.log('✅ Collection creation complete!');
        console.log('\n💡 Next: Permissions already exist for these collections. Users should logout/login to refresh tokens.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createMissingCollections();
