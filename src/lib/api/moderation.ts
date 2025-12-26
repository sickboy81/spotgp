// API functions for moderation actions

import { supabase } from '../supabase';

/**
 * Ban a user
 */
export async function banUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error banning user:', err);
        return { success: false, error: err.message || 'Erro ao banir usuário' };
    }
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: false })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error unbanning user:', err);
        return { success: false, error: err.message || 'Erro ao desbanir usuário' };
    }
}

/**
 * Delete a user permanently
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // First delete related data (reports, media, etc.)
        // Then delete the profile
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting user:', err);
        return { success: false, error: err.message || 'Erro ao deletar usuário' };
    }
}

/**
 * Update user profile (admin edit)
 */
export async function updateUserProfile(
    userId: string,
    updates: {
        display_name?: string;
        is_banned?: boolean;
        verified?: boolean;
        verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected';
        [key: string]: any;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error updating user profile:', err);
        return { success: false, error: err.message || 'Erro ao atualizar perfil' };
    }
}


