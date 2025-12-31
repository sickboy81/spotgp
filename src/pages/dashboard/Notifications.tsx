import { useEffect, useState } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    NotificationWithTime,
} from '@/lib/api/notifications';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationWithTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        const loadNotifications = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const data = await getUserNotifications(user.id, {
                    unreadOnly: filter === 'unread',
                });
                setNotifications(data);
            } catch (error) {
                console.error('Error loading notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadNotifications();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id, filter]);

    const handleMarkAsRead = async (notificationId: string) => {
        await markNotificationAsRead(notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;
        await markAllNotificationsAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_message':
                return '💬';
            case 'new_view':
                return '👁️';
            case 'new_favorite':
                return '❤️';
            case 'verification_approved':
                return '✅';
            case 'verification_rejected':
                return '❌';
            case 'profile_featured':
                return '⭐';
            default:
                return '🔔';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Notificações</h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0
                            ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                            : 'Todas as notificações foram lidas'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                        className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        aria-label="Filter notifications"
                    >
                        <option value="all">Todas</option>
                        <option value="unread">Não lidas</option>
                    </select>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">
                        {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                    </h3>
                    <p className="text-muted-foreground">
                        {filter === 'unread'
                            ? 'Você leu todas as suas notificações!'
                            : 'Suas notificações aparecerão aqui'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow relative group",
                                !notification.is_read && "bg-primary/5 border-primary/20"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <span className="text-3xl flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">
                                                {notification.title}
                                            </h3>
                                            <p className="text-muted-foreground mb-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span>{notification.timeAgo || 'Agora'}</span>
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                className="text-primary hover:underline"
                                            >
                                                Ver detalhes →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                                            title="Marcar como lida"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                        title="Remover notificação"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

