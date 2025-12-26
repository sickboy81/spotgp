/**
 * Mock authentication system for development
 * This file provides mock authentication when Supabase is not configured
 */

import { User, Session } from '@supabase/supabase-js';

const MOCK_USERS_KEY = 'mock_users';
const MOCK_SESSION_KEY = 'mock_session';

export interface MockUser {
    id: string;
    email: string;
    display_name: string;
    role: 'advertiser' | 'super_admin';
    phone?: string;
    created_at: string;
}

export interface MockSession {
    user: User;
    session: Session | null;
}

/**
 * Get mock users from localStorage
 */
export function getMockUsers(): MockUser[] {
    try {
        const stored = localStorage.getItem(MOCK_USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save mock users to localStorage
 */
function saveMockUsers(users: MockUser[]): void {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

/**
 * Get current mock session
 */
export function getMockSession(): MockSession | null {
    try {
        const stored = localStorage.getItem(MOCK_SESSION_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Set mock session
 */
export function setMockSession(session: MockSession | null): void {
    if (session) {
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(MOCK_SESSION_KEY);
    }
}

/**
 * Create a mock user
 */
export function createMockUser(email: string, password: string, displayName: string, phone?: string): MockUser {
    const users = getMockUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        throw new Error('Usuário já existe com este email');
    }

    const newUser: MockUser = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        display_name: displayName,
        role: 'advertiser', // Default role
        phone: phone || undefined,
        created_at: new Date().toISOString(),
    };

    // Store password separately (in a real app, this would be hashed)
    const passwordKey = `mock_password_${newUser.id}`;
    localStorage.setItem(passwordKey, password); // In production, never store passwords in plain text!

    users.push(newUser);
    saveMockUsers(users);

    return newUser;
}

/**
 * Authenticate mock user
 */
export function authenticateMockUser(email: string, password: string): MockUser | null {
    // Ensure admin exists before authenticating
    if (email === 'admin@test.com') {
        initDefaultAdmin();
    }

    const users = getMockUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.warn('User not found:', email);
        console.log('Available users:', users.map(u => u.email));
        return null;
    }

    // Check password
    const passwordKey = `mock_password_${user.id}`;
    const storedPassword = localStorage.getItem(passwordKey);

    if (storedPassword !== password) {
        console.warn('Password mismatch for user:', email);
        return null;
    }

    return user;
}

/**
 * Convert mock user to Supabase User format
 */
export function mockUserToSupabaseUser(mockUser: MockUser): User {
    return {
        id: mockUser.id,
        email: mockUser.email,
        created_at: mockUser.created_at,
        app_metadata: {},
        user_metadata: {
            display_name: mockUser.display_name,
        },
        aud: 'authenticated',
        confirmation_sent_at: null,
        recovery_sent_at: null,
        email_confirmed_at: mockUser.created_at,
        invited_at: null,
        action_link: null,
        last_sign_in_at: new Date().toISOString(),
        phone: mockUser.phone || null,
        confirmed_at: mockUser.created_at,
        email_change_sent_at: null,
        new_email: null,
        phone_confirmed_at: null,
        phone_change: null,
        phone_change_token: null,
        phone_change_sent_at: null,
        updated_at: new Date().toISOString(),
        is_anonymous: false,
    } as User;
}

/**
 * Create mock session from mock user
 */
export function createMockSession(mockUser: MockUser): MockSession {
    const user = mockUserToSupabaseUser(mockUser);
    
    const session: Session = {
        access_token: `mock_token_${mockUser.id}_${Date.now()}`,
        refresh_token: `mock_refresh_${mockUser.id}_${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user,
    };

    return { user, session };
}

/**
 * Check if we should use mock auth (when Supabase URL is placeholder)
 */
export function shouldUseMockAuth(): boolean {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('YOUR_SUPABASE');
}

/**
 * Initialize default admin user for testing
 */
export function initDefaultAdmin(): void {
    const users = getMockUsers();
    
    // Check if admin already exists
    const existingAdmin = users.find(u => u.email === 'admin@test.com');
    if (existingAdmin) {
        // Ensure password is set (in case it was cleared)
        const passwordKey = `mock_password_${existingAdmin.id}`;
        if (!localStorage.getItem(passwordKey)) {
            localStorage.setItem(passwordKey, 'admin123');
        }
        return;
    }

    const admin: MockUser = {
        id: 'mock_admin_001',
        email: 'admin@test.com',
        display_name: 'Admin Teste',
        role: 'super_admin',
        created_at: new Date().toISOString(),
    };

    const passwordKey = `mock_password_${admin.id}`;
    localStorage.setItem(passwordKey, 'admin123');

    users.push(admin);
    saveMockUsers(users);
    
    console.log('✅ Admin mock user created:', admin.email);
}

