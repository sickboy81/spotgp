// API functions for profile management
// Prepared for database integration - currently using localStorage simulation

import { supabase } from '../supabase';
import { generateUniqueAdId } from '../utils';

export interface ProfileData {
    ad_id?: string; // Unique advertisement ID
    category?: string; // Acompanhante, Massagista, Atendimento Online
    display_name?: string;
    title?: string; // Título do anúncio (mínimo 40 caracteres)
    bio?: string; // Texto descritivo (mínimo 70 caracteres)
    username?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    street_address?: string; // Rua e número (ex: "Rua das Flores, 123")
    address_reference?: string; // Ponto de referência (ex: "Próximo ao shopping")
    latitude?: number; // Latitude geocodificada
    longitude?: number; // Longitude geocodificada
    phone?: string;
    telegram?: string;
    instagram?: string;
    twitter?: string;
    price?: number; // Preço padrão (mantido para compatibilidade)
    prices?: Array<{ description: string; price: number }>; // Tabela de cachês/preços
    age?: number;
    gender?: string;
    height?: string;
    weight?: string;
    hairColor?: string[];
    bodyType?: string[];
    ethnicity?: string[];
    services?: string[];
    paymentMethods?: string[];
    hasPlace?: boolean;
    videoCall?: boolean;
    chat_enabled?: boolean; // Habilitar/desabilitar chat interno
    // Horário de atendimento
    schedule_24h?: boolean; // Atende 24 horas
    schedule_from?: string; // Horário inicial (ex: "09:00")
    schedule_to?: string; // Horário final (ex: "18:00")
    schedule_same_everyday?: boolean; // Mesmo horário todos os dias
    // Áudio de apresentação
    audio_url?: string; // URL do áudio de apresentação
    // Campos específicos para massagistas
    massageTypes?: string[]; // Tipos de massagens
    otherServices?: string[]; // Outros serviços
    happyEnding?: string[]; // Final feliz
    facilities?: string[]; // Instalações
    serviceTo?: string[]; // Atendimento a
    serviceLocations?: string[]; // Locais de atendimento
    is_online?: boolean; // Status "Disponível agora"
    online_until?: string | null; // Timestamp até quando estará online (null = manual)
}

/**
 * Load user profile data
 * TODO: Replace with actual Supabase query when ready
 */
export async function loadProfile(userId: string): Promise<ProfileData | null> {
    // Simulated - replace with actual database call
    const saved = localStorage.getItem(`profile_${userId}`);
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Return mock data for demonstration
    return {
        category: '',
        display_name: '',
        bio: '',
        username: '',
        city: '',
        state: '',
        neighborhood: '',
        street_address: '',
        address_reference: '',
        latitude: undefined,
        longitude: undefined,
        phone: '',
        telegram: '',
        instagram: '',
        twitter: '',
        price: 0,
        age: 0,
        gender: '',
        height: '',
        weight: '',
        hairColor: [],
        bodyType: [],
        ethnicity: [],
        services: [],
        paymentMethods: [],
        hasPlace: null,
        videoCall: false,
        chat_enabled: true, // Padrão: habilitado
        massageTypes: [],
        otherServices: [],
        happyEnding: [],
        facilities: [],
        serviceTo: [],
        serviceLocations: [],
    };
}

/**
 * Save user profile data
 * TODO: Replace with actual Supabase update when ready
 */
export async function saveProfile(userId: string, data: ProfileData): Promise<{ success: boolean; error?: string }> {
    try {
        // Generate unique ad_id if it doesn't exist
        if (!data.ad_id) {
            data.ad_id = generateUniqueAdId();
        }
        
        // Simulated save - replace with actual database call
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        
        // TODO: Uncomment when ready to integrate with database
        /*
        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', userId);
        
        if (error) throw error;
        */
        
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update online status
 */
export async function updateOnlineStatus(
    userId: string, 
    isOnline: boolean, 
    durationMinutes?: number | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const onlineUntil = durationMinutes 
            ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
            : null;
        
        // Load current profile
        const currentProfile = await loadProfile(userId) || {};
        
        // Update online status
        const updatedProfile = {
            ...currentProfile,
            is_online: isOnline,
            online_until: onlineUntil,
        };
        
        // Save updated profile
        return await saveProfile(userId, updatedProfile);
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get current online status (considering scheduled end time)
 */
export function getCurrentOnlineStatus(profile: ProfileData | null): boolean {
    if (!profile || !profile.is_online) return false;
    
    // If there's a scheduled end time, check if it hasn't passed
    if (profile.online_until) {
        const now = new Date();
        const until = new Date(profile.online_until);
        return until > now;
    }
    
    // Manual mode - return the is_online value
    return profile.is_online;
}

