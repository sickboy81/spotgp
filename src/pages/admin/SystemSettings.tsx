import { useState, useEffect } from 'react';
import { Save, Settings, AlertTriangle, Users, Shield, FileText, Loader2, Wrench, Power, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMaintenanceMode, setMaintenanceMode } from '@/lib/utils/maintenance';
import { isFreeModeEnabled, setFreeMode } from '@/lib/utils/free-mode';

export default function SystemSettings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
        type: null,
        message: ''
    });

    // Load maintenance mode and free mode from storage
    const maintenanceMode = getMaintenanceMode();
    const freeMode = isFreeModeEnabled();
    
    const [settings, setSettings] = useState({
        // General Settings
        siteName: 'acompanhantesAGORA',
        siteMaintenance: maintenanceMode.enabled,
        maintenanceMessage: maintenanceMode.message,
        
        // User Settings
        requireEmailVerification: false,
        allowNewRegistrations: true,
        siteFreeMode: freeMode, // Site totalmente gratuito para atrair usuários
        minimumAge: 18,
        maxImagesPerProfile: 10,
        minImagesPerProfile: 2,
        
        // Moderation Settings
        autoModerateReports: false,
        requireVerification: true,
        
        // Content Settings
        maxVideoSizeMB: 50,
        maxImageSizeMB: 5,
        allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif'],
        allowedVideoTypes: ['mp4', 'webm'],
    });

    // Update maintenance mode and free mode when settings change
    useEffect(() => {
        setMaintenanceMode(settings.siteMaintenance, settings.maintenanceMessage);
        setFreeMode(settings.siteFreeMode);
    }, [settings.siteMaintenance, settings.maintenanceMessage, settings.siteFreeMode]);

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus({ type: null, message: '' });

        try {
            // Save maintenance mode immediately
            setMaintenanceMode(settings.siteMaintenance, settings.maintenanceMessage);
            
            // Simulated save - in production, save to database
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // TODO: Save to Supabase settings table
            // const { error } = await supabase
            //     .from('system_settings')
            //     .upsert(settings);

            setSaveStatus({ 
                type: 'success', 
                message: settings.siteMaintenance 
                    ? 'Modo de manutenção ATIVADO! O site está offline para visitantes.' 
                    : 'Configurações salvas com sucesso!' 
            });
            
            setTimeout(() => {
                setSaveStatus({ type: null, message: '' });
            }, 5000);
        } catch (error: any) {
            setSaveStatus({ 
                type: 'error', 
                message: error.message || 'Erro ao salvar configurações' 
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Configurações do Sistema</h1>
                <p className="text-muted-foreground">Gerencie as configurações gerais da plataforma</p>
            </div>

            {saveStatus.type && (
                <div className={cn(
                    "p-4 rounded-lg border",
                    saveStatus.type === 'success'
                        ? "bg-green-500/10 border-green-500/20 text-green-600"
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                )}>
                    {saveStatus.message}
                </div>
            )}

            {/* General Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Configurações Gerais</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Site</label>
                        <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>

                    <div className={cn(
                        "p-6 border-2 rounded-xl transition-all",
                        settings.siteMaintenance
                            ? "bg-red-500/10 border-red-500/50"
                            : "bg-card border-border"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    settings.siteMaintenance
                                        ? "bg-red-500/20 text-red-500"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <label className="block text-lg font-bold mb-1">Modo de Manutenção</label>
                                    <p className="text-xs text-muted-foreground">
                                        {settings.siteMaintenance 
                                            ? 'O site está OFFLINE para visitantes. Apenas admins podem acessar.'
                                            : 'Ative para desativar o site temporariamente para visitantes'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, siteMaintenance: !prev.siteMaintenance }))}
                                className={cn(
                                    "px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg",
                                    settings.siteMaintenance
                                        ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/50"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                <Power className={cn(
                                    "w-4 h-4 transition-transform",
                                    settings.siteMaintenance && "rotate-180"
                                )} />
                                {settings.siteMaintenance ? 'ATIVO' : 'Inativo'}
                            </button>
                        </div>
                        
                        {settings.siteMaintenance && (
                            <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                        <p className="font-semibold mb-1">⚠️ Atenção:</p>
                                        <p>O site está em modo de manutenção. Visitantes verão a página de manutenção. Apenas administradores podem acessar o painel admin.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {settings.siteMaintenance && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Mensagem de Manutenção</label>
                            <textarea
                                value={settings.maintenanceMessage}
                                onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
                                placeholder="Mensagem exibida durante a manutenção..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* User Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Configurações de Usuários</h2>
                </div>

                <div className="space-y-4">
                    {/* Free Mode Toggle */}
                    <div className={cn(
                        "p-6 border-2 rounded-xl transition-all",
                        settings.siteFreeMode
                            ? "bg-green-500/10 border-green-500/50"
                            : "bg-card border-border"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    settings.siteFreeMode
                                        ? "bg-green-500/20 text-green-500"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div>
                                    <label className="block text-lg font-bold mb-1">Modo Gratuito</label>
                                    <p className="text-xs text-muted-foreground">
                                        {settings.siteFreeMode 
                                            ? 'Todas as funcionalidades estão GRATUITAS para todos os usuários'
                                            : 'Algumas funcionalidades podem exigir planos pagos'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, siteFreeMode: !prev.siteFreeMode }))}
                                className={cn(
                                    "px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg",
                                    settings.siteFreeMode
                                        ? "bg-green-500 text-white hover:bg-green-600 hover:shadow-green-500/50"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                <Power className={cn(
                                    "w-4 h-4 transition-transform",
                                    settings.siteFreeMode && "rotate-180"
                                )} />
                                {settings.siteFreeMode ? 'ATIVO' : 'Inativo'}
                            </button>
                        </div>
                        
                        {settings.siteFreeMode && (
                            <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Gift className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                        <p className="font-semibold mb-1">✅ Modo Gratuito Ativo</p>
                                        <p>Todo o site está gratuito para atrair novos usuários. Todos os recursos estão disponíveis sem necessidade de planos ou pagamentos.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1">Permitir Novos Cadastros</label>
                            <p className="text-xs text-muted-foreground">Permite ou bloqueia novos registros</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, allowNewRegistrations: !prev.allowNewRegistrations }))}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                settings.allowNewRegistrations
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {settings.allowNewRegistrations ? 'Permitido' : 'Bloqueado'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Idade Mínima</label>
                        <input
                            type="number"
                            min="18"
                            max="100"
                            value={settings.minimumAge}
                            onChange={(e) => setSettings(prev => ({ ...prev, minimumAge: parseInt(e.target.value) || 18 }))}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none max-w-[200px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Mínimo de Imagens por Perfil</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={settings.minImagesPerProfile}
                                onChange={(e) => setSettings(prev => ({ ...prev, minImagesPerProfile: parseInt(e.target.value) || 1 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Máximo de Imagens por Perfil</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={settings.maxImagesPerProfile}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxImagesPerProfile: parseInt(e.target.value) || 10 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Moderation Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Configurações de Moderação</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1">Exigir Verificação</label>
                            <p className="text-xs text-muted-foreground">Anunciantes devem verificar identidade</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, requireVerification: !prev.requireVerification }))}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                settings.requireVerification
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {settings.requireVerification ? 'Obrigatório' : 'Opcional'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1">Moderação Automática</label>
                            <p className="text-xs text-muted-foreground">Automaticamente marca reports como revisados</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, autoModerateReports: !prev.autoModerateReports }))}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                settings.autoModerateReports
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {settings.autoModerateReports ? 'Ativo' : 'Inativo'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Configurações de Conteúdo</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tamanho Máximo de Imagem (MB)</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={settings.maxImageSizeMB}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxImageSizeMB: parseInt(e.target.value) || 5 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tamanho Máximo de Vídeo (MB)</label>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={settings.maxVideoSizeMB}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxVideoSizeMB: parseInt(e.target.value) || 50 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2",
                        saving && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}


