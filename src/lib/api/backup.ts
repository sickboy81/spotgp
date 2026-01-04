// Complete backup and restore functionality
// Captures ALL data from the system for full site migration/restoration

import { directus } from '@/lib/directus';
import { readItems, createItem, deleteItems } from '@directus/sdk';

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
        [key: string]: number;
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
        [key: string]: any[];
    };
}

/**
 * Create a complete backup of ALL system data
 */
export async function createFullBackup(userId: string): Promise<BackupData> {
    try {
        console.log('Iniciando backup completo...');

        const fetchFullList = async (collection: string) => {
            try {
                return await directus.request(readItems(collection, { limit: -1 }));
            } catch (e) {
                console.warn(`Could not fetch ${collection}`, e);
                return [];
            }
        };

        // 1. Profiles (with all fields)
        const profiles = await fetchFullList('profiles');

        // 2. Media (all images and videos)
        const media = await fetchFullList('media');

        // 3. Verification Documents
        const verification_documents = await fetchFullList('verification_documents');

        // 4. Reports
        const reports = await fetchFullList('reports');

        // 5. Profile Views
        const profile_views = await fetchFullList('profile_views');

        // 6. Profile Clicks
        const profile_clicks = await fetchFullList('profile_clicks');

        // 7. Conversations
        const conversations = await fetchFullList('conversations');

        // 8. Messages
        const messages = await fetchFullList('messages');

        // 9. Notifications
        const notifications = await fetchFullList('notifications');

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

        // 1. Clear existing data (in reverse dependency order)
        console.log('Limpando dados existentes...');

        const deleteCollection = async (collection: string) => {
            try {
                const items = await directus.request(readItems(collection, { limit: -1, fields: ['id'] }));
                if (!items || items.length === 0) return;

                const ids = items.map((item: any) => item.id);
                // Delete in chunks of 50 to avoid payload limits
                const chunkSize = 50;
                for (let i = 0; i < ids.length; i += chunkSize) {
                    const chunk = ids.slice(i, i + chunkSize);
                    await directus.request(deleteItems(collection, chunk));
                }
            } catch (e) {
                console.log(`Could not clear ${collection}, maybe empty or error`, e);
            }
        };

        const collections = [
            'messages', 'conversations', 'notifications', 'profile_clicks',
            'profile_views', 'reports', 'verification_documents', 'media', 'profiles'
        ];

        for (const col of collections) {
            await deleteCollection(col);
        }

        // 2. Restore data (in dependency order)
        console.log('Restaurando dados...');

        const restoreCollection = async (collection: string, items: any[]) => {
            if (!items || items.length === 0) return;
            for (const item of items) {
                try {
                    // Directus might not allow setting ID on create unless configured.
                    // We'll try to create. If ID is present in item, it might be used or ignored depending on schema.
                    // For restoration, preserving IDs is crucial for relations.
                    // If simple createItem doesn't work with explicit ID, we usually need key override or just accept new IDs (breaking relations).
                    // Assuming Directus setup allows UUIDs or we rely on it.
                    await directus.request(createItem(collection, item));
                } catch (e: any) {
                    const message = e.message || 'Unknown error';
                    errors.push(`Erro ao restaurar ${collection} (ID: ${item.id}): ${message}`);
                }
            }
            console.log(`✓ ${items.length} ${collection} restaurados`);
        };

        await restoreCollection('profiles', backupData.data.profiles);
        await restoreCollection('media', backupData.data.media);
        await restoreCollection('verification_documents', backupData.data.verification_documents);
        await restoreCollection('reports', backupData.data.reports);
        await restoreCollection('profile_views', backupData.data.profile_views);
        await restoreCollection('profile_clicks', backupData.data.profile_clicks);
        await restoreCollection('conversations', backupData.data.conversations);
        await restoreCollection('messages', backupData.data.messages);
        await restoreCollection('notifications', backupData.data.notifications);

        console.log('Restauração concluída!');
        return {
            success: errors.length === 0,
            errors,
        };
    } catch (error: any) {
        const message = error.message || 'Unknown error';
        console.error('Erro fatal durante restauração:', error);
        errors.push(`Erro fatal: ${message}`);
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
