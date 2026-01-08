// API functions for profile management
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';
import { generateUniqueAdId } from '../utils';
import { logger } from '../utils/logger';

export interface ProfileData {
    id?: string;
    // ... (other fields remain the same, ensuring we support keys)
    accepts_calls?: boolean;
    accepts_whatsapp?: boolean;
    accepts_telegram?: boolean;
    payment_methods?: string[];
    service_neighborhoods?: string[];
    [key: string]: any;
}

/**
 * Load user profile data
 */
export async function loadProfile(userId: string): Promise<ProfileData | null> {
    try {
        // Try to find profile where user field matches userId
        // This is safer than assuming profile.id === userId
        const result = await directus.request(readItems('profiles', {
            filter: { user: { _eq: userId } },
            limit: 1
        }));

        return result[0] as ProfileData || null;
    } catch (err) {
        logger.warn('Profile not found in Directus:', err);
        return null;
    }
}

/**
 * Save user profile data
 */
export async function saveProfile(userId: string, data: ProfileData): Promise<{ success: boolean; error?: string }> {
    try {
        if (!data.ad_id) {
            data.ad_id = generateUniqueAdId();
        }

        // Check if profile exists
        const existing = await loadProfile(userId);

        if (existing && existing.id) {
            await directus.request(updateItem('profiles', existing.id, data));
        } else {
            // Create new profile linked to user
            // Try to set ID if allowed, else just set user relation
            await directus.request(createItem('profiles', {
                ...data,
                user: userId,
                // id: userId, // Optional: attempt to set same ID
            }));
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update online status
 */
export async function updateOnlineStatus(
    userId: string,
    isOnline: boolean,
    durationMinutes?: number | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const onlineUntil = durationMinutes
            ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
            : null;

        const existing = await loadProfile(userId);
        if (existing && existing.id) {
            await directus.request(updateItem('profiles', existing.id, {
                is_online: isOnline,
                online_until: onlineUntil,
            }));
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get current online status (considering scheduled end time)
 */
export function getCurrentOnlineStatus(profile: ProfileData | null): boolean {
    if (!profile || !profile.is_online) return false;

    if (profile.online_until) {
        const now = new Date();
        const until = new Date(profile.online_until);
        return until > now;
    }

    return profile.is_online || false;
}
