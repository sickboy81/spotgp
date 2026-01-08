// API functions for verification system
// Fully integrated with Directus database

import { directus } from '../directus';
import { readItems, createItem, updateItem, uploadFiles } from '@directus/sdk';

export interface VerificationDocument {
    id: string;
    profile_id: string;
    document_front_url: string;
    document_back_url?: string | null;
    selfie_url?: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface VerificationStatus {
    verified: boolean;
    verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
    verification_rejected_reason?: string | null;
}

/**
 * Upload verification document to storage
 */
export async function uploadVerificationDocument(
    file: File,
    _type: 'front' | 'back' | 'selfie',
    _userId: string
): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        // Optional: Organize in a specific folder if needed

        const fileResult: any = await directus.request(uploadFiles(formData));
        const uploadedFile = Array.isArray(fileResult) ? fileResult[0] : fileResult;
        const fileId = uploadedFile.id;

        // Construct file URL
        const fileUrl = `${import.meta.env.VITE_DIRECTUS_URL}/assets/${fileId}`;
        return fileUrl;

    } catch (error) {
        throw new Error(`Erro ao fazer upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Submit verification request
 */
export async function submitVerificationRequest(
    userId: string,
    frontUrl: string,
    backUrl?: string,
    selfieUrl?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const verificationData = {
            profile_id: userId,
            document_front_url: frontUrl,
            document_back_url: backUrl || null,
            selfie_url: selfieUrl || null,
            status: 'pending',
        };

        // Create verification document record
        await directus.request(createItem('verification_documents', verificationData));

        // Update profile status
        await directus.request(updateItem('profiles', userId, {
            verification_status: 'pending',
            verified: false
        }));

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Get verification documents for a profile
 */
export async function getVerificationDocuments(profileId: string): Promise<VerificationDocument[]> {
    try {
        const records = await directus.request(readItems('verification_documents', {
            filter: { profile_id: { _eq: profileId } },
            sort: ['-date_created'],
        }));

        return records.map((record: any) => ({
            id: record.id,
            profile_id: record.profile_id,
            document_front_url: record.document_front_url,
            document_back_url: record.document_back_url,
            selfie_url: record.selfie_url,
            status: record.status,
            rejected_reason: record.rejected_reason,
            reviewed_by: record.reviewed_by,
            reviewed_at: record.reviewed_at,
            created_at: record.date_created,
            updated_at: record.date_updated
        }));
    } catch (error) {
        console.error('Error fetching verification documents:', error);
        return [];
    }
}

/**
 * Get verification status for current user
 */
export async function getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
    try {
        // Profiles have numeric IDs, but we need to find by user field
        const profiles: any[] = await directus.request(readItems('profiles', {
            filter: { user: { _eq: userId } },
            fields: ['verified', 'verification_status', 'verification_rejected_reason'],
            limit: 1
        }));

        if (!profiles || profiles.length === 0) {
            return null;
        }

        const profile = profiles[0];
        return {
            verified: profile.verified,
            verification_status: profile.verification_status || null,
            verification_rejected_reason: profile.verification_rejected_reason || null,
        };
    } catch (error) {
        console.error('Error fetching verification status:', error);
        return null;
    }
}

/**
 * Approve verification (Admin only)
 */
export async function approveVerification(
    profileId: string,
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update profile
        await directus.request(updateItem('profiles', profileId, {
            verified: true,
            verification_status: 'approved',
            verification_rejected_reason: null
        }));

        // Find latest pending document
        const pendingDocs = await directus.request(readItems('verification_documents', {
            filter: {
                profile_id: { _eq: profileId },
                status: { _eq: 'pending' }
            },
            sort: ['-date_created'],
            limit: 1
        }));

        if (pendingDocs.length > 0) {
            await directus.request(updateItem('verification_documents', pendingDocs[0].id, {
                status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            }));
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Reject verification (Admin only)
 */
export async function rejectVerification(
    profileId: string,
    reason: string,
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update profile
        await directus.request(updateItem('profiles', profileId, {
            verified: false,
            verification_status: 'rejected',
            verification_rejected_reason: reason
        }));

        // Find latest pending document
        const pendingDocs = await directus.request(readItems('verification_documents', {
            filter: {
                profile_id: { _eq: profileId },
                status: { _eq: 'pending' }
            },
            sort: ['-date_created'],
            limit: 1
        }));

        if (pendingDocs.length > 0) {
            await directus.request(updateItem('verification_documents', pendingDocs[0].id, {
                status: 'rejected',
                rejected_reason: reason,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            }));
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Get all pending verification requests (Admin only)
 */
export async function getPendingVerifications(): Promise<VerificationDocument[]> {
    try {
        const records = await directus.request(readItems('verification_documents', {
            filter: {
                _or: [
                    { status: { _eq: 'pending' } },
                    { status: { _eq: 'under_review' } }
                ]
            },
            sort: ['-date_created'],
            fields: ['*', 'profile_id.display_name'] // directus uses . notation for related fields
        }));

        return records.map((record: any) => ({
            id: record.id,
            profile_id: record.profile_id,
            document_front_url: record.document_front_url,
            document_back_url: record.document_back_url,
            selfie_url: record.selfie_url,
            status: record.status,
            rejected_reason: record.rejected_reason,
            reviewed_by: record.reviewed_by,
            reviewed_at: record.reviewed_at,
            created_at: record.date_created,
            updated_at: record.date_updated,
        }));
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        return [];
    }
}
