
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

        // --- Policy 1: Admin Full Access ---
        const adminPolicyName = 'Admin Settings Control';
        let adminPolicyId = await getOrCreatePolicy(adminPolicyName, 'settings');

        // Grant Update/Read to Admin Policy
        await grantPolicyPermission(adminPolicyId, 'system_settings', 'create');
        await grantPolicyPermission(adminPolicyId, 'system_settings', 'read');
        await grantPolicyPermission(adminPolicyId, 'system_settings', 'update');
        await grantPolicyPermission(adminPolicyId, 'system_settings', 'delete');

        // Attach to Administrator Role
        const roles = await client.request(readRoles());
        const adminRole = roles.find(r => r.name === 'Administrator');
        if (adminRole) {
            await attachPolicy(adminRole, adminPolicyId);
        }

        // --- Policy 2: Public/User Read Access ---
        const publicPolicyName = 'Public Settings Read';
        let publicPolicyId = await getOrCreatePolicy(publicPolicyName, 'visibility');

        // Grant Read to Public Policy
        await grantPolicyPermission(publicPolicyId, 'system_settings', 'read');

        // Attach to App User Role
        const appUserRole = roles.find(r => r.name === 'App User');
        if (appUserRole) {
            await attachPolicy(appUserRole, publicPolicyId);
        }

        // Attach to Public Role? 
        // Directus stores the Public Role ID in directus_settings. 
        // Often it's a specific role ID. 
        // We can try to find a role with name 'Public' or check settings.
        // For now, fixing Admin is priority 1, App User priority 2.

    } catch (err) {
        console.error('Error:', err);
    }
}

async function getOrCreatePolicy(name, icon) {
    const existing = await client.request(readItems('directus_policies', {
        filter: { name: { _eq: name } }
    }));
    if (existing.length > 0) return existing[0].id;

    const newPolicy = await client.request(createItem('directus_policies', {
        name: name,
        icon: icon,
        description: `Policy for ${name}`
    }));
    return newPolicy.id;
}

async function grantPolicyPermission(policyId, collection, action) {
    try {
        await client.request(createPermission({
            policy: policyId,
            collection: collection,
            action: action,
            fields: ['*']
        }));
        console.log(`Granted ${action} on ${collection} to policy.`);
    } catch (e) {
        // Ignore duplicate
    }
}

async function attachPolicy(role, policyId) {
    const currentPolicies = role.policies || [];
    if (!currentPolicies.includes(policyId)) {
        console.log(`Attaching policy to ${role.name}...`);
        await client.request(updateRole(role.id, {
            policies: [...currentPolicies, policyId]
        }));
    } else {
        console.log(`Policy already attached to ${role.name}.`);
    }
}

main();
