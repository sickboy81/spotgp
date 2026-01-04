import { useState, useEffect } from 'react';
import { Activity, Monitor, Smartphone, Tablet, X, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    ip_address: string;
    user_agent: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    location?: string;
    last_activity: string;
    created_at: string;
    is_current: boolean;
}

export default function ActiveSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadSessions = async () => {
        try {
            // TODO: Load from database
            const mockSessions: Session[] = [];
            setSessions(mockSessions);
        } catch (err) {
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        if (!confirm('Tem certeza que deseja encerrar esta sessão?')) return;
        // TODO: Terminate session
        setSessions(sessions.filter(s => s.id !== sessionId));
    };

    const handleTerminateAllOther = async (userId: string) => {
        if (!confirm('Tem certeza que deseja encerrar todas as outras sessões deste usuário?')) return;
        // TODO: Terminate all other sessions
        setSessions(sessions.filter(s => s.user_id !== userId || s.is_current));
    };

    const getDeviceIcon = (deviceType: Session['device_type']) => {
        switch (deviceType) {
            case 'desktop':
                return <Monitor className="w-4 h-4" />;
            case 'mobile':
                return <Smartphone className="w-4 h-4" />;
            case 'tablet':
                return <Tablet className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dia(s) atrás`;
        if (hours > 0) return `${hours} hora(s) atrás`;
        if (minutes > 0) return `${minutes} minuto(s) atrás`;
        return 'Agora';
    };

    const sessionsByUser = sessions.reduce((acc, session) => {
        if (!acc[session.user_id]) acc[session.user_id] = [];
        acc[session.user_id].push(session);
        return acc;
    }, {} as Record<string, Session[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Sessões Ativas</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitorar e gerenciar sessões de usuários
                    </p>
                </div>
                <button
                    onClick={loadSessions}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                            <p className="text-2xl font-bold mt-1">{sessions.length}</p>
                        </div>
                        <Activity className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Usuários Únicos</p>
                            <p className="text-2xl font-bold mt-1">{Object.keys(sessionsByUser).length}</p>
                        </div>
                        <Monitor className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Média por Usuário</p>
                            <p className="text-2xl font-bold mt-1">
                                {Object.keys(sessionsByUser).length > 0 
                                    ? (sessions.length / Object.keys(sessionsByUser).length).toFixed(1)
                                    : '0'
                                }
                            </p>
                        </div>
                        <Smartphone className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(sessionsByUser).map(([userId, userSessions]) => (
                        <div key={userId} className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {userSessions[0]?.user_name || 'Usuário desconhecido'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {userSessions[0]?.user_email || userId}
                                    </p>
                                </div>
                                {userSessions.length > 1 && (
                                    <button
                                        onClick={() => handleTerminateAllOther(userId)}
                                        className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                    >
                                        Encerrar Outras ({userSessions.length - 1})
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {userSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                session.device_type === 'desktop' && "bg-blue-500/20 text-blue-600",
                                                session.device_type === 'mobile' && "bg-green-500/20 text-green-600",
                                                session.device_type === 'tablet' && "bg-purple-500/20 text-purple-600",
                                                session.device_type === 'unknown' && "bg-muted text-muted-foreground"
                                            )}>
                                                {getDeviceIcon(session.device_type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{session.user_agent}</span>
                                                    {session.is_current && (
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs rounded">
                                                            Atual
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    <span>IP: {session.ip_address}</span>
                                                    {session.location && <span> • {session.location}</span>}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Última atividade: {formatTimeAgo(session.last_activity)}
                                                </div>
                                            </div>
                                        </div>
                                        {!session.is_current && (
                                            <button
                                                onClick={() => handleTerminateSession(session.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                title="Encerrar sessão"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {sessions.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhuma sessão ativa no momento
                </div>
            )}
        </div>
    );
}






