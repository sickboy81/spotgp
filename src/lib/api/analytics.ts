// API functions for analytics and statistics
// Combines views, clicks, and other engagement metrics

import { getProfileViews } from './views';
import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type ProfileClick = Database['public']['Tables']['profile_clicks']['Row'];
type ProfileClickInsert = Database['public']['Tables']['profile_clicks']['Insert'];

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
    conversionRate: number; // Views to clicks conversion
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
        const sessionId = sessionStorage.getItem('saphira_session_id') || `session_${Date.now()}`;

        const clickData: ProfileClickInsert = {
            profile_id: profileId,
            click_type: clickType,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
        };

        const { error } = await supabase
            .from('profile_clicks')
            .insert(clickData as any);

        if (error) throw error;

        // Also save to localStorage
        saveClickToLocalStorage(clickData);

        return { success: true };
    } catch (err: any) {
        console.warn('Error recording click in Supabase, using localStorage:', err);
        
        const sessionId = sessionStorage.getItem('saphira_session_id') || `session_${Date.now()}`;
        const clickData: ProfileClickInsert = {
            profile_id: profileId,
            click_type: clickType,
            viewer_id: viewerId || null,
            viewer_session: sessionId,
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
        let query = supabase
            .from('profile_clicks')
            .select('*')
            .eq('profile_id', profileId);

        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            const total = data.length;
            const byType: Record<string, number> = {};
            (data as any[]).forEach((click: any) => {
                byType[click.click_type] = (byType[click.click_type] || 0) + 1;
            });
            return { total, byType };
        }

        return getClicksFromLocalStorage(profileId, startDate);
    } catch (err: any) {
        console.warn('Error fetching clicks from Supabase, using localStorage:', err);
        return getClicksFromLocalStorage(profileId, startDate);
    }
}

/**
 * Get favorites count for a profile
 */
async function getFavoritesCount(profileId: string): Promise<number> {
    try {
        // Try to get from localStorage (current implementation)
        const favorites = JSON.parse(localStorage.getItem('saphira_favorites') || '[]');
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

// LocalStorage fallback for clicks
function saveClickToLocalStorage(click: ProfileClickInsert): void {
    const clicks = getClicksFromLocalStorageArray();
    const newClick: ProfileClick = {
        ...click,
        id: click.id || `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: click.created_at || new Date().toISOString(),
    } as ProfileClick;
    
    clicks.push(newClick);
    localStorage.setItem('saphira_profile_clicks', JSON.stringify(clicks));
}

function getClicksFromLocalStorageArray(): ProfileClick[] {
    const stored = localStorage.getItem('saphira_profile_clicks');
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
        clicks = clicks.filter(c => new Date(c.created_at) >= startDate);
    }

    const total = clicks.length;
    const byType: Record<string, number> = {};
    clicks.forEach(click => {
        byType[click.click_type] = (byType[click.click_type] || 0) + 1;
    });

    return { total, byType };
}


