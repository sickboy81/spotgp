import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, Settings, ShieldCheck, BarChart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown';
import { useState } from 'react';

export default function DashboardLayout() {
    const { signOut } = useAuth();
    const location = useLocation();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
        { icon: BarChart, label: 'Analytics', href: '/dashboard/analytics' },
        { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
        { icon: User, label: 'My Profile', href: '/dashboard/profile' },
        { icon: ShieldCheck, label: 'Verification', href: '/dashboard/verification' },
        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    ];
    
    // Add Notifications route if not already in navItems
    if (!navItems.find(item => item.href === '/dashboard/notifications')) {
        // Notifications page accessible via dropdown, not in sidebar
    }

    return (
        <div className="min-h-screen bg-muted/20 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo size="sm" showText={false} />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            Partner
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                location.pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="relative">
                    <div className="absolute top-0 right-0 z-10">
                        <div className="relative">
                            <NotificationBell
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            />
                            <NotificationDropdown
                                isOpen={isNotificationsOpen}
                                onClose={() => setIsNotificationsOpen(false)}
                            />
                        </div>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
}
