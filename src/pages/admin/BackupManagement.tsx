import { useState, useRef } from 'react';
import { Database, Download, Upload, Clock, HardDrive, CheckCircle, AlertCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createFullBackup, restoreFullBackup, validateBackup, exportBackupToFile, importBackupFromFile, BackupData } from '@/lib/api/backup';

interface Backup {
    id: string;
    name: string;
    type: 'full' | 'profiles' | 'transactions' | 'settings';
    size: string;
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
    metadata?: BackupData['metadata'];
    data?: BackupData | null; // Store backup data in memory
}

export default function BackupManagement() {
    const { user } = useAuth();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [backupType, setBackupType] = useState<'full' | 'profiles' | 'transactions' | 'settings'>('full');
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [restoringBackup, setRestoringBackup] = useState(false);
    const [currentBackup, setCurrentBackup] = useState<BackupData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = async () => {
        if (!user?.id) {
            alert('Você precisa estar logado para criar um backup');
            return;
        }

        setCreatingBackup(true);
        try {
            console.log('Criando backup completo...');
            const backupData = await createFullBackup(user.id);
            
            // Calculate size
            const jsonSize = JSON.stringify(backupData).length;
            const sizeMB = (jsonSize / (1024 * 1024)).toFixed(2);
            
            const newBackup: Backup = {
                id: `backup_${Date.now()}`,
                name: `Backup_Completo_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}`,
                type: 'full',
                size: `${sizeMB} MB`,
                created_at: new Date().toISOString(),
                status: 'completed',
                metadata: backupData.metadata,
                data: backupData,
            };
            
            setBackups([newBackup, ...backups]);
            setCurrentBackup(backupData);
            
            // Auto download
            exportBackupToFile(backupData, `${newBackup.name}.json`);
            
            alert(`Backup criado com sucesso!\n\nDados incluídos:\n- ${backupData.metadata.total_profiles} perfis\n- ${backupData.metadata.total_media} mídias\n- ${backupData.metadata.total_reports} reports\n- ${backupData.metadata.total_verifications} verificações\n- ${backupData.metadata.total_conversations} conversas\n- ${backupData.metadata.total_messages} mensagens\n- ${backupData.metadata.total_notifications} notificações\n\nO arquivo foi baixado automaticamente.`);
        } catch (err: any) {
            console.error('Error creating backup:', err);
            alert(`Erro ao criar backup: ${err.message}`);
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDownloadBackup = (backup: Backup) => {
        if (backup.data) {
            exportBackupToFile(backup.data, `${backup.name}.json`);
        } else {
            alert('Dados do backup não estão disponíveis. Recrie o backup.');
        }
    };

    const handleRestoreBackup = async (backup: Backup) => {
        if (!backup.data) {
            alert('Dados do backup não estão disponíveis. Por favor, importe o arquivo novamente.');
            return;
        }

        // Validate backup first
        const validation = validateBackup(backup.data);
        if (!validation.valid) {
            alert(`Backup inválido:\n${validation.errors.join('\n')}`);
            return;
        }

        // Double confirmation
        const confirm1 = confirm(
            `⚠️ ATENÇÃO: Esta ação irá SUBSTITUIR TODOS os dados atuais do sistema!\n\n` +
            `O backup contém:\n` +
            `- ${backup.data.metadata.total_profiles} perfis\n` +
            `- ${backup.data.metadata.total_media} mídias\n` +
            `- ${backup.data.metadata.total_reports} reports\n` +
            `- ${backup.data.metadata.total_verifications} verificações\n` +
            `- ${backup.data.metadata.total_conversations} conversas\n` +
            `- ${backup.data.metadata.total_messages} mensagens\n` +
            `- ${backup.data.metadata.total_notifications} notificações\n\n` +
            `Tem certeza que deseja continuar?`
        );
        
        if (!confirm1) return;

        const confirm2 = confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados atuais serão PERDIDOS e substituídos pelos dados do backup. Continuar?');
        if (!confirm2) return;

        setRestoringBackup(true);
        try {
            const result = await restoreFullBackup(backup.data);
            
            if (result.success) {
                alert(`✅ Restauração concluída com sucesso!\n\nTodos os dados foram restaurados do backup.\nRecomendamos recarregar a página.`);
                // Optionally reload the page
                // window.location.reload();
            } else {
                alert(`⚠️ Restauração concluída com erros:\n\n${result.errors.join('\n')}\n\nAlguns dados podem não ter sido restaurados corretamente.`);
            }
        } catch (err: any) {
            console.error('Error restoring backup:', err);
            alert(`Erro ao restaurar backup: ${err.message}`);
        } finally {
            setRestoringBackup(false);
        }
    };

    const handleImportBackup = async () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const backupData = await importBackupFromFile(file);
            
            // Validate
            const validation = validateBackup(backupData);
            if (!validation.valid) {
                alert(`Backup inválido:\n${validation.errors.join('\n')}`);
                return;
            }

            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            const importedBackup: Backup = {
                id: `backup_${Date.now()}`,
                name: file.name.replace('.json', ''),
                type: 'full',
                size: `${fileSizeMB} MB`,
                created_at: backupData.created_at,
                status: 'completed',
                metadata: backupData.metadata,
                data: backupData,
            };

            setBackups([importedBackup, ...backups]);
            setCurrentBackup(backupData);
            
            alert(`✅ Backup importado com sucesso!\n\nDados incluídos:\n- ${backupData.metadata.total_profiles} perfis\n- ${backupData.metadata.total_media} mídias\n- ${backupData.metadata.total_reports} reports\n- ${backupData.metadata.total_verifications} verificações`);
        } catch (err: any) {
            alert(`Erro ao importar backup: ${err.message}`);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getBackupTypeLabel = (type: Backup['type']) => {
        switch (type) {
            case 'full':
                return 'Completo';
            case 'profiles':
                return 'Perfis';
            case 'transactions':
                return 'Transações';
            case 'settings':
                return 'Configurações';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Backup e Restauração Completa</h1>
                <p className="text-muted-foreground mt-1">
                    Backup completo de TODOS os dados do sistema - Perfeito para migração ou restauração
                </p>
            </div>

            {/* Warning */}
            {currentBackup && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                            ⚠️ Backup Completo Criado
                        </h3>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300">
                            Este backup contém <strong>TODOS</strong> os dados do sistema: perfis, mídias, verificações, reports, mensagens, conversas, notificações e muito mais.
                            Você pode usar este arquivo para restaurar tudo em outro site e aparecerá <strong>exatamente igual</strong>.
                        </p>
                        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-300 space-y-1">
                            <div>📊 {currentBackup.metadata.total_profiles} perfis</div>
                            <div>🖼️ {currentBackup.metadata.total_media} mídias</div>
                            <div>📋 {currentBackup.metadata.total_reports} reports</div>
                            <div>✅ {currentBackup.metadata.total_verifications} verificações</div>
                            <div>💬 {currentBackup.metadata.total_conversations} conversas</div>
                            <div>📨 {currentBackup.metadata.total_messages} mensagens</div>
                            <div>🔔 {currentBackup.metadata.total_notifications} notificações</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Backup Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Criar Backup</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Backup</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(['full', 'profiles', 'transactions', 'settings'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBackupType(type)}
                                    className={cn(
                                        "p-4 border-2 rounded-lg transition-colors text-left",
                                        backupType === type
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <div className="font-medium mb-1">{getBackupTypeLabel(type)}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {type === 'full' && 'Todos os dados'}
                                        {type === 'profiles' && 'Apenas perfis'}
                                        {type === 'transactions' && 'Apenas transações'}
                                        {type === 'settings' && 'Apenas configurações'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateBackup}
                            disabled={creatingBackup}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2",
                                creatingBackup && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {creatingBackup ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Criando Backup Completo...
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4" />
                                    Criar Backup Completo
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleImportBackup}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Importar Backup
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelected}
                            className="hidden"
                        />
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>ℹ️ Backup Completo inclui:</strong> Todos os perfis, mídias (imagens/vídeos), verificações, reports, visualizações, cliques, conversas, mensagens, notificações e todos os dados relacionados. 
                            O arquivo JSON gerado pode ser usado para restaurar tudo em outro site e aparecerá exatamente igual.
                        </p>
                    </div>
                </div>
            </div>

            {/* Backup History */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-bold">Histórico de Backups</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Nome</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Tamanho</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backups.map((backup) => (
                                <tr key={backup.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium">{backup.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-600 text-xs font-medium rounded">
                                            {getBackupTypeLabel(backup.type)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{backup.size}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {backup.status === 'completed' && (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm text-green-600">Concluído</span>
                                                </>
                                            )}
                                            {backup.status === 'pending' && (
                                                <>
                                                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                                    <span className="text-sm text-yellow-600">Pendente</span>
                                                </>
                                            )}
                                            {backup.status === 'failed' && (
                                                <>
                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                    <span className="text-sm text-red-600">Falhou</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(backup.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDownloadBackup(backup)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRestoreBackup(backup)}
                                                disabled={restoringBackup || !backup.data}
                                                className={cn(
                                                    "p-2 text-green-600 hover:bg-green-500/10 rounded transition-colors",
                                                    (!backup.data || restoringBackup) && "opacity-50 cursor-not-allowed"
                                                )}
                                                title={backup.data ? "Restaurar backup" : "Dados não disponíveis - importe o arquivo"}
                                            >
                                                {restoringBackup ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                            </button>
                                            {backup.metadata && (
                                                <button
                                                    onClick={() => {
                                                        const metadata = backup.metadata!;
                                                        alert(
                                                            `Estatísticas do Backup:\n\n` +
                                                            `📊 ${metadata.total_profiles} perfis\n` +
                                                            `🖼️ ${metadata.total_media} mídias\n` +
                                                            `📋 ${metadata.total_reports} reports\n` +
                                                            `✅ ${metadata.total_verifications} verificações\n` +
                                                            `💬 ${metadata.total_conversations} conversas\n` +
                                                            `📨 ${metadata.total_messages} mensagens\n` +
                                                            `🔔 ${metadata.total_notifications} notificações`
                                                        );
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-500/10 rounded transition-colors"
                                                    title="Ver estatísticas"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {backups.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum backup criado ainda
                        </div>
                    )}
                </div>
            </div>

            {/* Storage Info */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <h2 className="text-xl font-bold">Informações de Armazenamento</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Espaço Total</div>
                        <div className="text-2xl font-bold">500 GB</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Espaço Usado</div>
                        <div className="text-2xl font-bold">125 GB</div>
                        <div className="text-xs text-muted-foreground mt-1">25% utilizado</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Espaço Disponível</div>
                        <div className="text-2xl font-bold">375 GB</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

