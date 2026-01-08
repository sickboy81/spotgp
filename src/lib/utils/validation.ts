/**
 * Validation utilities for security
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
        errors.push('Senha deve ter no mínimo 8 caracteres');
    }

    if (password === password.toLowerCase()) {
        errors.push('Senha deve conter pelo menos 1 letra maiúscula');
    }

    if (password === password.toUpperCase()) {
        errors.push('Senha deve conter pelo menos 1 letra minúscula');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos 1 número');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

import DOMPurify from 'dompurify';

/**
 * Sanitize string input (XSS protection via DOMPurify)
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input.trim());
}

/**
 * Validate phone number (Brazilian format)
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\D/g, '');
    // Brazilian phone: 10 or 11 digits (with or without area code)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Rate limiting helper (client-side, basic)
 */
export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const storageKey = `rate_limit_${key}`;
    const now = Date.now();

    try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
            localStorage.setItem(storageKey, JSON.stringify({ attempts: 1, resetAt: now + windowMs }));
            return true;
        }

        const data = JSON.parse(stored);

        if (now > data.resetAt) {
            // Reset window
            localStorage.setItem(storageKey, JSON.stringify({ attempts: 1, resetAt: now + windowMs }));
            return true;
        }

        if (data.attempts >= maxAttempts) {
            return false; // Rate limit exceeded
        }

        data.attempts++;
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch {
        return true; // On error, allow (fail open)
    }
}






