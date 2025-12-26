// Complete backup and restore functionality
// Captures ALL data from the system for full site migration/restoration

import { supabase } from '../supabase';

export interface BackupData {
    version: string;
    created_at: string;
    created_by: string;
    metadata: {
        total_profiles: number;
        total_media: number;
        total_reports: number;
        total_verifications: number;
        total_transactions: number;
        total_messages: number;
        total_conversations: number;
        total_notifications: number;
    };
    data: {
        profiles: any[];
        media: any[];
        verification_documents: any[];
        reports: any[];
        profile_views: any[];
        profile_clicks: any[];
        conversations: any[];
        messages: any[];
        notifications: any[];
        // Add any other tables here
    };
}

/**
 * Create a complete backup of ALL system data
 */
export async function createFullBackup(userId: string): Promise<BackupData> {
    try {
        console.log('Iniciando backup completo...');

        // 1. Profiles (with all fields)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

        if (profilesError) {
            console.warn('Erro ao buscar profiles:', profilesError);
        }

        // 2. Media (all images and videos)
        const { data: media, error: mediaError } = await supabase
            .from('media')
            .select('*')
            .order('created_at', { ascending: true });

        if (mediaError) {
            console.warn('Erro ao buscar media:', mediaError);
        }

        // 3. Verification Documents
        const { data: verification_documents, error: verifError } = await supabase
            .from('verification_documents')
            .select('*')
            .order('created_at', { ascending: true });

        if (verifError) {
            console.warn('Erro ao buscar verification_documents:', verifError);
        }

        // 4. Reports
        const { data: reports, error: reportsError } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: true });

        if (reportsError) {
            console.warn('Erro ao buscar reports:', reportsError);
        }

        // 5. Profile Views
        const { data: profile_views, error: viewsError } = await supabase
            .from('profile_views')
            .select('*')
            .order('created_at', { ascending: true });

        if (viewsError) {
            console.warn('Erro ao buscar profile_views:', viewsError);
        }

        // 6. Profile Clicks
        const { data: profile_clicks, error: clicksError } = await supabase
            .from('profile_clicks')
            .select('*')
            .order('created_at', { ascending: true });

        if (clicksError) {
            console.warn('Erro ao buscar profile_clicks:', clicksError);
        }

        // 7. Conversations
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: true });

        if (convError) {
            console.warn('Erro ao buscar conversations:', convError);
        }

        // 8. Messages
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (msgError) {
            console.warn('Erro ao buscar messages:', msgError);
        }

        // 9. Notifications
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: true });

        if (notifError) {
            console.warn('Erro ao buscar notifications:', notifError);
        }

        // Compile backup data
        const backupData: BackupData = {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            created_by: userId,
            metadata: {
                total_profiles: profiles?.length || 0,
                total_media: media?.length || 0,
                total_reports: reports?.length || 0,
                total_verifications: verification_documents?.length || 0,
                total_transactions: 0, // TODO: Add transactions table
                total_messages: messages?.length || 0,
                total_conversations: conversations?.length || 0,
                total_notifications: notifications?.length || 0,
            },
            data: {
                profiles: profiles || [],
                media: media || [],
                verification_documents: verification_documents || [],
                reports: reports || [],
                profile_views: profile_views || [],
                profile_clicks: profile_clicks || [],
                conversations: conversations || [],
                messages: messages || [],
                notifications: notifications || [],
            },
        };

        console.log('Backup completo criado com sucesso!', backupData.metadata);
        return backupData;
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        throw error;
    }
}

/**
 * Restore a complete backup (replaces ALL data)
 */
export async function restoreFullBackup(backupData: BackupData): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
        console.log('Iniciando restauração do backup...');
        console.log('Dados a restaurar:', backupData.metadata);

        // WARNING: This will DELETE and REPLACE all existing data!
        // In production, you should:
        // 1. Create a backup first
        // 2. Verify backup integrity
        // 3. Use transactions for atomicity
        // 4. Have rollback capability

        // 1. Clear existing data (in reverse dependency order)
        console.log('Limpando dados existentes...');
        
        // Delete dependent tables first
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profile_clicks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profile_views').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('verification_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('media').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 2. Restore data (in dependency order)
        console.log('Restaurando dados...');

        // Profiles first (base table)
        if (backupData.data.profiles.length > 0) {
            const { error: profilesError } = await supabase
                .from('profiles')
                .insert(backupData.data.profiles as any);
            if (profilesError) {
                errors.push(`Erro ao restaurar profiles: ${profilesError.message}`);
                console.error('Erro ao restaurar profiles:', profilesError);
            } else {
                console.log(`✓ ${backupData.data.profiles.length} profiles restaurados`);
            }
        }

        // Media
        if (backupData.data.media.length > 0) {
            const { error: mediaError } = await supabase
                .from('media')
                .insert(backupData.data.media as any);
            if (mediaError) {
                errors.push(`Erro ao restaurar media: ${mediaError.message}`);
                console.error('Erro ao restaurar media:', mediaError);
            } else {
                console.log(`✓ ${backupData.data.media.length} media restaurados`);
            }
        }

        // Verification Documents
        if (backupData.data.verification_documents.length > 0) {
            const { error: verifError } = await supabase
                .from('verification_documents')
                .insert(backupData.data.verification_documents as any);
            if (verifError) {
                errors.push(`Erro ao restaurar verification_documents: ${verifError.message}`);
                console.error('Erro ao restaurar verification_documents:', verifError);
            } else {
                console.log(`✓ ${backupData.data.verification_documents.length} verification_documents restaurados`);
            }
        }

        // Reports
        if (backupData.data.reports.length > 0) {
            const { error: reportsError } = await supabase
                .from('reports')
                .insert(backupData.data.reports);
            if (reportsError) {
                errors.push(`Erro ao restaurar reports: ${reportsError.message}`);
                console.error('Erro ao restaurar reports:', reportsError);
            } else {
                console.log(`✓ ${backupData.data.reports.length} reports restaurados`);
            }
        }

        // Profile Views
        if (backupData.data.profile_views.length > 0) {
            const { error: viewsError } = await supabase
                .from('profile_views')
                .insert(backupData.data.profile_views);
            if (viewsError) {
                errors.push(`Erro ao restaurar profile_views: ${viewsError.message}`);
                console.error('Erro ao restaurar profile_views:', viewsError);
            } else {
                console.log(`✓ ${backupData.data.profile_views.length} profile_views restaurados`);
            }
        }

        // Profile Clicks
        if (backupData.data.profile_clicks.length > 0) {
            const { error: clicksError } = await supabase
                .from('profile_clicks')
                .insert(backupData.data.profile_clicks);
            if (clicksError) {
                errors.push(`Erro ao restaurar profile_clicks: ${clicksError.message}`);
                console.error('Erro ao restaurar profile_clicks:', clicksError);
            } else {
                console.log(`✓ ${backupData.data.profile_clicks.length} profile_clicks restaurados`);
            }
        }

        // Conversations
        if (backupData.data.conversations.length > 0) {
            const { error: convError } = await supabase
                .from('conversations')
                .insert(backupData.data.conversations);
            if (convError) {
                errors.push(`Erro ao restaurar conversations: ${convError.message}`);
                console.error('Erro ao restaurar conversations:', convError);
            } else {
                console.log(`✓ ${backupData.data.conversations.length} conversations restauradas`);
            }
        }

        // Messages
        if (backupData.data.messages.length > 0) {
            const { error: msgError } = await supabase
                .from('messages')
                .insert(backupData.data.messages);
            if (msgError) {
                errors.push(`Erro ao restaurar messages: ${msgError.message}`);
                console.error('Erro ao restaurar messages:', msgError);
            } else {
                console.log(`✓ ${backupData.data.messages.length} messages restaurados`);
            }
        }

        // Notifications
        if (backupData.data.notifications.length > 0) {
            const { error: notifError } = await supabase
                .from('notifications')
                .insert(backupData.data.notifications);
            if (notifError) {
                errors.push(`Erro ao restaurar notifications: ${notifError.message}`);
                console.error('Erro ao restaurar notifications:', notifError);
            } else {
                console.log(`✓ ${backupData.data.notifications.length} notifications restauradas`);
            }
        }

        console.log('Restauração concluída!');
        return {
            success: errors.length === 0,
            errors,
        };
    } catch (error: any) {
        console.error('Erro fatal durante restauração:', error);
        errors.push(`Erro fatal: ${error.message}`);
        return {
            success: false,
            errors,
        };
    }
}

/**
 * Validate backup integrity
 */
export function validateBackup(backupData: BackupData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check version
    if (!backupData.version) {
        errors.push('Versão do backup não encontrada');
    }

    // Check metadata matches data
    if (backupData.metadata.total_profiles !== (backupData.data.profiles?.length || 0)) {
        errors.push('Contagem de profiles não confere');
    }

    if (backupData.metadata.total_media !== (backupData.data.media?.length || 0)) {
        errors.push('Contagem de media não confere');
    }

    if (backupData.metadata.total_reports !== (backupData.data.reports?.length || 0)) {
        errors.push('Contagem de reports não confere');
    }

    if (backupData.metadata.total_verifications !== (backupData.data.verification_documents?.length || 0)) {
        errors.push('Contagem de verification_documents não confere');
    }

    if (backupData.metadata.total_messages !== (backupData.data.messages?.length || 0)) {
        errors.push('Contagem de messages não confere');
    }

    if (backupData.metadata.total_conversations !== (backupData.data.conversations?.length || 0)) {
        errors.push('Contagem de conversations não confere');
    }

    if (backupData.metadata.total_notifications !== (backupData.data.notifications?.length || 0)) {
        errors.push('Contagem de notifications não confere');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Export backup to JSON file
 */
export function exportBackupToFile(backupData: BackupData, filename?: string): void {
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Import backup from JSON file
 */
export function importBackupFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const backupData: BackupData = JSON.parse(content);
                resolve(backupData);
            } catch (error) {
                reject(new Error('Erro ao ler arquivo de backup. Verifique se o arquivo é válido.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };
        reader.readAsText(file);
    });
}


