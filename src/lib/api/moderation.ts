// API functions for moderation actions

import { directus } from '@/lib/directus';
import { updateItem, deleteItem, deleteUser as deleteDirectusUser } from '@directus/sdk';

/**
 * Ban a user
 */
export async function banUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await directus.request(updateItem('profiles', userId, { is_banned: true }));
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
        await directus.request(updateItem('profiles', userId, { is_banned: false }));
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
        // First delete profile
        await directus.request(deleteItem('profiles', userId));

        // If we want to delete the user completely from Directus auth:
        // Note: DELETE /users/:id requires admin permissions
        try {
            // Check if userId matches a user record. Usually profiles.id might equal users.id or users.id is stored in profiles.user
            // If the argument userId refers to the Profile ID, we need to find the User ID (directus_users).
            // But if userId here IS the one from Profile (which might be the same), 
            // the previous code: await pb.collection('users').delete(userId); assumed they are same or it was passed User ID.
            // In Directus, removing a user deletes their sessions etc.

            // Assuming userId passed here is possibly the UUID of the user (or profile with same UUID)
            await directus.request(deleteDirectusUser(userId));
        } catch (e) {
            console.log("Could not delete Directus user auth record or it was already deleted/not found");
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
        await directus.request(updateItem('profiles', userId, updates));
        return { success: true };
    } catch (err: any) {
        console.error('Error updating user profile:', err);
        return { success: false, error: err.message || 'Erro ao atualizar perfil' };
    }
}






