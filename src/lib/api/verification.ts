// API functions for verification system
// Prepared for database integration - currently using localStorage simulation

import { supabase } from '../supabase';

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
 * TODO: Replace with actual Supabase Storage upload when ready
 */
export async function uploadVerificationDocument(
    file: File,
    type: 'front' | 'back' | 'selfie',
    userId: string
): Promise<string> {
    try {
        // Simulated upload - in production, upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `verification/${userId}/${type}_${Date.now()}.${fileExt}`;
        
        // TODO: Uncomment when ready to integrate with Supabase Storage
        /*
        const { error: uploadError } = await supabase.storage
            .from('verification-documents')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('verification-documents')
            .getPublicUrl(fileName);

        return publicUrl;
        */

        // For now, return a data URL (base64) stored in localStorage
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // Store in localStorage temporarily
                const key = `verification_${userId}_${type}`;
                localStorage.setItem(key, dataUrl);
                resolve(dataUrl);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } catch (error: any) {
        throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
}

/**
 * Submit verification request
 * TODO: Replace with actual Supabase insert when ready
 */
export async function submitVerificationRequest(
    userId: string,
    frontUrl: string,
    backUrl?: string,
    selfieUrl?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Simulated - replace with actual database call
        const verificationData = {
            id: `verification_${userId}_${Date.now()}`,
            profile_id: userId,
            document_front_url: frontUrl,
            document_back_url: backUrl || null,
            selfie_url: selfieUrl || null,
            status: 'pending' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Store in localStorage for now
        const existing = JSON.parse(localStorage.getItem(`verification_${userId}`) || '[]');
        existing.push(verificationData);
        localStorage.setItem(`verification_${userId}`, JSON.stringify(existing));

        // Update profile status
        const profileData = JSON.parse(localStorage.getItem(`profile_${userId}`) || '{}');
        profileData.verification_status = 'pending';
        profileData.verified = false;
        localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));

        // TODO: Uncomment when ready to integrate with database
        /*
        const { error: docError } = await supabase
            .from('verification_documents')
            .insert(verificationData);

        if (docError) throw docError;

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ verification_status: 'pending', verified: false })
            .eq('id', userId);

        if (profileError) throw profileError;
        */

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get verification documents for a profile
 * TODO: Replace with actual Supabase query when ready
 */
export async function getVerificationDocuments(profileId: string): Promise<VerificationDocument[]> {
    try {
        // Simulated - replace with actual database call
        const stored = localStorage.getItem(`verification_${profileId}`);
        if (stored) {
            return JSON.parse(stored);
        }

        // TODO: Uncomment when ready to integrate with database
        /*
        const { data, error } = await supabase
            .from('verification_documents')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
        */

        return [];
    } catch (error: any) {
        console.error('Error fetching verification documents:', error);
        return [];
    }
}

/**
 * Get verification status for current user
 */
export async function getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
    try {
        // Simulated - replace with actual database call
        const profileData = JSON.parse(localStorage.getItem(`profile_${userId}`) || '{}');
        
        return {
            verified: profileData.verified || false,
            verification_status: profileData.verification_status || null,
            verification_rejected_reason: profileData.verification_rejected_reason || null,
        };

        // TODO: Uncomment when ready to integrate with database
        /*
        const { data, error } = await supabase
            .from('profiles')
            .select('verified, verification_status, verification_rejected_reason')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
        */
    } catch (error: any) {
        console.error('Error fetching verification status:', error);
        return null;
    }
}

/**
 * Approve verification (Admin only)
 * TODO: Replace with actual Supabase update when ready
 */
export async function approveVerification(
    profileId: string,
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Simulated - replace with actual database call
        const profileData = JSON.parse(localStorage.getItem(`profile_${profileId}`) || '{}');
        profileData.verified = true;
        profileData.verification_status = 'approved';
        profileData.verification_rejected_reason = null;
        localStorage.setItem(`profile_${profileId}`, JSON.stringify(profileData));

        // Update verification document status
        const verifications = JSON.parse(localStorage.getItem(`verification_${profileId}`) || '[]');
        if (verifications.length > 0) {
            const latest = verifications[verifications.length - 1];
            latest.status = 'approved';
            latest.reviewed_by = adminId;
            latest.reviewed_at = new Date().toISOString();
            latest.updated_at = new Date().toISOString();
            verifications[verifications.length - 1] = latest;
            localStorage.setItem(`verification_${profileId}`, JSON.stringify(verifications));
        }

        // TODO: Uncomment when ready to integrate with database
        /*
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                verified: true,
                verification_status: 'approved',
                verification_rejected_reason: null
            })
            .eq('id', profileId);

        if (profileError) throw profileError;

        const { error: docError } = await supabase
            .from('verification_documents')
            .update({
                status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('profile_id', profileId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

        if (docError) throw docError;
        */

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Reject verification (Admin only)
 * TODO: Replace with actual Supabase update when ready
 */
export async function rejectVerification(
    profileId: string,
    reason: string,
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Simulated - replace with actual database call
        const profileData = JSON.parse(localStorage.getItem(`profile_${profileId}`) || '{}');
        profileData.verified = false;
        profileData.verification_status = 'rejected';
        profileData.verification_rejected_reason = reason;
        localStorage.setItem(`profile_${profileId}`, JSON.stringify(profileData));

        // Update verification document status
        const verifications = JSON.parse(localStorage.getItem(`verification_${profileId}`) || '[]');
        if (verifications.length > 0) {
            const latest = verifications[verifications.length - 1];
            latest.status = 'rejected';
            latest.rejected_reason = reason;
            latest.reviewed_by = adminId;
            latest.reviewed_at = new Date().toISOString();
            latest.updated_at = new Date().toISOString();
            verifications[verifications.length - 1] = latest;
            localStorage.setItem(`verification_${profileId}`, JSON.stringify(verifications));
        }

        // TODO: Uncomment when ready to integrate with database
        /*
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                verified: false,
                verification_status: 'rejected',
                verification_rejected_reason: reason
            })
            .eq('id', profileId);

        if (profileError) throw profileError;

        const { error: docError } = await supabase
            .from('verification_documents')
            .update({
                status: 'rejected',
                rejected_reason: reason,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('profile_id', profileId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

        if (docError) throw docError;
        */

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all pending verification requests (Admin only)
 * TODO: Replace with actual Supabase query when ready
 */
export async function getPendingVerifications(): Promise<VerificationDocument[]> {
    try {
        // Simulated - replace with actual database call
        // In a real implementation, this would fetch from the database
        // For now, we'll check localStorage for any verification requests
        const pending: VerificationDocument[] = [];
        
        // Check all localStorage keys that start with 'verification_'
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('verification_') && key !== 'verification_' + key.split('_')[1]) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '[]');
                    if (Array.isArray(data)) {
                        const filtered = data.filter((doc: VerificationDocument) => 
                            doc.status === 'pending' || doc.status === 'under_review'
                        );
                        pending.push(...filtered);
                    }
                } catch (e) {
                    // Skip invalid entries
                }
            }
        }
        
        // TODO: Uncomment when ready to integrate with database
        /*
        const { data, error } = await supabase
            .from('verification_documents')
            .select('*, profiles(display_name, ad_id)')
            .in('status', ['pending', 'under_review'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
        */

        return pending.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    } catch (error: any) {
        console.error('Error fetching pending verifications:', error);
        return [];
    }
}

