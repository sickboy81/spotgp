import { useEffect, useState, useRef } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
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

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationWithTime[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadNotifications();

            // Poll for new notifications every 10 seconds when open
            const interval = setInterval(loadNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, user?.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    const loadNotifications = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await getUserNotifications(user.id, { limit: 10 });
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
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

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notificações
                </h3>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary hover:underline"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma notificação</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 hover:bg-muted/50 transition-colors relative group",
                                    !notification.is_read && "bg-primary/5"
                                )}
                            >
                                <Link
                                    to={notification.link || '#'}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        onClose();
                                    }}
                                    className="block"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm mb-1">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {notification.timeAgo || 'Agora'}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => handleDelete(notification.id, e)}
                                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity"
                                    title="Remover notificação"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-border text-center">
                    <Link
                        to="/dashboard/notifications"
                        onClick={onClose}
                        className="text-xs text-primary hover:underline"
                    >
                        Ver todas as notificações
                    </Link>
                </div>
            )}
        </div>
    );
}







