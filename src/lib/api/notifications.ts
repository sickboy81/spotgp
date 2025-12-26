// API functions for notifications system
// Prepared for database integration - currently using localStorage simulation with Supabase integration ready

import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { shouldUseMockAuth } from '../mock-auth';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export interface NotificationWithTime extends Notification {
    timeAgo?: string;
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
    userId: string,
    options?: {
        unreadOnly?: boolean;
        limit?: number;
    }
): Promise<NotificationWithTime[]> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        return getNotificationsFromLocalStorage(userId, options);
    }

    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map(addTimeAgo);
        }

        return getNotificationsFromLocalStorage(userId, options);
    } catch (err: any) {
        console.warn('Error fetching notifications from Supabase, using localStorage:', err);
        return getNotificationsFromLocalStorage(userId, options);
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        return getUnreadCountFromLocalStorage(userId);
    }

    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch {
        return getUnreadCountFromLocalStorage(userId);
    }
}

/**
 * Create a new notification
 */
export async function createNotification(
    notification: Omit<NotificationInsert, 'id' | 'created_at'>
): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_read: false,
            created_at: new Date().toISOString(),
        } as Notification;

        saveNotificationToLocalStorage(newNotification);
        return { success: true, notification: newNotification };
    }

    try {
        const notificationData: NotificationInsert = {
            ...notification,
            is_read: false,
        };

        const { data, error } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();

        if (error) throw error;

        // Save to localStorage
        saveNotificationToLocalStorage(data);

        return { success: true, notification: data };
    } catch (err: any) {
        console.warn('Error creating notification in Supabase, using localStorage:', err);
        
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_read: false,
            created_at: new Date().toISOString(),
        } as Notification;

        saveNotificationToLocalStorage(newNotification);
        return { success: true, notification: newNotification };
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        updateNotificationReadStatus(notificationId);
        return { success: true };
    }

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        updateNotificationReadStatus(notificationId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error marking notification as read in Supabase, using localStorage:', err);
        updateNotificationReadStatus(notificationId);
        return { success: true };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        markAllAsReadInLocalStorage(userId);
        return { success: true };
    }

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        markAllAsReadInLocalStorage(userId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error marking all notifications as read in Supabase, using localStorage:', err);
        markAllAsReadInLocalStorage(userId);
        return { success: true };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    // Skip Supabase in mock mode
    if (shouldUseMockAuth()) {
        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    }

    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;

        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error deleting notification in Supabase, using localStorage:', err);
        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    }
}

/**
 * Helper function to add time ago
 */
function addTimeAgo(notification: Notification): NotificationWithTime {
    const now = new Date();
    const createdAt = new Date(notification.created_at);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo = '';
    if (diffMins < 1) timeAgo = 'Agora';
    else if (diffMins < 60) timeAgo = `${diffMins}min atrás`;
    else if (diffHours < 24) timeAgo = `${diffHours}h atrás`;
    else if (diffDays < 7) timeAgo = `${diffDays}d atrás`;
    else timeAgo = createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return { ...notification, timeAgo };
}

// LocalStorage fallback functions
function saveNotificationToLocalStorage(notification: Notification): void {
    const notifications = getNotificationsFromLocalStorageArray();
    notifications.unshift(notification); // Add to beginning
    // Keep only last 100 notifications
    if (notifications.length > 100) {
        notifications.splice(100);
    }
    localStorage.setItem('saphira_notifications', JSON.stringify(notifications));
}

function getNotificationsFromLocalStorageArray(): Notification[] {
    const stored = localStorage.getItem('saphira_notifications');
    return stored ? JSON.parse(stored) : [];
}

function getNotificationsFromLocalStorage(
    userId: string,
    options?: {
        unreadOnly?: boolean;
        limit?: number;
    }
): NotificationWithTime[] {
    let notifications = getNotificationsFromLocalStorageArray()
        .filter(n => n.user_id === userId);

    if (options?.unreadOnly) {
        notifications = notifications.filter(n => !n.is_read);
    }

    if (options?.limit) {
        notifications = notifications.slice(0, options.limit);
    }

    return notifications.map(addTimeAgo);
}

function getUnreadCountFromLocalStorage(userId: string): number {
    const notifications = getNotificationsFromLocalStorageArray();
    return notifications.filter(n => n.user_id === userId && !n.is_read).length;
}

function updateNotificationReadStatus(notificationId: string): void {
    const notifications = getNotificationsFromLocalStorageArray();
    const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
    );
    localStorage.setItem('saphira_notifications', JSON.stringify(updated));
}

function markAllAsReadInLocalStorage(userId: string): void {
    const notifications = getNotificationsFromLocalStorageArray();
    const updated = notifications.map(n =>
        n.user_id === userId ? { ...n, is_read: true } : n
    );
    localStorage.setItem('saphira_notifications', JSON.stringify(updated));
}

function deleteNotificationFromLocalStorage(notificationId: string): void {
    const notifications = getNotificationsFromLocalStorageArray();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('saphira_notifications', JSON.stringify(filtered));
}

/**
 * Helper functions to create common notification types
 */
export async function notifyNewMessage(userId: string, senderName: string, conversationId: string) {
    return createNotification({
        user_id: userId,
        type: 'new_message',
        title: 'Nova Mensagem',
        message: `${senderName} enviou uma mensagem`,
        link: `/dashboard/messages`,
    });
}

export async function notifyNewView(userId: string, viewerCount: number) {
    return createNotification({
        user_id: userId,
        type: 'new_view',
        title: 'Novas Visualizações',
        message: `Seu perfil teve ${viewerCount} nova${viewerCount > 1 ? 's' : ''} visualização${viewerCount > 1 ? 'ões' : ''}`,
        link: `/dashboard/analytics`,
    });
}

export async function notifyNewFavorite(userId: string) {
    return createNotification({
        user_id: userId,
        type: 'new_favorite',
        title: 'Novo Favorito',
        message: 'Alguém adicionou seu perfil aos favoritos',
        link: `/dashboard/analytics`,
    });
}

export async function notifyVerificationApproved(userId: string) {
    return createNotification({
        user_id: userId,
        type: 'verification_approved',
        title: 'Verificação Aprovada',
        message: 'Sua verificação foi aprovada! Seu perfil agora está verificado.',
        link: `/dashboard/profile`,
    });
}

export async function notifyVerificationRejected(userId: string, reason?: string) {
    return createNotification({
        user_id: userId,
        type: 'verification_rejected',
        title: 'Verificação Rejeitada',
        message: reason || 'Sua verificação foi rejeitada. Verifique os documentos e tente novamente.',
        link: `/dashboard/verification`,
    });
}


