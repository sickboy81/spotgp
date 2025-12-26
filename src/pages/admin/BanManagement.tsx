import { useState, useEffect } from 'react';
import { Ban, Unlock, Globe, Search, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannedIP {
    id: string;
    ip_address: string;
    reason: string;
    banned_by: string;
    banned_at: string;
    expires_at?: string;
    is_permanent: boolean;
}

interface BannedUser {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    reason: string;
    banned_by: string;
    banned_at: string;
    expires_at?: string;
    is_permanent: boolean;
}

export default function BanManagement() {
    const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
    const [activeTab, setActiveTab] = useState<'ips' | 'users'>('ips');
    const [showAddIPBan, setShowAddIPBan] = useState(false);
    const [newIPBan, setNewIPBan] = useState({
        ip_address: '',
        reason: '',
        is_permanent: true,
        expires_at: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadBans();
    }, []);

    const loadBans = async () => {
        // TODO: Load from database
    };

    const handleAddIPBan = () => {
        if (newIPBan.ip_address.trim()) {
            const ban: BannedIP = {
                id: `ip_${Date.now()}`,
                ip_address: newIPBan.ip_address,
                reason: newIPBan.reason,
                banned_by: 'admin', // TODO: Get from auth
                banned_at: new Date().toISOString(),
                expires_at: newIPBan.is_permanent ? undefined : newIPBan.expires_at,
                is_permanent: newIPBan.is_permanent,
            };
            setBannedIPs([...bannedIPs, ban]);
            setNewIPBan({ ip_address: '', reason: '', is_permanent: true, expires_at: '' });
            setShowAddIPBan(false);
            // TODO: Save to database
        }
    };

    const handleRemoveIPBan = (id: string) => {
        if (confirm('Tem certeza que deseja remover este bloqueio de IP?')) {
            setBannedIPs(bannedIPs.filter(b => b.id !== id));
            // TODO: Remove from database
        }
    };

    const handleRemoveUserBan = (id: string) => {
        if (confirm('Tem certeza que deseja desbanir este usuário?')) {
            setBannedUsers(bannedUsers.filter(b => b.id !== id));
            // TODO: Remove from database
        }
    };

    const filteredIPs = bannedIPs.filter(ban =>
        ban.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ban.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = bannedUsers.filter(ban =>
        ban.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ban.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ban.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isExpired = (expiresAt?: string) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gerenciamento de Bloqueios</h1>
                <p className="text-muted-foreground mt-1">
                    Gerenciar IPs e usuários bloqueados
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('ips')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'ips'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        IPs Bloqueados ({bannedIPs.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'users'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4" />
                        Usuários Banidos ({bannedUsers.length})
                    </div>
                </button>
            </div>

            {/* IPs Tab */}
            {activeTab === 'ips' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por IP ou motivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddIPBan(true)}
                            className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Bloquear IP
                        </button>
                    </div>

                    {showAddIPBan && (
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4">Bloquear IP</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Endereço IP</label>
                                    <input
                                        type="text"
                                        value={newIPBan.ip_address}
                                        onChange={(e) => setNewIPBan({ ...newIPBan, ip_address: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Ex: 192.168.1.1 ou 192.168.1.0/24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Motivo</label>
                                    <textarea
                                        value={newIPBan.reason}
                                        onChange={(e) => setNewIPBan({ ...newIPBan, reason: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none h-24"
                                        placeholder="Motivo do bloqueio..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={newIPBan.is_permanent}
                                        onChange={(e) => setNewIPBan({ ...newIPBan, is_permanent: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm">Bloqueio permanente</label>
                                </div>
                                {!newIPBan.is_permanent && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Data de Expiração</label>
                                        <input
                                            type="datetime-local"
                                            value={newIPBan.expires_at}
                                            onChange={(e) => setNewIPBan({ ...newIPBan, expires_at: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowAddIPBan(false);
                                            setNewIPBan({ ip_address: '', reason: '', is_permanent: true, expires_at: '' });
                                        }}
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddIPBan}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Bloquear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">IP</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Motivo</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Bloqueado por</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Expiração</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIPs.map((ban) => {
                                    const expired = ban.expires_at && isExpired(ban.expires_at);
                                    return (
                                        <tr
                                            key={ban.id}
                                            className={cn(
                                                "border-b border-border hover:bg-muted/30 transition-colors",
                                                expired && "opacity-50"
                                            )}
                                        >
                                            <td className="px-4 py-3 font-mono">{ban.ip_address}</td>
                                            <td className="px-4 py-3">{ban.reason || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{ban.banned_by}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(ban.banned_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {ban.is_permanent ? (
                                                    <span className="px-2 py-1 bg-red-500/20 text-red-600 text-xs rounded">
                                                        Permanente
                                                    </span>
                                                ) : ban.expires_at ? (
                                                    <span className={cn(
                                                        "text-xs",
                                                        expired ? "text-muted-foreground" : ""
                                                    )}>
                                                        {new Date(ban.expires_at).toLocaleString('pt-BR')}
                                                        {expired && " (Expirado)"}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleRemoveIPBan(ban.id)}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    title="Desbloquear"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredIPs.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum IP bloqueado
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Usuário</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Motivo</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Banido por</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Expiração</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((ban) => {
                                    const expired = ban.expires_at && isExpired(ban.expires_at);
                                    return (
                                        <tr
                                            key={ban.id}
                                            className={cn(
                                                "border-b border-border hover:bg-muted/30 transition-colors",
                                                expired && "opacity-50"
                                            )}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{ban.user_name || 'Sem nome'}</div>
                                                <div className="text-sm text-muted-foreground">{ban.user_email || ban.user_id}</div>
                                            </td>
                                            <td className="px-4 py-3">{ban.reason || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{ban.banned_by}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(ban.banned_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {ban.is_permanent ? (
                                                    <span className="px-2 py-1 bg-red-500/20 text-red-600 text-xs rounded">
                                                        Permanente
                                                    </span>
                                                ) : ban.expires_at ? (
                                                    <span className={cn(
                                                        "text-xs",
                                                        expired ? "text-muted-foreground" : ""
                                                    )}>
                                                        {new Date(ban.expires_at).toLocaleString('pt-BR')}
                                                        {expired && " (Expirado)"}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleRemoveUserBan(ban.id)}
                                                    className="p-2 text-green-600 hover:bg-green-500/10 rounded transition-colors"
                                                    title="Desbanir"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum usuário banido
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


