
import { createDirectus, rest, authentication, readRoles, createItem, readItems, updateRole, createPermission } from '@directus/sdk';
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

        // 1. Find or Create Policy
        const policyName = 'App User Chat Access';
        const existingPolicies = await client.request(readItems('directus_policies', {
            filter: { name: { _eq: policyName } }
        }));

        let policyId;
        if (existingPolicies.length > 0) {
            policyId = existingPolicies[0].id;
            console.log(`✅ Policy "${policyName}" exists (${policyId}).`);
        } else {
            console.log(`Creating Policy "${policyName}"...`);
            const newPolicy = await client.request(createItem('directus_policies', {
                name: policyName,
                icon: 'chat',
                description: 'Grants access to internal chat features.'
            }));
            policyId = newPolicy.id;
            console.log(`✅ Policy created (${policyId}).`);
        }

        // 2. Grant Permissions to Policy
        // We iterate and try to create permissions. If duplicate, ignore.
        const perms = [
            { collection: 'profiles', action: 'read', fields: ['*'] },
            { collection: 'conversations', action: 'create', fields: ['*'] },
            { collection: 'conversations', action: 'read', fields: ['*'] },
            { collection: 'conversations', action: 'update', fields: ['*'] },
            { collection: 'messages', action: 'create', fields: ['*'] },
            { collection: 'messages', action: 'read', fields: ['*'] },
            { collection: 'messages', action: 'update', fields: ['*'] }
        ];

        for (const p of perms) {
            try {
                // Check if exists for this policy? 
                // Hard to check without reading permissions with policy filter.
                // Just try create.
                console.log(`Granting ${p.collection}.${p.action} to Policy...`);
                await client.request(createPermission({
                    policy: policyId,
                    collection: p.collection,
                    action: p.action,
                    fields: p.fields
                }));
                console.log(`✅ Granted.`);
            } catch (e) {
                if (e.errors?.some(err => err.message?.includes('unique') || err.code === 'RECORD_NOT_UNIQUE')) {
                    console.log(`⚠️ Exists.`);
                } else {
                    console.error(`❌ Error: ${e.message}`);
                }
            }
        }

        // 3. Attach Policy to App User Role
        const roles = await client.request(readRoles());
        const appUserRole = roles.find(r => r.name === 'App User');

        if (appUserRole) {
            console.log(`Attaching policy to role: ${appUserRole.name}`);
            const currentPolicies = appUserRole.policies || [];

            if (!currentPolicies.includes(policyId)) {
                await client.request(updateRole(appUserRole.id, {
                    policies: [...currentPolicies, policyId]
                }));
                console.log('✅ Policy attached to App User.');
            } else {
                console.log('✅ Policy already attached.');
            }
        } else {
            console.log('❌ App User role not found.');
        }

        // Also Advertiser
        const advertiserRole = roles.find(r => r.name === 'Advertiser');
        if (advertiserRole) {
            console.log(`Attaching policy to role: ${advertiserRole.name}`);
            const currentPolicies = advertiserRole.policies || [];
            if (!currentPolicies.includes(policyId)) {
                await client.request(updateRole(advertiserRole.id, {
                    policies: [...currentPolicies, policyId]
                }));
                console.log('✅ Policy attached to Advertiser.');
            } else {
                console.log('✅ Policy already attached.');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
