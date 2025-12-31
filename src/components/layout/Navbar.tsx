import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, Heart, Shield, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
    const { user, role } = useAuth();
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if at top or scrolling up
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down
                setIsVisible(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }

            setIsScrolled(currentScrollY > 0);
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 border-b border-transparent",
                isScrolled ? "bg-background/80 backdrop-blur-md border-border" : "bg-transparent",
                isVisible ? "translate-y-0" : "-translate-y-full"
            )}
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <Logo size="lg" showText={true} className="md:scale-110" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-4">
                    {role === 'super_admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-destructive to-red-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-destructive/20 hover:shadow-destructive/40">
                            <Shield className="w-4 h-4" />
                            Painel Admin
                        </Link>
                    )}
                    {user && role === 'advertiser' && (
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 hover:shadow-primary/40">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    )}
                    {!user && (
                        <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 hover:shadow-primary/40">
                            Publicar Anúncio
                        </Link>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 relative">
                    <Link to="/favorites" className="p-2 hover:bg-accent rounded-full transition-colors relative group">
                        <Heart className="w-5 h-5 group-hover:fill-current transition-colors" />
                    </Link>
                    {user && (
                        <div className="relative">
                            <NotificationBell
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            />
                            <NotificationDropdown
                                isOpen={isNotificationsOpen}
                                onClose={() => setIsNotificationsOpen(false)}
                            />
                        </div>
                    )}
                    {user ? (
                        <Link
                            to={role === 'super_admin' ? "/admin" : "/dashboard"}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                            title={role === 'super_admin' ? 'Painel Admin' : 'Dashboard'}
                        >
                            <User className="w-5 h-5" />
                        </Link>
                    ) : (
                        <Link to="/login" className="p-2 hover:bg-accent rounded-full transition-colors">
                            <User className="w-5 h-5" />
                        </Link>
                    )}
                    <button className="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
