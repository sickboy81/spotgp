// API functions for moderation actions

import { pb } from '@/lib/pocketbase';

/**
 * Ban a user
 */
export async function banUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await pb.collection('profiles').update(userId, { is_banned: true });
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
        await pb.collection('profiles').update(userId, { is_banned: false });
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
        await pb.collection('profiles').delete(userId);
        // Note: In PB, cascades might handle related data, or we delete users collection record which deletes profile if related using CASCADE.
        // If we are deleting the user entirely:
        try {
            await pb.collection('users').delete(userId);
        } catch (e) {
            console.log("Could not delete user auth record or it was already deleted");
        }

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
        await pb.collection('profiles').update(userId, updates);
        return { success: true };
    } catch (err: any) {
        console.error('Error updating user profile:', err);
        return { success: false, error: err.message || 'Erro ao atualizar perfil' };
    }
}


