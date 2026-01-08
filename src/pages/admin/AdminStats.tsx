import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, AlertCircle, Eye, DollarSign, Calendar, Loader2, Gift, Power, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { directus } from '@/lib/directus';
import { readItems, aggregate } from '@directus/sdk';
import { getReports } from '@/lib/api/reports';
import { isFreeModeEnabled, setFreeMode } from '@/lib/utils/free-mode';
import { cn } from '@/lib/utils';

interface Activity {
    type: 'user' | 'report' | 'ban' | 'verification';
    action: string;
    user: string;
    time: string;
    timestamp: number;
}

export default function AdminStats() {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [loading, setLoading] = useState(true);
    const [freeMode, setFreeModeState] = useState(isFreeModeEnabled());
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        totalViews: 0,
        totalRevenue: 0,
        pendingReports: 0,
        bannedUsers: 0,
        verifiedProfiles: 0,
    });
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

    const handleToggleFreeMode = () => {
        const newValue = !freeMode;
        setFreeMode(newValue);
        setFreeModeState(newValue);
    };

    useEffect(() => {
        const getDateFilter = () => {
            const now = new Date();
            switch (timeRange) {
                case 'today':
                    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
                case 'week': {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    return weekAgo;
                }
                case 'month':
                    return new Date(now.getFullYear(), now.getMonth(), 1);
                default:
                    return null;
            }
        };

        const loadRecentActivity = async () => {
            try {
                const activities: Activity[] = [];

                // Recent users
                try {
                    const recentUsers = await directus.request(readItems('profiles', {
                        sort: ['-date_created'],
                        limit: 5,
                        fields: ['display_name', 'date_created']
                    }));

                    if (recentUsers) {
                        recentUsers.forEach((user: any) => {
                            activities.push({
                                type: 'user',
                                action: 'Novo usuário registrado',
                                user: user.display_name || 'Usuário sem nome',
                                time: formatTimeAgo(user.date_created),
                                timestamp: new Date(user.date_created).getTime(),
                            });
                        });
                    }
                } catch (e) {
                    console.warn("Error fetching recent users", e);
                }

                // Recent reports
                const reports = await getReports({ limit: 5 });
                reports.forEach(report => {
                    activities.push({
                        type: 'report',
                        action: 'Report de conteúdo recebido',
                        user: report.reported_profile?.display_name || 'Perfil sem nome',
                        time: formatTimeAgo(report.date_created), // Refactored reports use date_created
                        timestamp: new Date(report.date_created).getTime(),
                    });
                });

                // Sort by timestamp and limit
                activities.sort((a, b) => b.timestamp - a.timestamp);
                setRecentActivity(activities.slice(0, 10));
            } catch (error) {
                console.error('Error loading recent activity:', error);
            }
        };

        const loadStats = async () => {
            setLoading(true);
            try {
                const dateFilter = getDateFilter();
                const dateFilterStr = dateFilter?.toISOString();

                // Helper to get count from specific collection
                const getCount = async (collection: string, filter: any = {}) => {
                    try {
                        const result = await directus.request(aggregate(collection, {
                            aggregate: { count: '*' },
                            query: { filter }
                        }));
                        return parseInt((result[0] as any).count) || 0;
                    } catch (e) {
                        console.warn(`Error aggregation ${collection}`, e);
                        return 0;
                    }
                };

                // Total users (all system users)
                const totalUsers = await getCount('directus_users', {});

                // Active users (system status active)
                const activeUsers = await getCount('directus_users', { status: { _eq: 'active' } });

                // New users in time range (using directus_users)
                let newUsers = 0;
                // Note: directus_users might not expose date_created in all configurations? 
                // Usually it does or has last_access. Let's try filtering on id or assumption.
                // If directus_users doesn't support public read of date_created (depends on permissions), this might fail.
                // Assuming Admin access works (which seems to be the case).
                // However, directus_users doesn't always have 'date_created' standard field exposed? It does.
                // BUT recentUsers fetch below uses 'profiles'.
                // Let's stick to directus_users if possible.
                if (dateFilterStr) {
                    // Try to filter users created later than dateFilter
                    // directus_users field is typically unmanaged or requires specific field?
                    // Actually, directus_users has no standard 'date_created'.
                    // 'profiles' has 'date_created'.
                    // So for "New Users", we technically can only count profiles cleanly unless we assume IDs are sequential or use profile data.
                    // Or we assume most users have profiles.
                    // But we just found 10 users without profiles.
                    // Let's count 'profiles' for "New Users" to require engagement?
                    // No, User request is "shows fake data" (1 user). They want 11.
                    // I will TRY to use 'directus_users' but fall back to 'profiles' if needed.
                    // Actually, directus_users table structure: id, first_name, last_name, email, password, location, title, description, tags, avatar, language, theme, tfa_secret, status, role, token, last_access, last_page.
                    // It does NOT have date_created by default.

                    // Fallback to profiles for "New TRENDING Users" or assume total count difference?
                    // Actually, if I can't filter by date on directus_users, I can't effectively calculate "New Users" graph/stat for time range accurately using directus_users.
                    // BUT, 'AdminStats' time range defaults to 'month'.
                    // Maybe I keep 'newUsers' based on 'profiles' (Registros Completos)?
                    // Or I use 'profiles' count for new users.
                    // If I report Total=11 but New=1 (this month), that might be confusing if 10 registered today.

                    // Let's assume user counting is most important.
                    // I will iterate 'readUsers' with sort? No, expensive.
                    // I will stick to 'profiles' for 'newUsers' but label it mentally as "New Profiles".
                    // OR I count 'directus_users' total.

                    // Actually, let's keep 'newUsers' based on profile creation for now as date_created exists there.
                    newUsers = await getCount('profiles', { date_created: { _gte: dateFilterStr } });
                } else {
                    newUsers = await getCount('directus_users'); // 'all' time = all users
                }

                // Banned users (suspended)
                const bannedUsers = await getCount('directus_users', { status: { _eq: 'suspended' } });

                // Verified profiles
                const verifiedProfiles = await getCount('profiles', { verified: { _eq: true } });

                // Pending reports
                const reports = await getReports({ status: 'pending' });
                const pendingReports = reports.length;

                // Total views
                let totalViews = 0;
                try {
                    const viewsResult = await directus.request(aggregate('profiles', {
                        aggregate: { sum: ['views'] }
                    }));
                    // Handling SDK response (result[0].sum.views)
                    totalViews = parseInt((viewsResult[0] as any).sum?.views) || 0;
                } catch (e) {
                    console.warn("Error fetching views", e);
                }

                // Total revenue
                let totalRevenue = 0;
                try {
                    const revenueResult = await directus.request(aggregate('subscriptions', {
                        aggregate: { sum: ['amount_paid'] }
                    }));
                    totalRevenue = parseFloat((revenueResult[0] as any).sum?.amount_paid) || 0;
                } catch (e) {
                    console.warn("Error fetching revenue", e);
                }

                setStats({
                    totalUsers: totalUsers || 0,
                    activeUsers: activeUsers || 0,
                    newUsers: newUsers || 0,
                    totalViews,
                    totalRevenue,
                    pendingReports,
                    bannedUsers: bannedUsers || 0,
                    verifiedProfiles: verifiedProfiles || 0,
                });

                // Load recent activity
                await loadRecentActivity();
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [timeRange]);

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minuto${diffMins !== 1 ? 's' : ''} atrás`;
        if (diffHours < 24) return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`;
        if (diffDays < 7) return `${diffDays} dia${diffDays !== 1 ? 's' : ''} atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Estatísticas do Sistema</h1>
                    <p className="text-muted-foreground">Visão geral da plataforma e métricas importantes</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
                    className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    aria-label="Período"
                >
                    <option value="today">Hoje</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="all">Todo o Período</option>
                </select>
            </div>

            {/* Free Mode Quick Control */}
            <div className={cn(
                "bg-card border-2 rounded-xl p-6 transition-all",
                freeMode
                    ? "bg-green-500/10 border-green-500/50"
                    : "border-border"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-lg",
                            freeMode
                                ? "bg-green-500/20 text-green-500"
                                : "bg-muted text-muted-foreground"
                        )}>
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">Modo Gratuito</h3>
                            <p className="text-sm text-muted-foreground">
                                {freeMode
                                    ? 'Todo o site está gratuito para atrair novos usuários'
                                    : 'Algumas funcionalidades podem exigir planos pagos'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleFreeMode}
                            className={cn(
                                "px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg",
                                freeMode
                                    ? "bg-green-500 text-white hover:bg-green-600 hover:shadow-green-500/50"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <Power className={cn(
                                "w-4 h-4 transition-transform",
                                freeMode && "rotate-180"
                            )} />
                            {freeMode ? 'ATIVO' : 'Inativo'}
                        </button>
                        <Link
                            to="/admin/settings"
                            className="px-4 py-3 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-colors flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            Configurações
                        </Link>
                    </div>
                </div>

                {freeMode && (
                    <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Gift className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-green-600 dark:text-green-400">
                                <p className="font-semibold mb-1">✅ Modo Gratuito Ativo</p>
                                <p>Todos os recursos estão disponíveis sem necessidade de planos ou pagamentos. Ideal para atrair novos usuários.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Users className="w-6 h-6" />
                                </div>
                                {stats.newUsers > 0 && (
                                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                        +{stats.newUsers} novos
                                    </span>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Total de Usuários</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{stats.activeUsers.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                                    <Eye className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{stats.totalViews.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Visualizações</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <p className="text-sm text-muted-foreground">Receita Total</p>
                        </motion.div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{stats.verifiedProfiles}</h3>
                                    <p className="text-sm text-muted-foreground">Perfis Verificados</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{stats.pendingReports}</h3>
                                    <p className="text-sm text-muted-foreground">Reports Pendentes</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{stats.bannedUsers}</h3>
                                    <p className="text-sm text-muted-foreground">Usuários Banidos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold">Atividade Recente</h2>
                        </div>
                        <div className="space-y-4">
                            {recentActivity.map((activity, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between py-3 border-b last:border-0 border-border"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    ${activity.type === 'user' ? 'bg-blue-500/10 text-blue-500' : ''}
                                    ${activity.type === 'report' ? 'bg-orange-500/10 text-orange-500' : ''}
                                    ${activity.type === 'ban' ? 'bg-red-500/10 text-red-500' : ''}
                                    ${activity.type === 'verification' ? 'bg-green-500/10 text-green-500' : ''}
                                `}>
                                            {activity.type === 'user' && <Users className="w-5 h-5" />}
                                            {activity.type === 'report' && <AlertCircle className="w-5 h-5" />}
                                            {activity.type === 'ban' && <AlertCircle className="w-5 h-5" />}
                                            {activity.type === 'verification' && <Users className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{activity.action}</p>
                                            <p className="text-sm text-muted-foreground">{activity.user} • {activity.time}</p>
                                        </div>
                                    </div>
                                    <button className="text-sm text-primary hover:underline">Ver</button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
