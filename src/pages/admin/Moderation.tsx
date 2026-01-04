import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Check, X, Eye, Ban, Search, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getReports, updateReport, ReportWithProfile } from '@/lib/api/reports';
import { banUser } from '@/lib/api/moderation';
import { useAuth } from '@/hooks/useAuth';

export default function Moderation() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
    const [reports, setReports] = useState<ReportWithProfile[]>([]);



    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReports({
                status: filterStatus === 'all' ? undefined : filterStatus,
            });
            setReports(data);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const filteredReports = reports.filter(report => {
        const profileName = report.reported_profile?.display_name || report.profile_id;
        const reporterId = report.reported_by || '';
        const matchesSearch = profileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reporterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleStatusChange = async (id: string, status: ReportWithProfile['status']) => {
        try {
            const result = await updateReport(id, {
                status,
                reviewed_by: user?.id || null,
                reviewed_at: new Date().toISOString(),
            });
            if (result.success) {
                await loadReports();
            } else {
                alert(result.error || 'Erro ao atualizar report');
            }
        } catch (error: unknown) {
            console.error('Error updating report:', error);
            alert('Erro ao atualizar report');
        }
    };

    const handleBan = async (reportId: string, profileId: string) => {
        if (!confirm('Tem certeza que deseja banir este usuário?')) return;

        try {
            // Ban the user
            const result = await banUser(profileId);

            if (!result.success) throw new Error(result.error);

            // Update report status
            await handleStatusChange(reportId, 'resolved');
            alert('Usuário banido com sucesso.');
        } catch (error: unknown) {
            console.error('Error banning user:', error);
            alert('Erro ao banir usuário');
        }
    };

    const getStatusColor = (status: ReportWithProfile['status']) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'reviewed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'dismissed': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const getTypeLabel = (type: ReportWithProfile['type']) => {
        switch (type) {
            case 'fake': return 'Perfil Falso';
            case 'inappropriate': return 'Conteúdo Inadequado';
            case 'spam': return 'Spam';
            case 'harassment': return 'Assédio';
            case 'minor': return 'Menor de Idade';
            case 'other': return 'Outro';
            default: return type;
        }
    };

    const getTypeColor = (type: ReportWithProfile['type']) => {
        switch (type) {
            case 'inappropriate': return 'text-red-500';
            case 'spam': return 'text-yellow-500';
            case 'harassment': return 'text-orange-500';
            case 'fake': return 'text-purple-500';
            case 'minor': return 'text-red-600';
            case 'other': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const formatDate = (dateString: string) => {
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
            <div>
                <h1 className="text-3xl font-bold mb-2">Moderação</h1>
                <p className="text-muted-foreground">Gerencie reports e modere conteúdo da plataforma</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                filterStatus === status
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {status === 'all' ? 'Todos' :
                                status === 'pending' ? 'Pendentes' :
                                    status === 'reviewed' ? 'Revisados' :
                                        status === 'resolved' ? 'Resolvidos' : 'Descartados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum report encontrado</h3>
                        <p className="text-muted-foreground">Não há reports que correspondam aos filtros selecionados.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const profileName = report.reported_profile?.display_name || 'Perfil sem nome';
                        const profileId = report.profile_id;

                        return (
                            <div key={report.id} className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={cn("text-sm font-medium", getTypeColor(report.type))}>
                                                {getTypeLabel(report.type)}
                                            </span>
                                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getStatusColor(report.status))}>
                                                {report.status === 'pending' ? 'Pendente' :
                                                    report.status === 'reviewed' ? 'Revisado' :
                                                        report.status === 'resolved' ? 'Resolvido' : 'Descartado'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">Reportado: {profileName}</h3>
                                            {report.reported_profile?.ad_id && (
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    (ID: {report.reported_profile.ad_id})
                                                </span>
                                            )}
                                            <Link
                                                to={`/ profile / ${profileId} `}
                                                target="_blank"
                                                className="text-primary hover:underline flex items-center gap-1 text-xs"
                                            >
                                                Ver perfil
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                        {report.reported_by && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Reportado por: {report.reported_by.slice(0, 8)}...
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDate(report.date_created)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
                                    {report.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusChange(report.id, 'reviewed')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-500/20 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Revisar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleBan(report.id, profileId)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-md text-sm font-medium hover:bg-red-500/20 transition-colors"
                                    >
                                        <Ban className="w-4 h-4" />
                                        Banir Usuário
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(report.id, 'resolved')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-md text-sm font-medium hover:bg-green-500/20 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Resolver
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(report.id, 'dismissed')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-500/20 transition-colors ml-auto"
                                    >
                                        <X className="w-4 h-4" />
                                        Descartar
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

