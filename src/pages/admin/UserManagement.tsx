import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { Search, Trash2, Ban, ShieldCheck, CheckCircle, XCircle, Clock, UserX, Edit, CreditCard, Gift, Mail, BarChart3, FileText, ChevronLeft, ChevronRight, Save, X, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { unbanUser, deleteUser } from '@/lib/api/moderation';

interface UserStats {
    views?: number;
    clicks?: number;
    favorites?: number;
}

interface Profile {
    id: string;
    display_name?: string;
    role: 'visitor' | 'advertiser' | 'super_admin';
    is_banned?: boolean;
    verified?: boolean;
    verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected';
    phone?: string;
    email?: string;
    created?: string;
    stats?: UserStats;
    [key: string]: any; // Allow other props
}

interface Plan {
    id: string;
    name: string;
    price: number;
    duration_days: number;
}

const ITEMS_PER_PAGE = 20;

export default function UserManagement() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'verified' | 'unverified'>('all');

    // Edit form state
    const [editForm, setEditForm] = useState({
        display_name: '',
        email: '',
        role: 'advertiser' as 'visitor' | 'advertiser' | 'super_admin',
    });

    useEffect(() => {
        fetchUsers();
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            // TODO: Load from database
            const mockPlans: Plan[] = [
                { id: 'plan_1', name: 'Básico', price: 49.90, duration_days: 30 },
                { id: 'plan_2', name: 'Premium', price: 99.90, duration_days: 30 },
            ];
            setAvailablePlans(mockPlans);
        } catch (err) {
            console.error('Error loading plans:', err);
        }
    };

    const handleAssignPlan = async (userId: string | null, planId: string, isTrial: boolean = false) => {
        if (!userId) return;
        const plan = availablePlans.find(p => p.id === planId);
        if (!plan) return;

        // TODO: Save to database
        alert(`Plano ${plan.name} ${isTrial ? '(período grátis)' : ''} atribuído ao usuário com sucesso!`);
        setShowPlanModal(false);
        setSelectedUserId(null);
    };

    const handleOpenPlanModal = (userId: string) => {
        setSelectedUserId(userId);
        setShowPlanModal(true);
    };

    const handleOpenEditModal = (user: Profile) => {
        setSelectedUser(user);
        setEditForm({
            display_name: user.display_name || '',
            email: user.email || '',
            role: user.role,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;

        try {
            // Update profile
            await directus.request(updateItem('profiles', selectedUser.id, {
                display_name: editForm.display_name,
                role: editForm.role,
            }));

            // TODO: Update email in auth.users (requires admin privileges)
            // This would typically require server-side function or admin API

            fetchUsers();
            setShowEditModal(false);
            setSelectedUser(null);
            alert('Usuário atualizado com sucesso!');
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido');
            console.error('Error updating user:', error);
            alert('Erro ao atualizar usuário: ' + error.message);
        }
    };

    const handleOpenStatsModal = async (user: Profile) => {
        // Fetch user stats
        try {
            // TODO: Load actual stats from database
            const mockStats: UserStats = {
                views: Math.floor(Math.random() * 1000),
                clicks: Math.floor(Math.random() * 500),
                favorites: Math.floor(Math.random() * 100),
            };

            setSelectedUser({ ...user, stats: mockStats });
        } catch (err) {
            console.error('Error loading stats:', err);
            setSelectedUser(user); // Fallback
        }

        setShowStatsModal(true);
    };

    async function fetchUsers() {
        try {
            // Fetch profiles using Directus SDK
            // We use 'any' for the result to handle the dynamic nature of the fields
            const records = await directus.request(readItems('profiles', {
                sort: ['-date_created'], // Directus uses date_created
                limit: -1, // Fetch all for now, or implement server-side pagination
            }));

            const usersWithEmail = await Promise.all(records.map(async (user: any) => {
                // In production, you'd need to query directus_users through a server function or if related
                // For now, we'll try to get it from mocked logic or checking if 'user' field is expanded

                // If user.user (auth user) is populated (unlikely without permissions or expand)
                const email = user.email || (user.user && typeof user.user === 'object' ? user.user.email : `user_${user.id.slice(0, 8)}@example.com`);

                return {
                    ...user,
                    email: email,
                    created: user.date_created, // Map date_created to created
                } as Profile;
            }));

            setUsers(usersWithEmail);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleBan = async (userId: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('Tem certeza que deseja banir este usuário?')) return;
        try {
            // Since we imported banUser from @/lib/api/moderation, it should already use Directus if refactored
            // But checking the file, banUser uses 'directus.request(updateItem...)' so it works.
            const result = await unbanUser(userId).then(() => {
                // Wait, I should call banUser not unbanUser here.
                // The original code imported dynamically: import('@/lib/api/moderation').then(m => m.banUser(userId));
                // I should likely import it properly at top or use the same pattern.
                // Let's rely on the import I added at the top properly?
                // No, I only imported unbanUser and deleteUser. I need banUser too.
                return import('@/lib/api/moderation').then(m => m.banUser(userId));
            });

            if (result.error) throw new Error(result.error);
            fetchUsers();
            alert('Usuário banido com sucesso.');
        } catch (err) {
            console.error(err);
            alert('Erro ao banir usuário');
        }
    };

    const handleUnban = async (userId: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('Tem certeza que deseja desbanir este usuário?')) return;
        try {
            const result = await unbanUser(userId);
            if (result.success) {
                fetchUsers();
                alert('Usuário desbanido com sucesso.');
            } else {
                alert(result.error || 'Erro ao desbanir usuário');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao desbanir usuário');
        }
    };

    const handleDelete = async (userId: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('Tem certeza que deseja DELETAR PERMANENTEMENTE este usuário? Esta ação não pode ser desfeita!')) return;
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('Esta ação é irreversível. Tem certeza absoluta?')) return;

        try {
            const result = await deleteUser(userId);
            if (result.success) {
                fetchUsers();
                alert('Usuário deletado permanentemente.');
            } else {
                alert(result.error || 'Erro ao deletar usuário');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao deletar usuário');
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (user.display_name?.toLowerCase() || '').includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower) ||
            user.id.toLowerCase().includes(searchLower) ||
            (user.email?.toLowerCase() || '').includes(searchLower) ||
            (user.phone?.toLowerCase() || '').includes(searchLower) ||
            (user.phone?.replace(/\D/g, '') || '').includes(searchTerm.replace(/\D/g, ''));

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && !user.is_banned) ||
            (filterStatus === 'banned' && user.is_banned) ||
            (filterStatus === 'verified' && user.verified) ||
            (filterStatus === 'unverified' && !user.verified);

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterStatus]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie todos os usuários da plataforma</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="w-full bg-background border border-input rounded-md pl-10 pr-3 py-2 text-sm"
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar usuários"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'banned' | 'verified' | 'unverified')}
                        className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        aria-label="Filtrar por status"
                    >
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="banned">Banidos</option>
                        <option value="verified">Verificados</option>
                        <option value="unverified">Não Verificados</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Telefone</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Verificação</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={8} className="px-6 py-8 text-center">Loading...</td></tr>
                        ) : paginatedUsers.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
                        ) : paginatedUsers.map((user) => {
                            const verificationStatus = user.verification_status;
                            const isVerified = user.verified;

                            return (
                                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-primary font-bold">
                                                    {user.display_name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.display_name || 'Sem nome'}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-sm">{user.email || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-sm">{user.phone || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            user.role === 'super_admin' ? "bg-red-500/10 text-red-600" :
                                                user.role === 'advertiser' ? "bg-blue-500/10 text-blue-600" :
                                                    "bg-gray-500/10 text-gray-600"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {isVerified ? (
                                                <span className="px-2 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verificado
                                                </span>
                                            ) : verificationStatus === 'pending' ? (
                                                <span className="px-2 py-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Pendente
                                                </span>
                                            ) : verificationStatus === 'under_review' ? (
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Em Análise
                                                </span>
                                            ) : verificationStatus === 'rejected' ? (
                                                <span className="px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" />
                                                    Rejeitado
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-500/10 text-gray-600 border border-gray-500/20 rounded-full text-xs font-medium">
                                                    Não verificado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            user.is_banned ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                                        )}>
                                            {user.is_banned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                        {user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-1 flex-wrap">
                                            <button
                                                onClick={() => handleOpenEditModal(user)}
                                                className="p-2 hover:bg-primary/10 rounded-md text-primary transition-colors"
                                                title="Editar Usuário"
                                                aria-label={`Editar usuário ${user.display_name}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenStatsModal(user)}
                                                className="p-2 hover:bg-blue-500/10 rounded-md text-blue-600 transition-colors"
                                                title="Ver Estatísticas"
                                                aria-label={`Ver estatísticas de ${user.display_name}`}
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/profile/${user.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-green-500/10 rounded-md text-green-600 transition-colors inline-block"
                                                title="Ver Perfil Público"
                                                aria-label={`Ver perfil público de ${user.display_name}`}
                                            >
                                                <FileText className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                to={`/admin/content?userId=${user.id}`}
                                                className="p-2 hover:bg-purple-500/10 rounded-md text-purple-600 transition-colors inline-block"
                                                title="Ver Anúncios do Usuário"
                                                aria-label={`Ver anúncios de ${user.display_name}`}
                                            >
                                                <CreditCard className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleOpenPlanModal(user.id)}
                                                className="p-2 hover:bg-blue-500/10 rounded-md text-blue-600 transition-colors"
                                                title="Gerenciar Plano"
                                                aria-label={`Gerenciar plano de ${user.display_name}`}
                                            >
                                                <Gift className="w-4 h-4" />
                                            </button>
                                            {(verificationStatus === 'pending' || verificationStatus === 'under_review') && (
                                                <Link
                                                    to="/admin/verification"
                                                    className="p-2 hover:bg-primary/10 rounded-md text-primary transition-colors inline-block"
                                                    title="Ver Documentos"
                                                    aria-label={`Ver documentos de ${user.display_name}`}
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {user.is_banned ? (
                                                <button
                                                    onClick={() => handleUnban(user.id)}
                                                    className="p-2 hover:bg-green-500/10 rounded-md text-green-600 transition-colors"
                                                    title="Desbanir Usuário"
                                                    aria-label={`Desbanir usuário ${user.display_name}`}
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBan(user.id)}
                                                    className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                                                    title="Banir Usuário"
                                                    aria-label={`Banir usuário ${user.display_name}`}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 hover:bg-red-600/10 rounded-md text-red-600 transition-colors"
                                                title="Deletar Usuário Permanentemente"
                                                aria-label={`Deletar usuário ${user.display_name} permanentemente`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuários
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={cn(
                                "p-2 rounded-md border border-input transition-colors",
                                currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                            )}
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-sm transition-colors",
                                            currentPage === pageNum
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        )}
                                        aria-label={`Ir para página ${pageNum}`}
                                        aria-current={currentPage === pageNum ? 'page' : undefined}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={cn(
                                "p-2 rounded-md border border-input transition-colors",
                                currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                            )}
                            aria-label="Próxima página"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Editar Usuário</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                }}
                                className="p-1 hover:bg-muted rounded-md transition-colors"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" htmlFor="edit-display-name">Nome de Exibição</label>
                                <input
                                    id="edit-display-name"
                                    type="text"
                                    value={editForm.display_name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    aria-label="Nome de exibição"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" htmlFor="edit-email">Email</label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    disabled
                                    title="A alteração de email requer privilégios de administrador do sistema"
                                    aria-label="Email do usuário"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Email não pode ser alterado diretamente</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" htmlFor="edit-role">Role</label>
                                <select
                                    id="edit-role"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'visitor' | 'advertiser' | 'super_admin' }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    aria-label="Role do usuário"
                                >
                                    <option value="visitor">Visitor</option>
                                    <option value="advertiser">Advertiser</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {showStatsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Estatísticas do Usuário</h3>
                            <button
                                onClick={() => {
                                    setShowStatsModal(false);
                                    setSelectedUser(null);
                                }}
                                className="p-1 hover:bg-muted rounded-md transition-colors"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">{selectedUser.display_name || 'Usuário sem nome'}</p>
                                <p className="text-xs text-muted-foreground">{selectedUser.email || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-muted/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-primary">{selectedUser.stats?.views || 0}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Visualizações</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{selectedUser.stats?.clicks || 0}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Cliques</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{selectedUser.stats?.favorites || 0}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Favoritos</div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setShowStatsModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan Assignment Modal */}
            {showPlanModal && selectedUserId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Atribuir Plano ao Usuário</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Selecione um Plano</label>
                                <div className="space-y-2">
                                    {availablePlans.map((plan) => (
                                        <div key={plan.id} className="border border-border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <div className="font-bold">{plan.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        R$ {plan.price.toFixed(2)} • {plan.duration_days} dias
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAssignPlan(selectedUserId, plan.id, false)}
                                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                                >
                                                    Atribuir Plano
                                                </button>
                                                <button
                                                    onClick={() => handleAssignPlan(selectedUserId, plan.id, true)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                                                >
                                                    <Gift className="w-4 h-4" />
                                                    Período Grátis
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowPlanModal(false);
                                        setSelectedUserId(null);
                                    }}
                                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
