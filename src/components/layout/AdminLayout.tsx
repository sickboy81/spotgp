import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Users, ShieldAlert, LogOut, BarChart, ShieldCheck, FileText, Settings, Activity, Sparkles, DollarSign, Tag, LineChart, Mail, Database, MapPin, Shield, Image as ImageIcon, Monitor, Ban, MessageSquare, CreditCard, Ticket, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

export default function AdminLayout() {
    const { signOut, user, role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Security: Verify user is admin before rendering
    useEffect(() => {
        if (!user || role !== 'super_admin') {
            navigate('/', { replace: true });
        }
    }, [user, role, navigate]);

    const navItems = [
        { icon: BarChart, label: 'Estatísticas', href: '/admin' },
        { icon: Users, label: 'Usuários', href: '/admin/users' },
        { icon: ShieldCheck, label: 'Verificações', href: '/admin/verification' },
        { icon: ShieldAlert, label: 'Moderação', href: '/admin/moderation' },
        { icon: FileText, label: 'Conteúdo', href: '/admin/content' },
        { icon: Sparkles, label: 'Anúncios', href: '/admin/ads' },
        { icon: DollarSign, label: 'Financeiro', href: '/admin/financial' },
        { icon: Tag, label: 'Categorias', href: '/admin/categories' },
        { icon: LineChart, label: 'Análises', href: '/admin/analytics' },
        { icon: Mail, label: 'Emails', href: '/admin/emails' },
        { icon: MessageSquare, label: 'Chat', href: '/admin/chat' },
            { icon: CreditCard, label: 'Planos', href: '/admin/plans' },
            { icon: Ticket, label: 'Cupons', href: '/admin/coupons' },
        { icon: Database, label: 'Backup', href: '/admin/backup' },
        { icon: MapPin, label: 'Localizações', href: '/admin/locations' },
        { icon: Shield, label: 'Permissões', href: '/admin/permissions' },
        { icon: ImageIcon, label: 'Mídia', href: '/admin/media' },
        { icon: Monitor, label: 'Sessões', href: '/admin/sessions' },
        { icon: Ban, label: 'Bloqueios', href: '/admin/bans' },
        { icon: Activity, label: 'Logs', href: '/admin/logs' },
        { icon: Settings, label: 'Configurações', href: '/admin/settings' },
    ];

    // Security: Don't render if user is not admin
    if (!user || role !== 'super_admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/20 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-border bg-destructive/5">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo size="sm" showText={false} />
                        <span className="text-xl font-bold text-destructive">
                            Admin
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
                                    ? "bg-destructive/10 text-destructive"
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
                <Outlet />
            </main>
        </div>
    );
}
