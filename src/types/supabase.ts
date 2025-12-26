export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    ad_id?: string | null
                    category?: string | null
                    role: 'visitor' | 'advertiser' | 'super_admin'
                    is_banned: boolean
                    display_name: string | null
                    verified?: boolean | null
                    verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | null
                    verification_rejected_reason?: string | null
                    street_address?: string | null
                    address_reference?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    chat_enabled?: boolean | null
                    created_at: string
                }
                Insert: {
                    id: string
                    ad_id?: string | null
                    category?: string | null
                    role?: 'visitor' | 'advertiser' | 'super_admin'
                    is_banned?: boolean
                    display_name?: string | null
                    verified?: boolean | null
                    verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | null
                    verification_rejected_reason?: string | null
                    street_address?: string | null
                    address_reference?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    chat_enabled?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    ad_id?: string | null
                    category?: string | null
                    role?: 'visitor' | 'advertiser' | 'super_admin'
                    is_banned?: boolean
                    display_name?: string | null
                    verified?: boolean | null
                    verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | null
                    verification_rejected_reason?: string | null
                    street_address?: string | null
                    address_reference?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    chat_enabled?: boolean | null
                    created_at?: string
                }
            }
            verification_documents: {
                Row: {
                    id: string
                    profile_id: string
                    document_front_url: string
                    document_back_url?: string | null
                    selfie_url?: string | null
                    status: 'pending' | 'under_review' | 'approved' | 'rejected'
                    rejected_reason?: string | null
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    document_front_url: string
                    document_back_url?: string | null
                    selfie_url?: string | null
                    status?: 'pending' | 'under_review' | 'approved' | 'rejected'
                    rejected_reason?: string | null
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    document_front_url?: string
                    document_back_url?: string | null
                    selfie_url?: string | null
                    status?: 'pending' | 'under_review' | 'approved' | 'rejected'
                    rejected_reason?: string | null
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            media: {
                Row: {
                    id: string
                    profile_id: string
                    url: string
                    type: 'image' | 'video'
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    url: string
                    type: 'image' | 'video'
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    url?: string
                    type?: 'image' | 'video'
                    created_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    profile_id: string
                    reported_by: string | null
                    type: 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other'
                    description: string
                    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    reviewed_by: string | null
                    reviewed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    reported_by?: string | null
                    type: 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other'
                    description: string
                    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    reported_by?: string | null
                    type?: 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other'
                    description?: string
                    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            profile_views: {
                Row: {
                    id: string
                    profile_id: string
                    viewer_id: string | null
                    viewer_session: string | null
                    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
                    city: string | null
                    country: string | null
                    is_unique: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    viewer_id?: string | null
                    viewer_session?: string | null
                    device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown'
                    city?: string | null
                    country?: string | null
                    is_unique?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    viewer_id?: string | null
                    viewer_session?: string | null
                    device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown'
                    city?: string | null
                    country?: string | null
                    is_unique?: boolean
                    created_at?: string
                }
            }
            profile_clicks: {
                Row: {
                    id: string
                    profile_id: string
                    click_type: 'whatsapp' | 'telegram' | 'instagram' | 'twitter' | 'phone' | 'message'
                    viewer_id: string | null
                    viewer_session: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    click_type: 'whatsapp' | 'telegram' | 'instagram' | 'twitter' | 'phone' | 'message'
                    viewer_id?: string | null
                    viewer_session?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    click_type?: 'whatsapp' | 'telegram' | 'instagram' | 'twitter' | 'phone' | 'message'
                    viewer_id?: string | null
                    viewer_session?: string | null
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    participant1_id: string
                    participant2_id: string
                    last_message_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    participant1_id: string
                    participant2_id: string
                    last_message_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    participant1_id?: string
                    participant2_id?: string
                    last_message_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'new_message' | 'new_view' | 'new_favorite' | 'verification_approved' | 'verification_rejected' | 'profile_featured'
                    title: string
                    message: string
                    link?: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'new_message' | 'new_view' | 'new_favorite' | 'verification_approved' | 'verification_rejected' | 'profile_featured'
                    title: string
                    message: string
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'new_message' | 'new_view' | 'new_favorite' | 'verification_approved' | 'verification_rejected' | 'profile_featured'
                    title?: string
                    message?: string
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
        }
    }
}
