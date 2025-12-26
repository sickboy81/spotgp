import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { 
    shouldUseMockAuth, 
    getMockSession, 
    setMockSession,
    getMockUsers,
    initDefaultAdmin
} from '@/lib/mock-auth';

type UserRole = Database['public']['Tables']['profiles']['Row']['role'];

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: UserRole | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const useMock = shouldUseMockAuth();

    useEffect(() => {
        if (useMock) {
            // Initialize default admin user for testing
            initDefaultAdmin();
            
            let lastUserId: string | null = null;
            let hasLoggedInitialLoad = false;
            
            // Function to load mock session
            const loadMockSession = (silent = false) => {
                const mockSession = getMockSession();
                if (mockSession) {
                    const currentUserId = mockSession.user.id;
                    
                    // Only update state if user changed
                    if (currentUserId !== lastUserId) {
                        setSession(mockSession.session);
                        setUser(mockSession.user);
                        
                        // Get role from mock users
                        const users = getMockUsers();
                        const mockUser = users.find((u: { id: string; role: UserRole }) => u.id === currentUserId);
                        if (mockUser) {
                            setRole(mockUser.role);
                            // Only log on initial load or when user changes
                            if (!silent && (!hasLoggedInitialLoad || currentUserId !== lastUserId)) {
                                console.log('🔐 Mock session loaded:', {
                                    email: mockUser.email,
                                    role: mockUser.role,
                                    userId: mockUser.id
                                });
                                hasLoggedInitialLoad = true;
                            }
                        } else {
                            if (!silent) {
                                console.warn('⚠️ Mock user not found for session user:', currentUserId);
                                console.log('Available users:', users.map((u: { id: string; email: string; role: UserRole }) => ({ id: u.id, email: u.email, role: u.role })));
                            }
                        }
                        lastUserId = currentUserId;
                    }
                } else {
                    if (lastUserId !== null) {
                        setSession(null);
                        setUser(null);
                        setRole(null);
                        lastUserId = null;
                    }
                }
                setLoading(false);
            };

            // Initial load
            loadMockSession(false);

            // Listen for storage changes (to sync across tabs and after login)
            const handleStorageChange = () => {
                loadMockSession(false);
            };
            
            // Check for changes periodically (for same-tab updates) - less frequently
            const interval = setInterval(() => {
                const currentMockSession = getMockSession();
                const currentUserId = currentMockSession?.user.id || null;
                if (currentUserId !== lastUserId || (!lastUserId && currentMockSession)) {
                    loadMockSession(true); // Silent check
                }
            }, 2000); // Increased from 500ms to 2000ms

            window.addEventListener('storage', handleStorageChange);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                clearInterval(interval);
            };
        } else {
            // Use real Supabase auth
            // Get initial session
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchUserRole(session.user.id);
                } else {
                    setLoading(false);
                }
            }).catch((err) => {
                console.error('Session check failed:', err);
                setLoading(false);
            });

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchUserRole(session.user.id);
                } else {
                    setRole(null);
                    setLoading(false);
                }
            });

            return () => subscription.unsubscribe();
        }
    }, [useMock]);

    async function fetchUserRole(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
            } else if (data) {
                // Force cast for now as data shape is correct
                const profile = data as { role: UserRole };
                setRole(profile.role);
            }
        } catch (err) {
            console.error('Unexpected error fetching role:', err);
        } finally {
            setLoading(false);
        }
    }

    const signOut = async () => {
        if (useMock) {
            setMockSession(null);
            setRole(null);
            setUser(null);
            setSession(null);
        } else {
            await supabase.auth.signOut();
            setRole(null);
            setUser(null);
            setSession(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
