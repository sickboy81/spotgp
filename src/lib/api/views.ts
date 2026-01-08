// API functions for profile views tracking
import { directus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

export interface ProfileView {
    id: string;
    profile_id: string;
    viewer_id?: string | null;
    viewer_session?: string | null;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    city?: string | null;
    country?: string | null;
    is_unique: boolean;
    date_created: string;
}

/**
 * Generate or retrieve a unique session ID
 */
function getSessionId(): string {
    let sessionId = sessionStorage.getItem('spotgp_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('spotgp_session_id', sessionId);
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

        const viewData = {
            profile_id: profileId,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
            device_type: deviceType,
            city: null,
            country: 'BR',
            is_unique: unique,
        };

        await directus.request(createItem('profile_views', viewData));
        saveViewToLocalStorage({ ...viewData, date_created: new Date().toISOString() });

        return { success: true };
    } catch (err: any) {
        console.warn('Error recording view in Directus, using localStorage:', err);

        const sessionId = getSessionId();
        const deviceType = detectDeviceType();
        const unique = isUniqueView(profileId);

        const viewData = {
            profile_id: profileId,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
            device_type: deviceType,
            city: null,
            country: 'BR',
            is_unique: unique,
            date_created: new Date().toISOString(),
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
        const filter: any = {
            _and: [{ profile_id: { _eq: profileId } }]
        };

        if (options?.startDate) {
            filter._and.push({ date_created: { _gte: options.startDate.toISOString() } });
        }
        if (options?.endDate) {
            filter._and.push({ date_created: { _lte: options.endDate.toISOString() } });
        }

        const views = await directus.request(readItems('profile_views', {
            filter,
            limit: -1 // careful with large datasets
        }));

        return processViewData(views as ProfileView[], options?.uniqueOnly);
    } catch (err: any) {
        console.warn('Error fetching views from Directus, using localStorage:', err);
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
        if (!view.date_created) return;
        const date = new Date(view.date_created).toISOString().split('T')[0];
        byDateMap[date] = (byDateMap[date] || 0) + 1;
    });

    const byDate = Object.entries(byDateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return { total, unique, byDevice, byDate };
}

// LocalStorage fallback functions
function saveViewToLocalStorage(view: any): void {
    const views = getViewsFromLocalStorageArray();
    const newView: ProfileView = {
        ...view,
        id: view.id || `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date_created: view.date_created || new Date().toISOString(),
    } as ProfileView;

    views.push(newView);
    localStorage.setItem('spotgp_profile_views', JSON.stringify(views));
}

function getViewsFromLocalStorageArray(): ProfileView[] {
    const stored = localStorage.getItem('spotgp_profile_views');
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
        views = views.filter(v => new Date(v.date_created) >= options.startDate!);
    }
    if (options?.endDate) {
        views = views.filter(v => new Date(v.date_created) <= options.endDate!);
    }

    return processViewData(views, options?.uniqueOnly);
}






