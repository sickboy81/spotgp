import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';

interface NotificationBellProps {
    onClick: () => void;
    className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;

        const loadCount = async () => {
            const count = await getUnreadNotificationCount(user.id);
            setUnreadCount(count);
        };

        loadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadCount, 30000);

        return () => clearInterval(interval);
    }, [user?.id]);

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-2 rounded-lg hover:bg-muted transition-colors",
                className
            )}
            aria-label="Notificações"
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}






