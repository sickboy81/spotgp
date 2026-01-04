import { X, Info, Camera, Video, CheckCircle, XCircle } from 'lucide-react';

interface MediaRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MediaRulesModal({ isOpen, onClose }: MediaRulesModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Regras de Estilo</h2>
                            <p className="text-sm text-muted-foreground">Diretrizes para fotos e vídeos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Photos Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Camera className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Fotos</h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Permitido
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Só você:</strong> Nas fotos somente pode aparecer a pessoa anunciante.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Boa qualidade:</strong> Fotos nítidas e bem iluminadas.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Fotos de catálogo:</strong> Se subir fotos de objetos (vibradores, etc), devem ser originais tiradas por você.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-sm text-destructive">
                                    <XCircle className="w-4 h-4" /> Proibido
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Textos e acessórios:</strong> Proibido retoques, emojis, corações sobre o rosto, ou dados de contato (nome/telefone).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Entorno infantil:</strong> Proibido ursos de pelúcia, uniformes colegiais, decoração infantil, etc.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Fotomontagem:</strong> Proibido recortar e colar fotos.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>IA e Excesso de Edição:</strong> Fotos geradas por IA ou muito retocadas não são admitidas.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Partes do corpo:</strong> O anúncio não pode ter apenas fotos de close-up de partes do corpo.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Fotos repetidas:</strong> Fotos muito parecidas serão consideradas repetidas.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Copyright/Logos:</strong> Proibido fotos com direitos autorais ou logos de outros sites.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                            <strong>Nota sobre rosto:</strong> Se quiser ocultar seu rosto, deve esfumá-lo ou pixelá-lo. Não use emojis ou desenhos.
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Videos Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Video className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Vídeos</h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" /> Permitido
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Só você:</strong> Nos vídeos somente pode aparecer a pessoa anunciante.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Boa qualidade:</strong> Vídeos nítidos e bem iluminados.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 mt-1.5 flex-shrink-0" />
                                        <span><strong>Dinâmico:</strong> O vídeo deve ter movimento, não pode ser estático ou sequência de fotos.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-sm text-destructive">
                                    <XCircle className="w-4 h-4" /> Proibido
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Textos e acessórios:</strong> Mesmas regras das fotos (sem dados de contato, emojis cobrindo rosto).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Entorno infantil:</strong> Proibido elementos infantis no cenário.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 mt-1.5 flex-shrink-0" />
                                        <span><strong>Vídeos repetidos:</strong> Proibido vídeos muito parecidos no mesmo anúncio.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
}
