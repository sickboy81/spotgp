// API functions for verification system
// Prepared for database integration - currently using localStorage simulation

import { pb } from '../pocketbase';
import { RecordModel } from 'pocketbase';

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

        const record = await pb.collection('media').create(formData);
        const fileUrl = pb.files.getUrl(record, record.file);

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
        await pb.collection('verification_documents').create(verificationData);

        // Update profile status
        await pb.collection('profiles').update(userId, {
            verification_status: 'pending',
            verified: false
        });

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
        const records = await pb.collection('verification_documents').getFullList({
            filter: `profile_id="${profileId}"`,
            sort: '-created',
        });

        return records.map((record: RecordModel) => ({
            id: record.id,
            profile_id: record.profile_id,
            document_front_url: record.document_front_url,
            document_back_url: record.document_back_url,
            selfie_url: record.selfie_url,
            status: record.status as any,
            rejected_reason: record.rejected_reason,
            reviewed_by: record.reviewed_by,
            reviewed_at: record.reviewed_at,
            created_at: record.created,
            updated_at: record.updated
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
        const profile = await pb.collection('profiles').getOne(userId, {
            fields: 'verified,verification_status,verification_rejected_reason'
        });

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
        await pb.collection('profiles').update(profileId, {
            verified: true,
            verification_status: 'approved',
            verification_rejected_reason: null
        });

        // Find latest pending document
        const pendingDocs = await pb.collection('verification_documents').getList(1, 1, {
            filter: `profile_id="${profileId}" && status="pending"`,
            sort: '-created'
        });

        if (pendingDocs.items.length > 0) {
            await pb.collection('verification_documents').update(pendingDocs.items[0].id, {
                status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            });
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
        await pb.collection('profiles').update(profileId, {
            verified: false,
            verification_status: 'rejected',
            verification_rejected_reason: reason
        });

        // Find latest pending document
        const pendingDocs = await pb.collection('verification_documents').getList(1, 1, {
            filter: `profile_id="${profileId}" && status="pending"`,
            sort: '-created'
        });

        if (pendingDocs.items.length > 0) {
            await pb.collection('verification_documents').update(pendingDocs.items[0].id, {
                status: 'rejected',
                rejected_reason: reason,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            });
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
        const records = await pb.collection('verification_documents').getFullList({
            filter: 'status="pending" || status="under_review"',
            sort: '-created',
            expand: 'profile_id'
        });

        return records.map((record: RecordModel) => ({
            id: record.id,
            profile_id: record.profile_id,
            document_front_url: record.document_front_url,
            document_back_url: record.document_back_url,
            selfie_url: record.selfie_url,
            status: record.status as any,
            rejected_reason: record.rejected_reason,
            reviewed_by: record.reviewed_by,
            reviewed_at: record.reviewed_at,
            created_at: record.created,
            updated_at: record.updated,
        }));
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        return [];
    }
}
