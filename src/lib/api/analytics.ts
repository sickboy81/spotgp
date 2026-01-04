// API functions for analytics and statistics
import { getProfileViews } from './views';
import { directus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import { logger } from '../utils/logger';

export interface ProfileClick {
    id: string;
    profile_id: string;
    click_type: 'whatsapp' | 'telegram' | 'instagram' | 'twitter' | 'phone' | 'message';
    viewer_id?: string | null;
    viewer_session?: string | null;
    date_created: string;
}

export interface AnalyticsData {
    views: {
        total: number;
        unique: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        byDevice: Record<string, number>;
        byDate: Array<{ date: string; count: number }>;
    };
    clicks: {
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        byType: Record<string, number>;
    };
    favorites: {
        total: number;
    };
    conversionRate: number;
}

/**
 * Record a click on a contact link
 */
export async function recordProfileClick(
    profileId: string,
    clickType: 'whatsapp' | 'telegram' | 'instagram' | 'twitter' | 'phone' | 'message',
    viewerId?: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const sessionId = sessionStorage.getItem('spotgp_session_id') || `session_${Date.now()}`;

        const clickData = {
            profile_id: profileId,
            click_type: clickType,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
        };

        await directus.request(createItem('profile_clicks', clickData));
        saveClickToLocalStorage({ ...clickData, date_created: new Date().toISOString() });

        return { success: true };
    } catch (err: any) {
        logger.warn('Error recording click in Directus, using localStorage:', err);

        const sessionId = sessionStorage.getItem('spotgp_session_id') || `session_${Date.now()}`;
        const clickData = {
            profile_id: profileId,
            click_type: clickType,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
            date_created: new Date().toISOString(),
        };

        saveClickToLocalStorage(clickData);
        return { success: true };
    }
}

/**
 * Get complete analytics for a profile
 */
export async function getProfileAnalytics(
    profileId: string,
    timeRange: 'today' | 'week' | 'month' | 'all' = 'month'
): Promise<AnalyticsData> {
    const now = new Date();
    let startDate: Date | undefined;

    switch (timeRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
    }

    // Get views
    const viewsData = await getProfileViews(profileId, { startDate });

    // Get clicks
    const clicksData = await getProfileClicks(profileId, startDate);

    // Get favorites count
    const favoritesCount = await getFavoritesCount(profileId);

    // Calculate conversion rate
    const conversionRate = viewsData.total > 0
        ? (clicksData.total / viewsData.total) * 100
        : 0;

    return {
        views: {
            total: viewsData.total,
            unique: viewsData.unique,
            today: await getTodayCount(profileId, 'views'),
            thisWeek: await getWeekCount(profileId, 'views'),
            thisMonth: await getMonthCount(profileId, 'views'),
            byDevice: viewsData.byDevice,
            byDate: viewsData.byDate,
        },
        clicks: {
            total: clicksData.total,
            today: await getTodayCount(profileId, 'clicks'),
            thisWeek: await getWeekCount(profileId, 'clicks'),
            thisMonth: await getMonthCount(profileId, 'clicks'),
            byType: clicksData.byType,
        },
        favorites: {
            total: favoritesCount,
        },
        conversionRate: Math.round(conversionRate * 100) / 100,
    };
}

/**
 * Get click statistics
 */
async function getProfileClicks(
    profileId: string,
    startDate?: Date
): Promise<{
    total: number;
    byType: Record<string, number>;
}> {
    try {
        const filter: any = {
            _and: [{ profile_id: { _eq: profileId } }]
        };

        if (startDate) {
            filter._and.push({ date_created: { _gte: startDate.toISOString() } });
        }

        const data = await directus.request(readItems('profile_clicks', {
            filter,
            limit: -1
        }));

        if (data && data.length > 0) {
            const total = data.length;
            const byType: Record<string, number> = {};
            data.forEach((click: any) => {
                byType[click.click_type] = (byType[click.click_type] || 0) + 1;
            });
            return { total, byType };
        }

        return getClicksFromLocalStorage(profileId, startDate);
    } catch (err: any) {
        logger.warn('Error fetching clicks from Directus, using localStorage:', err);
        return getClicksFromLocalStorage(profileId, startDate);
    }
}

/**
 * Get favorites count for a profile
 */
async function getFavoritesCount(profileId: string): Promise<number> {
    try {
        const favorites = JSON.parse(localStorage.getItem('spotgp_favorites') || '[]');
        return favorites.filter((id: string) => id === profileId).length;
    } catch {
        return 0;
    }
}

async function getTodayCount(profileId: string, type: 'views' | 'clicks'): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'views') {
        const data = await getProfileViews(profileId, { startDate: today });
        return data.total;
    } else {
        const data = await getProfileClicks(profileId, today);
        return data.total;
    }
}

async function getWeekCount(profileId: string, type: 'views' | 'clicks'): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (type === 'views') {
        const data = await getProfileViews(profileId, { startDate: weekAgo });
        return data.total;
    } else {
        const data = await getProfileClicks(profileId, weekAgo);
        return data.total;
    }
}

async function getMonthCount(profileId: string, type: 'views' | 'clicks'): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (type === 'views') {
        const data = await getProfileViews(profileId, { startDate: monthStart });
        return data.total;
    } else {
        const data = await getProfileClicks(profileId, monthStart);
        return data.total;
    }
}

// LocalStorage fallback for clicks (types adjusted)
function saveClickToLocalStorage(click: any): void {
    const clicks = getClicksFromLocalStorageArray();
    const newClick: ProfileClick = {
        ...click,
        id: click.id || `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date_created: click.date_created || new Date().toISOString(),
    } as ProfileClick;

    clicks.push(newClick);
    localStorage.setItem('spotgp_profile_clicks', JSON.stringify(clicks));
}

function getClicksFromLocalStorageArray(): ProfileClick[] {
    const stored = localStorage.getItem('spotgp_profile_clicks');
    return stored ? JSON.parse(stored) : [];
}

function getClicksFromLocalStorage(
    profileId: string,
    startDate?: Date
): {
    total: number;
    byType: Record<string, number>;
} {
    let clicks = getClicksFromLocalStorageArray().filter(c => c.profile_id === profileId);

    if (startDate) {
        clicks = clicks.filter(c => new Date(c.date_created) >= startDate);
    }

    const total = clicks.length;
    const byType: Record<string, number> = {};
    clicks.forEach(click => {
        byType[click.click_type] = (byType[click.click_type] || 0) + 1;
    });

    return { total, byType };
}
