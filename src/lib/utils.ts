import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID for advertisements/profiles
 * Format: 5 alphanumeric characters (letters and numbers)
 * Example: a3k9m, x7b2n, k9p4q
 */
export function generateUniqueAdId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a unique ID using crypto.randomUUID if available, fallback to custom method
 */
export function generateUniqueId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
}

/**
 * Remove acentos e caracteres especiais de uma string para comparação
 * Exemplo: "São Paulo" -> "sao paulo"
 */
export function normalizeString(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .toLowerCase()
        .trim();
}