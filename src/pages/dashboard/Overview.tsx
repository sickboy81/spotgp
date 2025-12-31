import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Eye, Loader2, BarChart, Power, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getProfileAnalytics, AnalyticsData } from '@/lib/api/analytics';
import { loadProfile, updateOnlineStatus, getCurrentOnlineStatus, ProfileData } from '@/lib/api/profile';

export default function Overview() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [onlineStatusLoading, setOnlineStatusLoading] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

    const loadProfileData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const profileData = await loadProfile(user.id);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const data = await getProfileAnalytics(user.id, timeRange);
                setAnalytics(data);
            } catch (error) {
                console.error('Error loading analytics:', error);
                // Set default values on error
                setAnalytics({
                    views: { total: 0, unique: 0, today: 0, thisWeek: 0, thisMonth: 0, byDevice: {}, byDate: [] },
                    clicks: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, byType: {} },
                    favorites: { total: 0 },
                    conversionRate: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadAnalytics();
            loadProfileData();
        }
    }, [user?.id, timeRange, loadProfileData]);

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${Math.round(change)}% `;
    };

    const handleToggleOnline = async (isOnline: boolean) => {
        if (!user?.id) return;

        setOnlineStatusLoading(true);
        try {
            const result = await updateOnlineStatus(user.id, isOnline, selectedDuration);
            if (result.success) {
                await loadProfileData();
                setSelectedDuration(null);
            } else {
                alert('Erro ao atualizar status: ' + (result.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error updating online status:', error);
            alert('Erro ao atualizar status online');
        } finally {
            setOnlineStatusLoading(false);
        }
    };

    const isCurrentlyOnline = getCurrentOnlineStatus(profile);

    const getOnlineUntilText = () => {
        if (!profile?.online_until) return null;
        const until = new Date(profile.online_until);
        const now = new Date();
        if (until <= now) return null;

        const diffMs = until.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;

        if (hours > 0) {
            return `${hours}h ${minutes > 0 ? minutes + 'min' : ''} `;
        }
        return `${minutes} min`;
    };

    const durationOptions = [
        { label: '30 minutos', value: 30 },
        { label: '1 hora', value: 60 },
        { label: '2 horas', value: 120 },
        { label: '4 horas', value: 240 },
        { label: '8 horas', value: 480 },
        { label: '12 horas', value: 720 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = analytics ? [
        {
            label: 'Total Views',
            value: formatNumber(analytics.views.total),
            icon: Eye,
            change: calculateChange(analytics.views.thisMonth, analytics.views.thisWeek),
            subtitle: `${analytics.views.unique} únicas`
        },
        {
            label: 'Cliques em Contato',
            value: formatNumber(analytics.clicks.total),
            icon: TrendingUp,
            change: calculateChange(analytics.clicks.thisMonth, analytics.clicks.thisWeek),
            subtitle: `${analytics.conversionRate.toFixed(1)}% conversão`
        },
        {
            label: 'Favoritos',
            value: formatNumber(analytics.favorites.total),
            icon: Heart,
            change: '0%',
            subtitle: 'Total de favoritos'
        },
        {
            label: 'Taxa de Conversão',
            value: `${analytics.conversionRate.toFixed(1)}% `,
            icon: BarChart,
            change: calculateChange(analytics.clicks.total, analytics.views.total > 0 ? analytics.views.total : 1),
            subtitle: 'Views → Cliques'
        },
    ] : [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
                    className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    aria-label="Select Time Range"
                >
                    <option value="today">Hoje</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="all">Todo o Período</option>
                </select>
            </div>

            {/* Online Status Control */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isCurrentlyOnline ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            <Power className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Status: Disponível Agora</h3>
                            <p className="text-sm text-muted-foreground">
                                {isCurrentlyOnline ? (
                                    profile?.online_until ? (
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Online até: {getOnlineUntilText()}
                                        </span>
                                    ) : (
                                        'Você está online (modo manual)'
                                    )
                                ) : (
                                    'Você está offline'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Duration Selector (only show when turning on) */}
                        {!isCurrentlyOnline && (
                            <select
                                value={selectedDuration || ''}
                                onChange={(e) => setSelectedDuration(e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                aria-label="Select Online Duration"
                            >
                                <option value="">Sem duração (manual)</option>
                                {durationOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}

                        <button
                            onClick={() => handleToggleOnline(!isCurrentlyOnline)}
                            disabled={onlineStatusLoading}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${isCurrentlyOnline
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                } ${onlineStatusLoading ? 'opacity-50 cursor-not-allowed' : ''} `}
                        >
                            {onlineStatusLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Power className="w-4 h-4" />
                                    {isCurrentlyOnline ? 'Desligar' : 'Ligar'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card border border-border p-6 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            {stat.change !== '0%' && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+')
                                    ? 'text-green-500 bg-green-500/10'
                                    : 'text-red-500 bg-red-500/10'
                                    }`}>
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        {stat.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Analytics Details */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Views by Device */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-4">Visualizações por Dispositivo</h3>
                        <div className="space-y-3">
                            {Object.entries(analytics.views.byDevice).map(([device, count]) => (
                                <div key={device} className="flex items-center justify-between">
                                    <span className="text-sm capitalize">{device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Desconhecido'}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full w-[var(--progress-width)]"
                                                style={{ '--progress-width': `${(count / analytics.views.total) * 100}%` } as React.CSSProperties}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(analytics.views.byDevice).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma visualização ainda</p>
                            )}
                        </div>
                    </div>

                    {/* Clicks by Type */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-4">Cliques por Tipo</h3>
                        <div className="space-y-3">
                            {Object.entries(analytics.clicks.byType).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-sm capitalize">{type === 'whatsapp' ? 'WhatsApp' : type === 'telegram' ? 'Telegram' : type === 'instagram' ? 'Instagram' : type === 'twitter' ? 'Twitter' : type === 'phone' ? 'Telefone' : type === 'message' ? 'Mensagem' : type}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full w-[var(--progress-width)]"
                                                style={{ '--progress-width': `${(count / analytics.clicks.total) * 100}%` } as React.CSSProperties}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(analytics.clicks.byType).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum clique ainda</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity Placeholder */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Atividade Recente</h3>
                <div className="space-y-4">
                    {analytics && analytics.views.total > 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Atividade recente será exibida aqui em breve</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhuma atividade ainda. Seu perfil ainda não foi visualizado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
