import { useState } from 'react';
import { User, Bell, Shield, Trash2, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        profileVisibility: 'public',
        twoFactorAuth: false,
    });

    const handleSaveSettings = async () => {
        setLoading(true);
        setSaveStatus({ type: null, message: '' });

        // Simulated save - TODO: Replace with actual database call
        setTimeout(() => {
            setSaveStatus({ type: 'success', message: 'Configurações salvas com sucesso!' });
            setLoading(false);
            setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
        }, 1000);
    };

    const handleDeleteAccount = () => {
        if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
            // TODO: Implement account deletion
            alert('Funcionalidade de exclusão de conta será implementada em breve.');
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold mb-2">Configurações</h1>
                <p className="text-muted-foreground">Gerencie suas preferências e configurações de conta.</p>
            </div>

            {/* Account Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                    <User className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-foreground">Conta</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            aria-label="Email"
                            className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Alterar Senha</label>
                        <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors">
                            Alterar Senha
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">Clique para receber um email com instruções</p>
                    </div>
                </div>
            </section>

            {/* Privacy Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                    <Shield className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-foreground">Privacidade</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="text-sm font-medium">Visibilidade do Perfil</label>
                            <p className="text-xs text-muted-foreground">Quem pode ver seu perfil</p>
                        </div>
                        <select
                            value={settings.profileVisibility}
                            onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                            className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                            aria-label="Profile Visibility"
                        >
                            <option value="public">Público</option>
                            <option value="private">Privado</option>
                            <option value="verified">Apenas verificados</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="text-sm font-medium">Autenticação de Dois Fatores</label>
                            <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.twoFactorAuth}
                                onChange={(e) => setSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                                className="sr-only peer"
                                aria-label="Toggle Two Factor Authentication"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                    <Bell className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-foreground">Notificações</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="text-sm font-medium">Notificações por Email</label>
                            <p className="text-xs text-muted-foreground">Receba atualizações e mensagens importantes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                                className="sr-only peer"
                                aria-label="Toggle Email Notifications"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <label className="text-sm font-medium">Notificações por SMS</label>
                            <p className="text-xs text-muted-foreground">Receba alertas importantes por SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.smsNotifications}
                                onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                                className="sr-only peer"
                                aria-label="Toggle SMS Notifications"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-card border border-destructive/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-foreground">Zona de Perigo</h2>
                </div>

                <div className="space-y-4">
                    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <h3 className="font-medium mb-1">Excluir Conta</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-destructive text-white rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
                        >
                            Excluir Conta
                        </button>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-40">
                <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
                    {saveStatus.type && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                            saveStatus.type === 'success'
                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        )}>
                            {saveStatus.message}
                        </div>
                    )}
                    <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className={cn(
                            "px-8 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 ml-auto",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
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
        </div>
    );
}







