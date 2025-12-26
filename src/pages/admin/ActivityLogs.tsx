import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Ban, ShieldCheck, Flag, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ActivityLog {
    id: string;
    type: 'ban' | 'unban' | 'verification' | 'report' | 'delete' | 'edit';
    admin_id: string;
    target_id: string;
    description: string;
    created_at: string;
    admin_name?: string;
    target_name?: string;
}

export default function ActivityLogs() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'ban' | 'unban' | 'verification' | 'report' | 'delete' | 'edit'>('all');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // For now, we'll simulate activity logs by checking recent changes
            // In a real implementation, you'd have an activity_logs table
            const activities: ActivityLog[] = [];

            // Get recent reports as activity
            const { data: reports } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (reports) {
                reports.forEach(report => {
                    activities.push({
                        id: report.id,
                        type: 'report',
                        admin_id: report.reviewed_by || '',
                        target_id: report.profile_id,
                        description: `Report criado: ${report.type} - ${report.description.substring(0, 50)}...`,
                        created_at: report.created_at,
                    });
                });
            }

            // Sort by date
            activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setLogs(activities);
        } catch (error) {
            console.error('Error loading activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: ActivityLog['type']) => {
        switch (type) {
            case 'ban':
            case 'unban':
                return <Ban className="w-4 h-4" />;
            case 'verification':
                return <ShieldCheck className="w-4 h-4" />;
            case 'report':
                return <Flag className="w-4 h-4" />;
            case 'delete':
                return <Trash2 className="w-4 h-4" />;
            default:
                return <User className="w-4 h-4" />;
        }
    };

    const getActivityColor = (type: ActivityLog['type']) => {
        switch (type) {
            case 'ban':
                return 'bg-red-500/10 text-red-600';
            case 'unban':
                return 'bg-green-500/10 text-green-600';
            case 'verification':
                return 'bg-blue-500/10 text-blue-600';
            case 'report':
                return 'bg-orange-500/10 text-orange-600';
            case 'delete':
                return 'bg-red-600/10 text-red-700';
            default:
                return 'bg-gray-500/10 text-gray-600';
        }
    };

    const getActivityLabel = (type: ActivityLog['type']) => {
        switch (type) {
            case 'ban': return 'Banimento';
            case 'unban': return 'Desbanimento';
            case 'verification': return 'Verificação';
            case 'report': return 'Report';
            case 'delete': return 'Exclusão';
            case 'edit': return 'Edição';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             log.target_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || log.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Logs de Atividade</h1>
                <p className="text-muted-foreground">Histórico de ações administrativas realizadas no sistema</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar atividades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="ban">Banimentos</option>
                        <option value="unban">Desbanimentos</option>
                        <option value="verification">Verificações</option>
                        <option value="report">Reports</option>
                        <option value="delete">Exclusões</option>
                        <option value="edit">Edições</option>
                    </select>
                </div>
            </div>

            {/* Logs List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
                    <p className="text-muted-foreground">Não há logs que correspondam aos filtros selecionados.</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="space-y-0 divide-y divide-border">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        getActivityColor(log.type)
                                    )}>
                                        {getActivityIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                                getActivityColor(log.type)
                                            )}>
                                                {getActivityLabel(log.type)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground mb-1">
                                            {log.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {log.admin_id && (
                                                <span>Admin: {log.admin_id.slice(0, 8)}...</span>
                                            )}
                                            {log.target_id && (
                                                <span>Alvo: {log.target_id.slice(0, 8)}...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


