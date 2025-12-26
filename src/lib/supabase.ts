import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to determine if the URL is valid (basic check)
const isValidUrl = (url: string | undefined): boolean => {
    try {
        if (!url || url.includes('YOUR_SUPABASE')) return false;
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : 'https://placeholder.supabase.co';
const finalKey = (supabaseAnonKey && !supabaseAnonKey.includes('YOUR_SUPABASE')) ? supabaseAnonKey : 'placeholder-key';

if (finalUrl === 'https://placeholder.supabase.co' && import.meta.env.DEV) {
    // Only show info in development mode
    console.info('ℹ️ Using placeholder Supabase URL. Mock data will be used.');
}

export const supabase = createClient<Database>(finalUrl, finalKey);
