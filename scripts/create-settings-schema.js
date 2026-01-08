
import { createDirectus, rest, authentication, createCollection, createField } from '@directus/sdk';
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
        console.log('Authenticated.');

        // 1. Create Collection (Singleton)
        console.log('Creating "system_settings" collection...');
        await client.request(createCollection({
            collection: 'system_settings',
            name: 'System Settings',
            schema: {},
            meta: {
                singleton: true, // Important for settings
                icon: 'settings'
            }
        }));
        console.log('✅ Collection created.');

        // 2. Create Fields
        console.log('Creating field "site_name"...');
        await client.request(createField('system_settings', {
            field: 'site_name',
            type: 'string',
            meta: {
                interface: 'input',
                display: 'raw',
                width: 'half',
                required: false
            }
        }));

        console.log('Creating field "maintenance_mode"...');
        await client.request(createField('system_settings', {
            field: 'maintenance_mode',
            type: 'boolean',
            schema: {
                default_value: false
            },
            meta: {
                interface: 'boolean',
                display: 'boolean',
                width: 'half'
            }
        }));

        console.log('✅ Fields created.');

    } catch (err) {
        console.error('Error:', err);
        if (err.errors) console.log(JSON.stringify(err.errors, null, 2));
    }
}

main();
