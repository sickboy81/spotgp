import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createReport } from '@/lib/api/reports';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string;
    profileName: string;
}

const REPORT_TYPES = [
    { value: 'fake', label: 'Perfil Falso' },
    { value: 'inappropriate', label: 'Conteúdo Inadequado' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Assédio' },
    { value: 'minor', label: 'Menor de Idade' },
    { value: 'other', label: 'Outro' },
] as const;

export function ReportModal({ isOpen, onClose, profileId, profileName }: ReportModalProps) {
    const { user } = useAuth();
    const [reportType, setReportType] = useState<string>('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!reportType) {
            setError('Por favor, selecione um tipo de denúncia.');
            return;
        }

        if (!description.trim()) {
            setError('Por favor, descreva o motivo da denúncia.');
            return;
        }

        setSubmitting(true);

        try {
            // Save report to database using API
            const result = await createReport({
                profile_id: profileId,
                reported_by: user?.id || null,
                type: reportType as 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other',
                description: description.trim(),
                status: 'pending',
            });

            if (!result.success) {
                throw new Error(result.error || 'Erro ao criar denúncia');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setReportType('');
                setDescription('');
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            console.error('Error submitting report:', err);
            setError(err.message || 'Erro ao enviar denúncia. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setReportType('');
            setDescription('');
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                            <Flag className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Denunciar Perfil</h2>
                            <p className="text-sm text-muted-foreground">{profileName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Denúncia Enviada!</h3>
                            <p className="text-sm text-muted-foreground">
                                Obrigado por nos ajudar a manter a plataforma segura. Vamos revisar sua denúncia em breve.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Tipo de Denúncia <span className="text-destructive">*</span>
                                </label>
                                <div className="space-y-2">
                                    {REPORT_TYPES.map((type) => (
                                        <label
                                            key={type.value}
                                            className={cn(
                                                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                                reportType === type.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="reportType"
                                                value={type.value}
                                                checked={reportType === type.value}
                                                onChange={(e) => setReportType(e.target.value)}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Descrição <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva o motivo da denúncia com detalhes..."
                                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
                                    required
                                    disabled={submitting}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Forneça o máximo de detalhes possível para ajudar na revisão.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="bg-muted/50 border border-border rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-muted-foreground">
                                        <p className="font-medium mb-1">Importante:</p>
                                        <p>
                                            Sua denúncia será revisada pela equipe de moderação. Denúncias falsas podem resultar em penalidades à sua conta.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !reportType || !description.trim()}
                                    className={cn(
                                        "flex-1 px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {submitting ? 'Enviando...' : 'Enviar Denúncia'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

