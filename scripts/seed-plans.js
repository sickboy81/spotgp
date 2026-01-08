
import { createDirectus, rest, authentication, readItems, createItem } from '@directus/sdk';
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

        const existingPlans = await client.request(readItems('plans'));
        if (existingPlans.length > 0) {
            console.log('Plans already exist.');
            return;
        }

        console.log('Seeding initial plans...');
        await client.request(createItem('plans', {
            name: 'Básico',
            price: 49.90,
            duration_days: 30,
            description: 'Plano básico mensal',
            is_active: true
        }));

        await client.request(createItem('plans', {
            name: 'Premium',
            price: 99.90,
            duration_days: 30,
            description: 'Plano premium mensal com destaque',
            is_active: true
        }));

        console.log('✅ Plans seeded.');

    } catch (err) {
        console.error('Error seeding plans:', err);
    }
}

main();
