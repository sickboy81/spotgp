import { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, MousePointerClick, Download, PieChart, Loader2 } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { directus } from '@/lib/directus';
import { readItems, aggregate } from '@directus/sdk';

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
            // Calculate date limit based on timeRange
            const now = new Date();
            let days = 30;
            if (timeRange === 'week') days = 7;
            if (timeRange === 'quarter') days = 90;
            if (timeRange === 'year') days = 365;

            const startDate = new Date(now);
            startDate.setDate(now.getDate() - days);
            const startDateStr = startDate.toISOString();

            // Fetch Data
            const [views, clicks, profiles] = await Promise.all([
                directus.request(readItems('profile_views', {
                    limit: -1, // Fetch all for now, optimize later
                    fields: ['date_created'],
                    filter: { date_created: { _gte: startDateStr } }
                })),
                directus.request(readItems('profile_clicks', {
                    limit: -1,
                    fields: ['date_created'],
                    filter: { date_created: { _gte: startDateStr } }
                })),
                directus.request(readItems('profiles', {
                    limit: -1,
                    fields: ['display_name', 'views', 'clicks', 'certified_masseuse', 'onlineServices', 'date_created']
                })) // Profiles usually not that many, okay to fetch all
            ]);

            // Process Time Series
            const dateMap = new Map<string, { views: number; clicks: number; newUsers: number }>();

            // Initialize map with all dates in range to ensure continuous chart
            for (let i = 0; i <= days; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                dateMap.set(dateStr, { views: 0, clicks: 0, newUsers: 0 });
            }

            // Fill Data
            views.forEach((v: any) => {
                const date = v.date_created?.split('T')[0];
                if (date && dateMap.has(date)) {
                    const curr = dateMap.get(date)!;
                    curr.views++;
                    dateMap.set(date, curr);
                }
            });

            clicks.forEach((c: any) => {
                const date = c.date_created?.split('T')[0];
                if (date && dateMap.has(date)) {
                    const curr = dateMap.get(date)!;
                    curr.clicks++;
                    dateMap.set(date, curr);
                }
            });

            // New Users (Profiles)
            profiles.forEach((p: any) => {
                const date = p.date_created?.split('T')[0];
                if (date && dateMap.has(date)) {
                    const curr = dateMap.get(date)!;
                    curr.newUsers++;
                    dateMap.set(date, curr);
                }
            });

            // Convert to Array
            const chartData = Array.from(dateMap.entries()).map(([date, data]) => ({
                date,
                ...data,
                // Mock active users roughly based on views/10 + constant for now as we don't have daily active logs easily
                activeUsers: Math.floor(data.views / 5) + profiles.length
            })).sort((a, b) => a.date.localeCompare(b.date));

            // Process Categories
            let masseuseCount = 0;
            let onlineCount = 0;
            let escortCount = 0;

            profiles.forEach((p: any) => {
                if (p.certified_masseuse) masseuseCount++;
                else if (p.onlineServices && p.onlineServices.length > 0) onlineCount++;
                else escortCount++;
            });

            const categoryData = [
                { name: 'Acompanhantes', value: escortCount },
                { name: 'Massagistas', value: masseuseCount },
                { name: 'Atendimento Online', value: onlineCount },
            ].filter(c => c.value > 0);

            // Top Profiles
            const topProfilesData = profiles
                .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
                .slice(0, 5)
                .map((p: any) => ({
                    name: p.display_name || 'Sem nome',
                    views: p.views || 0,
                    clicks: p.clicks || 0
                }));

            setStats({
                viewsData: chartData.map(d => ({ date: d.date, views: d.views })),
                clicksData: chartData.map(d => ({ date: d.date, clicks: d.clicks })),
                usersData: chartData.map(d => ({ date: d.date, newUsers: d.newUsers, activeUsers: d.activeUsers })),
                categoryDistribution: categoryData,
                topProfiles: topProfilesData
            });

        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
        }
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







