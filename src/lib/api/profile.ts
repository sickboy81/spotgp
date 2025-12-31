// API functions for profile management
import { pb } from '@/lib/pocketbase';
import { generateUniqueAdId } from '../utils';

export interface ProfileData {
    ad_id?: string;
    category?: string;
    display_name?: string;
    title?: string;
    bio?: string;
    username?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    street_address?: string;
    address_reference?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    telegram?: string;
    instagram?: string;
    twitter?: string;
    price?: number;
    prices?: Array<{ description: string; price: number }>;
    age?: number;
    gender?: string;
    height?: string;
    weight?: string;
    hairColor?: string[];
    bodyType?: string[];
    ethnicity?: string[];
    services?: string[];
    paymentMethods?: string[];
    hasPlace?: boolean;
    videoCall?: boolean;
    chat_enabled?: boolean;
    schedule_24h?: boolean;
    schedule_from?: string;
    schedule_to?: string;
    schedule_same_everyday?: boolean;
    audio_url?: string;
    massageTypes?: string[];
    otherServices?: string[];
    happyEnding?: string[];
    facilities?: string[];
    serviceTo?: string[];
    serviceLocations?: string[];
    is_online?: boolean;
    online_until?: string | null;
}

/**
 * Load user profile data
 */
export async function loadProfile(userId: string): Promise<ProfileData | null> {
    try {
        const profile = await pb.collection('profiles').getOne<ProfileData>(userId);
        return profile;
    } catch (err) {
        console.warn('Profile not found in PocketBase:', err);
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

        try {
            await pb.collection('profiles').update(userId, data);
        } catch (e: any) {
            if (e.status === 404) {
                await pb.collection('profiles').create({ ...data, id: userId });
            } else {
                throw e;
            }
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

        await pb.collection('profiles').update(userId, {
            is_online: isOnline,
            online_until: onlineUntil,
        });

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
