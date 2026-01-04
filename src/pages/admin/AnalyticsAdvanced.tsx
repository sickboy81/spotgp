import { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, MousePointerClick, Download, PieChart, Loader2 } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export default function AnalyticsAdvanced() {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        viewsData: [] as Array<{ date: string; views: number }>,
        clicksData: [] as Array<{ date: string; clicks: number }>,
        usersData: [] as Array<{ date: string; newUsers: number; activeUsers: number }>,
        categoryDistribution: [] as Array<{ name: string; value: number }>,
        topProfiles: [] as Array<{ name: string; views: number; clicks: number }>,
    });

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            // TODO: Replace with real analytics data from database
            // Mock data for demonstration
            const mockViewsData = generateDateRange(timeRange).map(date => ({
                date,
                views: Math.floor(Math.random() * 1000) + 500
            }));

            const mockClicksData = generateDateRange(timeRange).map(date => ({
                date,
                clicks: Math.floor(Math.random() * 200) + 50
            }));

            const mockUsersData = generateDateRange(timeRange).map(date => ({
                date,
                newUsers: Math.floor(Math.random() * 20) + 5,
                activeUsers: Math.floor(Math.random() * 100) + 50
            }));

            const mockCategoryDistribution = [
                { name: 'Acompanhantes', value: 45 },
                { name: 'Massagistas', value: 30 },
                { name: 'Atendimento Online', value: 25 },
            ];

            const mockTopProfiles = [
                { name: 'Maria Silva', views: 5420, clicks: 320 },
                { name: 'Ana Costa', views: 4830, clicks: 280 },
                { name: 'Julia Santos', views: 4210, clicks: 250 },
            ];

            setStats({
                viewsData: mockViewsData,
                clicksData: mockClicksData,
                usersData: mockUsersData,
                categoryDistribution: mockCategoryDistribution,
                topProfiles: mockTopProfiles,
            });
        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateDateRange = (range: string): string[] => {
        const dates: string[] = [];
        const now = new Date();
        let days = 7;

        switch (range) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'quarter':
                days = 90;
                break;
            case 'year':
                days = 365;
                break;
        }

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        return dates;
    };

    const exportData = () => {
        const data = {
            views: stats.viewsData,
            clicks: stats.clicksData,
            users: stats.usersData,
            categories: stats.categoryDistribution,
            topProfiles: stats.topProfiles,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Análises Avançadas</h1>
                    <p className="text-muted-foreground mt-1">
                        Gráficos e métricas detalhadas do sistema
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        aria-label="Período"
                    >
                        <option value="week">Última semana</option>
                        <option value="month">Último mês</option>
                        <option value="quarter">Último trimestre</option>
                        <option value="year">Último ano</option>
                    </select>
                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Views Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold">Visualizações ao Longo do Tempo</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={stats.viewsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} name="Visualizações" />
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>

            {/* Clicks Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MousePointerClick className="w-5 h-5 text-green-500" />
                    <h2 className="text-xl font-bold">Cliques ao Longo do Tempo</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={stats.clicksData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="clicks" fill="#82ca9d" name="Cliques" />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>

            {/* Users Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-500" />
                    <h2 className="text-xl font-bold">Usuários ao Longo do Tempo</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={stats.usersData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="newUsers" stroke="#8884d8" strokeWidth={2} name="Novos Usuários" />
                        <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" strokeWidth={2} name="Usuários Ativos" />
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xl font-bold">Distribuição por Categoria</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={stats.categoryDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {stats.categoryDistribution.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Profiles */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-xl font-bold">Top Perfis</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.topProfiles.map((profile, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{profile.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.views.toLocaleString()} visualizações • {profile.clicks} cliques
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">
                                        {((profile.clicks / profile.views) * 100).toFixed(1)}% CTR
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}







