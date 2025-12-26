// API functions for profile views tracking
// Prepared for database integration - currently using localStorage simulation with Supabase integration ready

import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type ProfileView = Database['public']['Tables']['profile_views']['Row'];
type ProfileViewInsert = Database['public']['Tables']['profile_views']['Insert'];

/**
 * Generate or retrieve a unique session ID
 */
function getSessionId(): string {
    let sessionId = sessionStorage.getItem('saphira_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('saphira_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    if (typeof window === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
    if (/desktop|windows|mac|linux/i.test(ua)) return 'desktop';
    return 'unknown';
}

/**
 * Check if this view should be counted as unique
 * Uses localStorage to track viewed profiles per session
 */
function isUniqueView(profileId: string): boolean {
    const key = `viewed_${profileId}`;
    const viewed = sessionStorage.getItem(key);
    
    if (viewed) {
        return false; // Already viewed in this session
    }
    
    // Mark as viewed for this session
    sessionStorage.setItem(key, 'true');
    return true;
}

/**
 * Record a profile view
 */
export async function recordProfileView(profileId: string, viewerId?: string | null): Promise<{ success: boolean; error?: string }> {
    try {
        const sessionId = getSessionId();
        const deviceType = detectDeviceType();
        const unique = isUniqueView(profileId);

        // Try Supabase first
        const viewData: ProfileViewInsert = {
            profile_id: profileId,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
            device_type: deviceType,
            city: null, // Could be enhanced with geolocation
            country: 'BR', // Default to Brazil
            is_unique: unique,
        };

        const { error } = await supabase
            .from('profile_views')
            .insert(viewData);

        if (error) throw error;

        // Also save to localStorage as backup
        saveViewToLocalStorage(viewData);

        return { success: true };
    } catch (err: any) {
        console.warn('Error recording view in Supabase, using localStorage:', err);
        
        // Fallback to localStorage
        const sessionId = getSessionId();
        const deviceType = detectDeviceType();
        const unique = isUniqueView(profileId);

        const viewData: ProfileViewInsert = {
            profile_id: profileId,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
            device_type: deviceType,
            city: null,
            country: 'BR',
            is_unique: unique,
        };

        saveViewToLocalStorage(viewData);
        return { success: true };
    }
}

/**
 * Get view statistics for a profile
 */
export async function getProfileViews(
    profileId: string,
    options?: {
        startDate?: Date;
        endDate?: Date;
        uniqueOnly?: boolean;
    }
): Promise<{
    total: number;
    unique: number;
    byDevice: Record<string, number>;
    byDate: Array<{ date: string; count: number }>;
}> {
    try {
        let query = supabase
            .from('profile_views')
            .select('*')
            .eq('profile_id', profileId);

        if (options?.startDate) {
            query = query.gte('created_at', options.startDate.toISOString());
        }
        if (options?.endDate) {
            query = query.lte('created_at', options.endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            return processViewData(data, options?.uniqueOnly);
        }

        // Fallback to localStorage
        return getViewsFromLocalStorage(profileId, options);
    } catch (err: any) {
        console.warn('Error fetching views from Supabase, using localStorage:', err);
        return getViewsFromLocalStorage(profileId, options);
    }
}

/**
 * Process view data into statistics
 */
function processViewData(
    views: ProfileView[],
    uniqueOnly?: boolean
): {
    total: number;
    unique: number;
    byDevice: Record<string, number>;
    byDate: Array<{ date: string; count: number }>;
} {
    const filtered = uniqueOnly ? views.filter(v => v.is_unique) : views;
    
    const total = filtered.length;
    const unique = views.filter(v => v.is_unique).length;
    
    const byDevice: Record<string, number> = {};
    filtered.forEach(view => {
        byDevice[view.device_type] = (byDevice[view.device_type] || 0) + 1;
    });

    // Group by date
    const byDateMap: Record<string, number> = {};
    filtered.forEach(view => {
        const date = new Date(view.created_at).toISOString().split('T')[0];
        byDateMap[date] = (byDateMap[date] || 0) + 1;
    });

    const byDate = Object.entries(byDateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return { total, unique, byDevice, byDate };
}

// LocalStorage fallback functions
function saveViewToLocalStorage(view: ProfileViewInsert): void {
    const views = getViewsFromLocalStorageArray();
    const newView: ProfileView = {
        ...view,
        id: view.id || `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: view.created_at || new Date().toISOString(),
    } as ProfileView;
    
    views.push(newView);
    localStorage.setItem('saphira_profile_views', JSON.stringify(views));
}

function getViewsFromLocalStorageArray(): ProfileView[] {
    const stored = localStorage.getItem('saphira_profile_views');
    return stored ? JSON.parse(stored) : [];
}

function getViewsFromLocalStorage(
    profileId: string,
    options?: {
        startDate?: Date;
        endDate?: Date;
        uniqueOnly?: boolean;
    }
): {
    total: number;
    unique: number;
    byDevice: Record<string, number>;
    byDate: Array<{ date: string; count: number }>;
} {
    let views = getViewsFromLocalStorageArray().filter(v => v.profile_id === profileId);

    if (options?.startDate) {
        views = views.filter(v => new Date(v.created_at) >= options.startDate!);
    }
    if (options?.endDate) {
        views = views.filter(v => new Date(v.created_at) <= options.endDate!);
    }

    return processViewData(views, options?.uniqueOnly);
}


