import { createDirectus, rest, authentication } from '@directus/sdk';

// Convert relative URL to absolute if needed (for browser env with proxy)
const envUrl = import.meta.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com';
const directusUrl = envUrl.startsWith('/')
    ? `${window.location.origin}${envUrl}`
    : envUrl;

export const directus = createDirectus<any>(directusUrl)
    .with(authentication('json', { autoRefresh: true }))
    .with(rest());
