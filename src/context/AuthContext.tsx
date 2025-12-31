import React, { createContext, useEffect, useState } from 'react';
import { AuthModel } from 'pocketbase'; // We'll infer or import this
import { pb } from '@/lib/pocketbase';

// PocketBase User Model (approximate, based on Supabase profiles)
export type User = AuthModel & {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role?: 'visitor' | 'advertiser' | 'super_admin';
    // Add other fields from profiles table
};

export interface AuthContextType {
    user: User | null;
    token: string | null;
    role: string | null; // extracted from user
    loading: boolean;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(pb.authStore.model as User | null);
    const [token, setToken] = useState<string | null>(pb.authStore.token);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // PB is sync, but we might want to fetch extra profile data

    useEffect(() => {
        // Initial state
        const model = pb.authStore.model as User | null;
        if (model) {
            setUser(model);
            setRole(model.role || 'visitor'); // Assuming role is on the user record
        }
        setToken(pb.authStore.token);
        setLoading(false);

        // Listen for changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setToken(token);
            setUser(model as User | null);
            setRole((model as User | null)?.role || null);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const signOut = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ user, token, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
