// API functions for notifications system
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, updateItems, deleteItem, aggregate } from '@directus/sdk';
import { shouldUseMockAuth } from '../mock-auth';
import { logger } from '../utils/logger';

// ... (skipping unchanged parts)


// Define types locally since we are moving away from Supabase types
export interface Notification {
    id: string;
    user_id: string;
    type: 'new_message' | 'new_view' | 'new_favorite' | 'verification_approved' | 'verification_rejected' | 'profile_featured';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    date_created: string; // Directus uses 'date_created' by default
    date_updated: string; // Directus uses 'date_updated' by default
}

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
    if (shouldUseMockAuth()) {
        return getNotificationsFromLocalStorage(userId, options);
    }

    try {
        const filter: any = { user_id: { _eq: userId } };
        if (options?.unreadOnly) {
            filter.is_read = { _eq: false };
        }

        const result = await directus.request(readItems('notifications', {
            filter,
            sort: ['-date_created'],
            limit: options?.limit || 50,
        }));

        return (result as Notification[]).map(addTimeAgo);
    } catch (err: any) {
        logger.warn('Error fetching notifications from Directus, using localStorage:', err);
        return getNotificationsFromLocalStorage(userId, options);
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    if (shouldUseMockAuth()) {
        return getUnreadCountFromLocalStorage(userId);
    }

    try {
        // Directus aggregate for count
        const result = await directus.request(aggregate('notifications', {
            aggregate: { count: '*' },
            filter: {
                user_id: { _eq: userId },
                is_read: { _eq: false }
            }
        }));

        return Number(result[0]?.count || 0);
    } catch {
        return getUnreadCountFromLocalStorage(userId);
    }
}

/**
 * Create a new notification
 */
export async function createNotification(
    notification: Omit<Notification, 'id' | 'date_created' | 'date_updated'>
): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    if (shouldUseMockAuth()) {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_read: false,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString(),
        };

        saveNotificationToLocalStorage(newNotification);
        return { success: true, notification: newNotification };
    }

    try {
        const data = await directus.request(createItem('notifications', {
            ...notification,
            is_read: false,
        }));

        return { success: true, notification: data as Notification };
    } catch (err: any) {
        logger.warn('Error creating notification in Directus, using localStorage:', err);
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_read: false,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString(),
        };
        saveNotificationToLocalStorage(newNotification);
        return { success: true, notification: newNotification };
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    if (shouldUseMockAuth()) {
        updateNotificationReadStatus(notificationId);
        return { success: true };
    }

    try {
        await directus.request(updateItem('notifications', notificationId, { is_read: true }));
        updateNotificationReadStatus(notificationId);
        return { success: true };
    } catch (err: any) {
        logger.warn('Error marking notification as read in Directus, using localStorage:', err);
        updateNotificationReadStatus(notificationId);
        return { success: true };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    if (shouldUseMockAuth()) {
        markAllAsReadInLocalStorage(userId);
        return { success: true };
    }

    try {
        // Fetch unread IDs first
        const unread = await directus.request(readItems('notifications', {
            filter: {
                user_id: { _eq: userId },
                is_read: { _eq: false }
            },
            limit: 50,
            fields: ['id']
        }));

        if (unread.length > 0) {
            await directus.request(updateItems('notifications', unread.map((n: any) => n.id), { is_read: true }));
        }

        markAllAsReadInLocalStorage(userId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error marking all notifications as read in Directus, using localStorage:', err);
        markAllAsReadInLocalStorage(userId);
        return { success: true };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    if (shouldUseMockAuth()) {
        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    }

    try {
        await directus.request(deleteItem('notifications', notificationId));
        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    } catch (err: any) {
        logger.warn('Error deleting notification in Directus, using localStorage:', err);
        deleteNotificationFromLocalStorage(notificationId);
        return { success: true };
    }
}

/**
 * Helper function to add time ago
 */
function addTimeAgo(notification: Notification): NotificationWithTime {
    const now = new Date();
    // Use date_created
    const created = new Date(notification.date_created);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo = '';
    if (diffMins < 1) timeAgo = 'Agora';
    else if (diffMins < 60) timeAgo = `${diffMins}min atrás`;
    else if (diffHours < 24) timeAgo = `${diffHours}h atrás`;
    else if (diffDays < 7) timeAgo = `${diffDays}d atrás`;
    else timeAgo = created.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return { ...notification, timeAgo };
}

// LocalStorage fallback functions
function saveNotificationToLocalStorage(notification: Notification): void {
    const notifications = getNotificationsFromLocalStorageArray();
    notifications.unshift(notification);
    if (notifications.length > 100) {
        notifications.splice(100);
    }
    localStorage.setItem('spotgp_notifications', JSON.stringify(notifications));
}

function getNotificationsFromLocalStorageArray(): Notification[] {
    const stored = localStorage.getItem('spotgp_notifications');
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
    localStorage.setItem('spotgp_notifications', JSON.stringify(updated));
}

function markAllAsReadInLocalStorage(userId: string): void {
    const notifications = getNotificationsFromLocalStorageArray();
    const updated = notifications.map(n =>
        n.user_id === userId ? { ...n, is_read: true } : n
    );
    localStorage.setItem('spotgp_notifications', JSON.stringify(updated));
}

function deleteNotificationFromLocalStorage(notificationId: string): void {
    const notifications = getNotificationsFromLocalStorageArray();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('spotgp_notifications', JSON.stringify(filtered));
}

/**
 * Helper functions to create common notification types
 */
export async function notifyNewMessage(userId: string, senderName: string, _conversationId: string) {
    return createNotification({
        user_id: userId,
        type: 'new_message',
        title: 'Nova Mensagem',
        message: `${senderName} enviou uma mensagem`,
        link: `/dashboard/messages`,
    } as Notification);
}

export async function notifyNewView(userId: string, viewerCount: number) {
    return createNotification({
        user_id: userId,
        type: 'new_view',
        title: 'Novas Visualizações',
        message: `Seu perfil teve ${viewerCount} nova${viewerCount > 1 ? 's' : ''} visualização${viewerCount > 1 ? 'ões' : ''}`,
        link: `/dashboard/analytics`,
    } as Notification);
}

export async function notifyNewFavorite(userId: string) {
    return createNotification({
        user_id: userId,
        type: 'new_favorite',
        title: 'Novo Favorito',
        message: 'Alguém adicionou seu perfil aos favoritos',
        link: `/dashboard/analytics`,
    } as Notification);
}

export async function notifyVerificationApproved(userId: string) {
    return createNotification({
        user_id: userId,
        type: 'verification_approved',
        title: 'Verificação Aprovada',
        message: 'Sua verificação foi aprovada! Seu perfil agora está verificado.',
        link: `/dashboard/profile`,
    } as Notification);
}

export async function notifyVerificationRejected(userId: string, reason?: string) {
    return createNotification({
        user_id: userId,
        type: 'verification_rejected',
        title: 'Verificação Rejeitada',
        message: reason || 'Sua verificação foi rejeitada. Verifique os documentos e tente novamente.',
        link: `/dashboard/verification`,
    } as Notification);
}
