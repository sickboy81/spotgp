import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUploader } from '@/components/features/verification/DocumentUploader';
import {
    getVerificationStatus,
    submitVerificationRequest,
    uploadVerificationDocument,
    VerificationStatus
} from '@/lib/api/verification';
import { cn } from '@/lib/utils';

export default function Verification() {
    const { user } = useAuth();
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Document URLs
    const [frontUrl, setFrontUrl] = useState<string | null>(null);
    const [backUrl, setBackUrl] = useState<string | null>(null);
    const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

    // Files for upload
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    useEffect(() => {
        const loadStatus = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const verificationStatus = await getVerificationStatus(user.id);
                setStatus(verificationStatus);
            } catch (err) {
                console.error('Error loading verification status:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadStatus();
        }
    }, [user?.id]);

    const loadStatus = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const verificationStatus = await getVerificationStatus(user.id);
            setStatus(verificationStatus);
        } catch (err) {
            console.error('Error loading verification status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (type: 'front' | 'back' | 'selfie', file: File) => {
        if (type === 'front') setFrontFile(file);
        if (type === 'back') setBackFile(file);
        if (type === 'selfie') setSelfieFile(file);
    };

    const handleSubmit = async () => {
        if (!user?.id || !frontUrl) {
            setError('Por favor, faça upload da foto da frente do documento.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Upload files if needed
            let finalFrontUrl = frontUrl;
            let finalBackUrl = backUrl;
            let finalSelfieUrl = selfieUrl;

            if (frontFile) {
                finalFrontUrl = await uploadVerificationDocument(frontFile, 'front', user.id);
            }
            if (backFile) {
                finalBackUrl = await uploadVerificationDocument(backFile, 'back', user.id);
            }
            if (selfieFile) {
                finalSelfieUrl = await uploadVerificationDocument(selfieFile, 'selfie', user.id);
            }

            const result = await submitVerificationRequest(
                user.id,
                finalFrontUrl,
                finalBackUrl || undefined,
                finalSelfieUrl || undefined
            );

            if (result.success) {
                setSuccess(true);
                await loadStatus();
                // Reset form
                setFrontUrl(null);
                setBackUrl(null);
                setSelfieUrl(null);
                setFrontFile(null);
                setBackFile(null);
                setSelfieFile(null);
            } else {
                setError(result.error || 'Erro ao enviar solicitação de verificação.');
            }
        } catch (err: unknown) {
            setError((err as any).message || 'Erro ao processar solicitação.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = () => {
        if (!status) return null;

        switch (status.verification_status) {
            case 'approved':
                return <CheckCircle className="w-8 h-8 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-8 h-8 text-destructive" />;
            case 'under_review':
                return <Clock className="w-8 h-8 text-blue-500" />;
            case 'pending':
                return <Clock className="w-8 h-8 text-orange-500" />;
            default:
                return <AlertCircle className="w-8 h-8 text-muted-foreground" />;
        }
    };

    const getStatusMessage = () => {
        if (!status) return {
            title: 'Carregando...',
            description: 'Carregando status da verificação...',
            color: 'text-muted-foreground bg-muted border-border'
        };

        switch (status.verification_status) {
            case 'approved':
                return {
                    title: 'Verificação Aprovada',
                    description: 'Seu perfil foi verificado com sucesso! Você agora possui o badge de verificado.',
                    color: 'text-green-600 bg-green-50 border-green-200'
                };
            case 'rejected':
                return {
                    title: 'Verificação Rejeitada',
                    description: status.verification_rejected_reason || 'Sua solicitação de verificação foi rejeitada. Por favor, revise os documentos e tente novamente.',
                    color: 'text-destructive bg-destructive/10 border-destructive/20'
                };
            case 'under_review':
                return {
                    title: 'Em Análise',
                    description: 'Sua documentação está sendo analisada pela nossa equipe. Isso pode levar alguns dias úteis.',
                    color: 'text-blue-600 bg-blue-50 border-blue-200'
                };
            case 'pending':
                return {
                    title: 'Aguardando Análise',
                    description: 'Sua solicitação foi enviada e está aguardando análise pela nossa equipe.',
                    color: 'text-orange-600 bg-orange-50 border-orange-200'
                };
            default:
                return {
                    title: 'Não Verificado',
                    description: 'Envie seus documentos para verificar sua idade e obter o badge de verificado.',
                    color: 'text-muted-foreground bg-muted border-border'
                };
        }
    };

    const canSubmit = status?.verification_status !== 'pending' &&
        status?.verification_status !== 'under_review' &&
        frontUrl !== null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const statusMsg = getStatusMessage();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Verificação de Idade</h1>
                <p className="text-muted-foreground">
                    Verifique sua idade através de documento com foto para obter o badge de verificado.
                </p>
            </div>

            {/* Status Card */}
            <div className={cn(
                "border rounded-xl p-6",
                statusMsg.color
            )}>
                <div className="flex items-start gap-4">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">{statusMsg.title}</h2>
                        <p className="text-sm">{statusMsg.description}</p>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                    Solicitação de verificação enviada com sucesso! Aguarde a análise da nossa equipe.
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
                    {error}
                </div>
            )}

            {/* Upload Form */}
            {(status?.verification_status === null ||
                status?.verification_status === 'rejected') && (
                    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold">Enviar Documentos</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Front of Document */}
                            <DocumentUploader
                                label="Foto da Frente do Documento"
                                required
                                value={frontUrl}
                                onChange={setFrontUrl}
                                onFileSelect={(file) => handleFileSelect('front', file)}
                                maxSizeMB={5}
                            />

                            {/* Back of Document */}
                            <DocumentUploader
                                label="Foto do Verso do Documento (Opcional)"
                                value={backUrl}
                                onChange={setBackUrl}
                                onFileSelect={(file) => handleFileSelect('back', file)}
                                maxSizeMB={5}
                            />

                            {/* Selfie with Document */}
                            <DocumentUploader
                                label="Selfie Segurando o Documento (Opcional, mas Recomendado)"
                                value={selfieUrl}
                                onChange={setSelfieUrl}
                                onFileSelect={(file) => handleFileSelect('selfie', file)}
                                maxSizeMB={5}
                            />
                        </div>

                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                            <h3 className="font-semibold mb-2 text-sm">Instruções:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>O documento deve estar legível e com foto visível</li>
                                <li>Certifique-se de que a data de nascimento está clara</li>
                                <li>A selfie com documento ajuda a acelerar o processo</li>
                                <li>Os documentos são mantidos em segurança e confidencialidade</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || submitting}
                            className={cn(
                                "w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-opacity",
                                (!canSubmit || submitting) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {submitting ? 'Enviando...' : 'Enviar Solicitação de Verificação'}
                        </button>
                    </div>
                )}

            {/* Resubmit Button for Rejected */}
            {status?.verification_status === 'rejected' && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                        Você pode reenviar seus documentos para nova análise.
                    </p>
                    <button
                        onClick={() => {
                            setFrontUrl(null);
                            setBackUrl(null);
                            setSelfieUrl(null);
                            setFrontFile(null);
                            setBackFile(null);
                            setSelfieFile(null);
                            setError(null);
                            setSuccess(false);
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Reenviar Documentos
                    </button>
                </div>
            )}
        </div>
    );
}


