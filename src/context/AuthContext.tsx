import React, { createContext, useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readMe } from '@directus/sdk';
import { logger } from '@/lib/utils/logger';

// Adapted User Model for Directus
export type User = {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    role?: string;
    // Add other fields as needed
    [key: string]: any;
};

export interface AuthContextType {
    user: User | null;
    token: string | null; // Directus handles this internally with cookies
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            // Fetch user AND role name
            const userData = await directus.request(readMe({
                fields: ['*', 'role.name']
            }));

            setUser(userData as User);

            // Normalize Role Name
            const roleName = userData.role?.name || '';
            let appRole = 'visitor';

            if (roleName === 'Administrator' || roleName === 'Admin') {
                appRole = 'super_admin';
            } else if (roleName === 'App User' || roleName === 'Advertiser') {
                appRole = 'advertiser';
            }

            setRole(appRole);
        } catch (error: any) {
            const isAuthError = error?.response?.status === 401 ||
                error?.response?.status === 403 ||
                error?.errors?.[0]?.extensions?.code === 'TOKEN_EXPIRED' ||
                error?.message === 'Invalid user credentials.';

            if (isAuthError) {
                // Expected behavior for unauthenticated users, clear state without error log
                setUser(null);
                setRole(null);
            } else {
                logger.error('Auth refresh error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const signOut = async () => {
        try {
            await directus.logout();
            setUser(null);
            setRole(null);
        } catch (error) {
            logger.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token: null, role, loading, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
