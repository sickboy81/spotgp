import { useState, useEffect } from 'react';
import { Save, Settings, AlertTriangle, Users, Shield, FileText, Loader2, Wrench, Power, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMaintenanceMode, setMaintenanceMode } from '@/lib/utils/maintenance';
import { isFreeModeEnabled, setFreeMode } from '@/lib/utils/free-mode';
import { directus } from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';

interface SystemSettingsData {
    id?: string;
    site_name: string;
    maintenance_mode: boolean;
    maintenance_message: string;
    free_mode: boolean;
    allow_registrations: boolean;
    require_email_verification: boolean;
    minimum_age: number;
    max_images_per_profile: number;
    min_images_per_profile: number;
    auto_moderate_reports: boolean;
    require_verification: boolean;
    max_video_size_mb: number;
    max_image_size_mb: number;
    [key: string]: any;
}

export default function SystemSettings() {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
        type: null,
        message: ''
    });

    const [settings, setSettings] = useState({
        // General
        siteName: 'acompanhantesAGORA',
        siteMaintenance: false,
        maintenanceMessage: '',

        // Users
        requireEmailVerification: false,
        allowNewRegistrations: true,
        siteFreeMode: false,
        minimumAge: 18,
        maxImagesPerProfile: 10,
        minImagesPerProfile: 2,

        // Moderation
        autoModerateReports: false,
        requireVerification: true,

        // Content
        maxVideoSizeMB: 50,
        maxImageSizeMB: 5,
    });

    // Load settings from Directus
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                // Try to get the first record from system_settings
                const records = await directus.request(readItems('system_settings', {
                    limit: 1
                }));

                if (records.length > 0) {
                    const record = records[0] as SystemSettingsData;
                    setSettingsId(record.id!);
                    setSettings({
                        siteName: record.site_name || 'acompanhantesAGORA',
                        siteMaintenance: record.maintenance_mode || false,
                        maintenanceMessage: record.maintenance_message || '',
                        requireEmailVerification: record.require_email_verification || false,
                        allowNewRegistrations: record.allow_registrations !== false, // default true
                        siteFreeMode: record.free_mode || false,
                        minimumAge: record.minimum_age || 18,
                        maxImagesPerProfile: record.max_images_per_profile || 10,
                        minImagesPerProfile: record.min_images_per_profile || 2,
                        autoModerateReports: record.auto_moderate_reports || false,
                        requireVerification: record.require_verification || true,
                        maxVideoSizeMB: record.max_video_size_mb || 50,
                        maxImageSizeMB: record.max_image_size_mb || 5,
                    });

                    // Sync local utils
                    setMaintenanceMode(record.maintenance_mode || false, record.maintenance_message || '');
                    setFreeMode(record.free_mode || false);
                } else {
                    // Fallback to local storage if no DB record found
                    const localMaint = getMaintenanceMode();
                    const localFree = isFreeModeEnabled();
                    setSettings(prev => ({
                        ...prev,
                        siteMaintenance: localMaint.enabled,
                        maintenanceMessage: localMaint.message || '',
                        siteFreeMode: localFree
                    }));
                }
            } catch (err) {
                console.warn('Could not load settings from Directus, using defaults/local storage:', err);
                // Fallback
                const localMaint = getMaintenanceMode();
                const localFree = isFreeModeEnabled();
                setSettings(prev => ({
                    ...prev,
                    siteMaintenance: localMaint.enabled,
                    maintenanceMessage: localMaint.message || '',
                    siteFreeMode: localFree
                }));
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus({ type: null, message: '' });

        try {
            // Update local utils immediately for responsive UI
            setMaintenanceMode(settings.siteMaintenance, settings.maintenanceMessage);
            setFreeMode(settings.siteFreeMode);

            const data = {
                site_name: settings.siteName,
                maintenance_mode: settings.siteMaintenance,
                maintenance_message: settings.maintenanceMessage,
                free_mode: settings.siteFreeMode,
                allow_registrations: settings.allowNewRegistrations,
                require_email_verification: settings.requireEmailVerification,
                minimum_age: settings.minimumAge,
                max_images_per_profile: settings.maxImagesPerProfile,
                min_images_per_profile: settings.minImagesPerProfile,
                auto_moderate_reports: settings.autoModerateReports,
                require_verification: settings.requireVerification,
                max_video_size_mb: settings.maxVideoSizeMB,
                max_image_size_mb: settings.maxImageSizeMB,
            };

            if (settingsId) {
                await directus.request(updateItem('system_settings', settingsId, data));
            } else {
                // Create if doesn't exist
                const record = await directus.request(createItem('system_settings', data));
                setSettingsId(record.id as string);
            }

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
            console.error('Save error:', error);
            setSaveStatus({
                type: 'error',
                message: error.message || 'Erro ao salvar configurações'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        <label className="block text-sm font-medium mb-2" htmlFor="site-name">Nome do Site</label>
                        <input
                            id="site-name"
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            title="Nome exibido do site"
                            aria-label="Nome do Site"
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
                                title={settings.siteMaintenance ? "Desativar Manutenção" : "Ativar Manutenção"}
                                aria-label={settings.siteMaintenance ? "Desativar Manutenção" : "Ativar Manutenção"}
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
                            <label className="block text-sm font-medium mb-2" htmlFor="maintenance-msg">Mensagem de Manutenção</label>
                            <textarea
                                id="maintenance-msg"
                                value={settings.maintenanceMessage}
                                onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
                                placeholder="Mensagem exibida durante a manutenção..."
                                title="Mensagem exibida aos visitantes"
                                aria-label="Mensagem de Manutenção"
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
                                title={settings.siteFreeMode ? "Desativar Modo Gratuito" : "Ativar Modo Gratuito"}
                                aria-label={settings.siteFreeMode ? "Desativar Modo Gratuito" : "Ativar Modo Gratuito"}
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
                            title={settings.allowNewRegistrations ? "Bloquear novos cadastros" : "Permitir novos cadastros"}
                            aria-label={settings.allowNewRegistrations ? "Bloquear novos cadastros" : "Permitir novos cadastros"}
                        >
                            {settings.allowNewRegistrations ? 'Permitido' : 'Bloqueado'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="min-age">Idade Mínima</label>
                        <input
                            id="min-age"
                            type="number"
                            min="18"
                            max="100"
                            value={settings.minimumAge}
                            onChange={(e) => setSettings(prev => ({ ...prev, minimumAge: parseInt(e.target.value) || 18 }))}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none max-w-[200px]"
                            title="Idade mínima para cadastro"
                            aria-label="Idade mínima"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="min-images">Mínimo de Imagens por Perfil</label>
                            <input
                                id="min-images"
                                type="number"
                                min="1"
                                max="10"
                                value={settings.minImagesPerProfile}
                                onChange={(e) => setSettings(prev => ({ ...prev, minImagesPerProfile: parseInt(e.target.value) || 1 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                title="Número mínimo de imagens por perfil"
                                aria-label="Mínimo de imagens"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="max-images">Máximo de Imagens por Perfil</label>
                            <input
                                id="max-images"
                                type="number"
                                min="1"
                                max="20"
                                value={settings.maxImagesPerProfile}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxImagesPerProfile: parseInt(e.target.value) || 10 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                title="Número máximo de imagens por perfil"
                                aria-label="Máximo de imagens"
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
                            title={settings.requireVerification ? "Desativar verificação obrigatória" : "Ativar verificação obrigatória"}
                            aria-label={settings.requireVerification ? "Desativar verificação obrigatória" : "Ativar verificação obrigatória"}
                        >
                            {settings.requireVerification ? 'Obrigatório' : 'Opcional'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1">Moderação Automática</label>
                            <p className="text-xs text-muted-foreground">Automaticamente marca reports como revisados (Cuidado!)</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, autoModerateReports: !prev.autoModerateReports }))}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                settings.autoModerateReports
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            title={settings.autoModerateReports ? "Desativar moderação automática" : "Ativar moderação automática"}
                            aria-label={settings.autoModerateReports ? "Desativar moderação automática" : "Ativar moderação automática"}
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
                            <label className="block text-sm font-medium mb-2" htmlFor="max-img-size">Tamanho Máximo de Imagem (MB)</label>
                            <input
                                id="max-img-size"
                                type="number"
                                min="1"
                                max="50"
                                value={settings.maxImageSizeMB}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxImageSizeMB: parseInt(e.target.value) || 5 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                title="Tamanho máximo de imagem em MB"
                                aria-label="Tamanho máximo de imagem"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="max-video-size">Tamanho Máximo de Vídeo (MB)</label>
                            <input
                                id="max-video-size"
                                type="number"
                                min="1"
                                max="500"
                                value={settings.maxVideoSizeMB}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxVideoSizeMB: parseInt(e.target.value) || 50 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                title="Tamanho máximo de vídeo em MB"
                                aria-label="Tamanho máximo de vídeo"
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
                    aria-label="Salvar configurações"
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
