import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    VerificationDocument
} from '@/lib/api/verification';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';

export default function VerificationReview() {
    const { user } = useAuth();
    const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedVerification, setSelectedVerification] = useState<VerificationDocument | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadVerifications();
    }, []);

    const loadVerifications = async () => {
        setLoading(true);
        try {
            // In a real implementation, this would fetch from database
            // For now, we'll use mock data structure
            const data = await getPendingVerifications();
            setVerifications(data);
        } catch (err) {
            console.error('Error loading verifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (profileId: string) => {
        if (!user?.id) return;

        setProcessing(profileId);
        try {
            const result = await approveVerification(profileId, user.id);
            if (result.success) {
                await loadVerifications();
                if (selectedVerification?.profile_id === profileId) {
                    setSelectedVerification(null);
                }
            } else {
                alert(result.error || 'Erro ao aprovar verificação');
            }
        } catch (err: unknown) {
            alert((err as Error).message || 'Erro ao processar aprovação');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (profileId: string) => {
        if (!user?.id || !rejectReason.trim()) {
            alert('Por favor, informe o motivo da rejeição.');
            return;
        }

        setProcessing(profileId);
        try {
            const result = await rejectVerification(profileId, rejectReason, user.id);
            if (result.success) {
                await loadVerifications();
                setShowRejectModal(false);
                setRejectReason('');
                if (selectedVerification?.profile_id === profileId) {
                    setSelectedVerification(null);
                }
            } else {
                alert(result.error || 'Erro ao rejeitar verificação');
            }
        } catch (err: unknown) {
            alert((err as Error).message || 'Erro ao processar rejeição');
        } finally {
            setProcessing(null);
        }
    };

    const filteredVerifications = verifications.filter(v => {
        const matchesSearch = v.profile_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: VerificationDocument['status']) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-xs font-medium">Aprovado</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium">Rejeitado</span>;
            case 'under_review':
                return <span className="px-2 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-xs font-medium">Em Análise</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-full text-xs font-medium">Pendente</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Revisão de Verificações</h1>
                <p className="text-muted-foreground">
                    Revise e aprove ou rejeite solicitações de verificação de idade.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por ID do perfil..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                            className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                            aria-label="Filtrar por status"
                        >
                            <option value="all">Todos</option>
                            <option value="pending">Pendentes</option>
                            <option value="under_review">Em Análise</option>
                            <option value="approved">Aprovados</option>
                            <option value="rejected">Rejeitados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Verifications List */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredVerifications.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <p className="text-muted-foreground">Nenhuma solicitação de verificação encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="space-y-4">
                        {filteredVerifications.map((verification) => (
                            <div
                                key={verification.id}
                                className={cn(
                                    "bg-card border rounded-xl p-4 cursor-pointer transition-all",
                                    selectedVerification?.id === verification.id
                                        ? "border-primary shadow-md"
                                        : "border-border hover:border-primary/50"
                                )}
                                onClick={() => setSelectedVerification(verification)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold">Perfil: {verification.profile_id}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(verification.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    {getStatusBadge(verification.status)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Frente: {verification.document_front_url ? '✓' : '✗'}</span>
                                    <span>Verso: {verification.document_back_url ? '✓' : '✗'}</span>
                                    <span>Selfie: {verification.selfie_url ? '✓' : '✗'}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details Panel */}
                    <div className="lg:sticky lg:top-6 lg:h-fit">
                        {selectedVerification ? (
                            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Documentos Enviados</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Perfil ID: {selectedVerification.profile_id}
                                    </p>
                                </div>

                                {/* Front Document */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Frente do Documento</label>
                                    {selectedVerification.document_front_url ? (
                                        <img
                                            src={selectedVerification.document_front_url}
                                            alt="Frente do documento"
                                            className="w-full border border-border rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-muted border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                                            Não disponível
                                        </div>
                                    )}
                                </div>

                                {/* Back Document */}
                                {selectedVerification.document_back_url && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Verso do Documento</label>
                                        <img
                                            src={selectedVerification.document_back_url}
                                            alt="Verso do documento"
                                            className="w-full border border-border rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Selfie */}
                                {selectedVerification.selfie_url && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Selfie com Documento</label>
                                        <img
                                            src={selectedVerification.selfie_url}
                                            alt="Selfie com documento"
                                            className="w-full border border-border rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                {selectedVerification.status === 'pending' || selectedVerification.status === 'under_review' ? (
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleApprove(selectedVerification.profile_id)}
                                            disabled={processing === selectedVerification.profile_id}
                                            className={cn(
                                                "flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2",
                                                processing === selectedVerification.profile_id && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={processing === selectedVerification.profile_id}
                                            className={cn(
                                                "flex-1 bg-destructive text-white px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2",
                                                processing === selectedVerification.profile_id && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Rejeitar
                                        </button>
                                    </div>
                                ) : selectedVerification.status === 'rejected' && selectedVerification.rejected_reason && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-destructive mb-1">Motivo da Rejeição:</p>
                                        <p className="text-sm text-foreground">{selectedVerification.rejected_reason}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-xl p-12 text-center">
                                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Selecione uma verificação para visualizar os documentos</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedVerification && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Rejeitar Verificação</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Informe o motivo da rejeição. O anunciante receberá esta informação.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ex: Documento ilegível, foto não corresponde, data de nascimento não visível..."
                            className="w-full h-32 px-3 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleReject(selectedVerification.profile_id)}
                                disabled={!rejectReason.trim() || processing === selectedVerification.profile_id}
                                className={cn(
                                    "flex-1 px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors",
                                    (!rejectReason.trim() || processing === selectedVerification.profile_id) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {processing === selectedVerification.profile_id ? 'Processando...' : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}






