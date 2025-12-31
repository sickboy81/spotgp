import { useEffect, useState } from 'react';
import { Eye, TrendingUp, Heart, BarChart, Loader2, Download } from 'lucide-react';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProfileAnalytics, AnalyticsData } from '@/lib/api/analytics';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

    const loadAnalytics = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await getProfileAnalytics(user.id, timeRange);
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            setAnalytics({
                views: { total: 0, unique: 0, today: 0, thisWeek: 0, thisMonth: 0, byDevice: {}, byDate: [] },
                clicks: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, byType: {} },
                favorites: { total: 0 },
                conversionRate: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id, timeRange]);

    useEffect(() => {
        if (user?.id) {
            loadAnalytics();
        }
    }, [user?.id, loadAnalytics]);

    const exportReport = () => {
        if (!analytics) return;

        const report = {
            Período: timeRange,
            'Total de Visualizações': analytics.views.total,
            'Visualizações Únicas': analytics.views.unique,
            'Total de Cliques': analytics.clicks.total,
            'Taxa de Conversão': `${analytics.conversionRate}%`,
            'Total de Favoritos': analytics.favorites.total,
            'Visualizações por Dispositivo': analytics.views.byDevice,
            'Cliques por Tipo': analytics.clicks.byType,
        };

        const csv = Object.entries(report)
            .map(([key, value]) => `${key},${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Não foi possível carregar os dados de analytics.</p>
            </div>
        );
    }

    // Prepare chart data
    const viewsChartData = analytics.views.byDate.map(item => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Visualizações: item.count,
    }));

    const clicksChartData = Object.entries(analytics.clicks.byType).map(([type, count]) => ({
        tipo: type === 'whatsapp' ? 'WhatsApp' : type === 'telegram' ? 'Telegram' : type === 'instagram' ? 'Instagram' : type === 'twitter' ? 'Twitter' : type === 'phone' ? 'Telefone' : type === 'message' ? 'Mensagem' : type,
        Cliques: count,
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics Detalhado</h1>
                    <p className="text-muted-foreground">Análise completa do desempenho do seu perfil</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
                        aria-label="Selecionar período"
                        className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="today">Hoje</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mês</option>
                        <option value="all">Todo o Período</option>
                    </select>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                            <h3 className="text-2xl font-bold">{analytics.views.total.toLocaleString()}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {analytics.views.unique} visualizações únicas
                    </p>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Cliques</p>
                            <h3 className="text-2xl font-bold">{analytics.clicks.total.toLocaleString()}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Taxa de conversão: {analytics.conversionRate.toFixed(1)}%
                    </p>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Favoritos</p>
                            <h3 className="text-2xl font-bold">{analytics.favorites.total.toLocaleString()}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Perfis que favoritaram você
                    </p>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <BarChart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                            <h3 className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</h3>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Views → Cliques
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views Over Time */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Visualizações ao Longo do Tempo</h3>
                    {viewsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={viewsChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Visualizações" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <p>Nenhum dado disponível para o período selecionado</p>
                        </div>
                    )}
                </div>

                {/* Clicks by Type */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Cliques por Tipo de Contato</h3>
                    {clicksChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={clicksChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tipo" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Cliques" fill="#8884d8" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            <p>Nenhum clique registrado ainda</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Visualizações por Dispositivo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(analytics.views.byDevice).map(([device, count]) => {
                        const percentage = analytics.views.total > 0
                            ? ((count / analytics.views.total) * 100).toFixed(1)
                            : '0';
                        return (
                            <div key={device} className="p-4 border border-border rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2 capitalize">
                                    {device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Desconhecido'}
                                </p>
                                <p className="text-2xl font-bold mb-2">{count.toLocaleString()}</p>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="h-full bg-primary rounded-full w-[var(--bar-width)]"
                                        style={{ '--bar-width': `${percentage}%` } as React.CSSProperties}
                                    />                            </div>
                                <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
                            </div>
                        );
                    })}
                    {Object.keys(analytics.views.byDevice).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-3 text-center py-4">
                            Nenhuma visualização registrada ainda
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}


