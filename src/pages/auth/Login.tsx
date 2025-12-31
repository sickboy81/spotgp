import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { shouldUseMockAuth, authenticateMockUser, createMockSession, setMockSession, initDefaultAdmin } from '@/lib/mock-auth';
import { isValidEmail, checkRateLimit } from '@/lib/utils/validation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const useMock = shouldUseMockAuth();

    // Initialize default admin when component mounts (if using mock)
    useEffect(() => {
        if (useMock) {
            initDefaultAdmin();
        }
    }, [useMock]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Security: Validate email format
        if (!isValidEmail(email)) {
            setError('Por favor, insira um email válido');
            setLoading(false);
            return;
        }

        // Security: Rate limiting (max 5 attempts per 15 minutes)
        if (!checkRateLimit(`login_${email}`, 5, 15 * 60 * 1000)) {
            setError('Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');
            setLoading(false);
            return;
        }

        try {
            if (useMock) {
                // Ensure admin is initialized
                initDefaultAdmin();

                // Use mock authentication
                const mockUser = authenticateMockUser(email, password);
                if (!mockUser) {
                    throw new Error('Email ou senha incorretos. Use: admin@test.com / admin123');
                }

                const mockSession = createMockSession(mockUser);
                setMockSession(mockSession);

                console.log('✅ Login successful:', {
                    email: mockUser.email,
                    role: mockUser.role,
                    userId: mockUser.id
                });

                // Small delay to ensure localStorage is updated
                await new Promise(resolve => setTimeout(resolve, 100));

                // Navigate based on role
                if (mockUser.role === 'super_admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                // Use real PocketBase auth
                await pb.collection('users').authWithPassword(email, password);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8"
            >
                <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Bem-vindo de Volta
                </h2>

                {useMock && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs p-3 rounded-md mb-4">
                        <strong>Modo Desenvolvimento:</strong> Usando autenticação mock. Para testar, use:
                        <br />• Email: <code className="bg-blue-500/20 px-1 rounded">admin@test.com</code>
                        <br />• Senha: <code className="bg-blue-500/20 px-1 rounded">admin123</code>
                        <br />Ou crie uma nova conta no cadastro.
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full bg-primary text-primary-foreground py-2 rounded-md font-medium transition-opacity",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-primary hover:underline">
                        Cadastre-se
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
