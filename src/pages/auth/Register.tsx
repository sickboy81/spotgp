import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { directus } from '@/lib/directus';
import { registerUser, createItem, readMe } from '@directus/sdk';
import { cn, generateUniqueAdId } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    shouldUseMockAuth,
    createMockUser,
    createMockSession,
    setMockSession
} from '@/lib/mock-auth';
import { isValidEmail, isStrongPassword, isValidPhone } from '@/lib/utils/validation';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const useMock = shouldUseMockAuth();

    // Cadastro é apenas para anunciantes
    const role: 'advertiser' = 'advertiser';

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Security: Validate email format
        if (!isValidEmail(email)) {
            setError('Por favor, insira um email válido');
            setLoading(false);
            return;
        }

        // Security: Validate password strength
        const passwordValidation = isStrongPassword(password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.errors.join('. '));
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setLoading(false);
            return;
        }

        // Security: Validate phone if provided
        if (phone && !isValidPhone(phone)) {
            setError('Por favor, insira um telefone válido');
            setLoading(false);
            return;
        }

        try {
            if (useMock) {
                // Use mock registration
                const mockUser = createMockUser(email, password, displayName, phone);
                const mockSession = createMockSession(mockUser);
                setMockSession(mockSession);

                // Also create profile in localStorage for consistency
                const profileKey = `mock_profile_${mockUser.id} `;
                const adId = generateUniqueAdId();
                localStorage.setItem(profileKey, JSON.stringify({
                    id: mockUser.id,
                    ad_id: adId,
                    display_name: displayName,
                    role: role,
                    phone: phone || null,
                }));

                // Trigger storage event to update AuthContext
                window.dispatchEvent(new StorageEvent('storage', { key: 'mock_session' }));

                // Reload page to update auth state
                window.location.href = '/';
            } else {
                // Use real Directus registration
                // 1. Register User
                // Note: Role assignment depends on Directus Project Settings for Public Registration
                await directus.request(registerUser(email, password, {
                    first_name: displayName,
                }));

                // 2. Authenticate to establish session
                await directus.login({ email, password });

                // 3. Create Profile
                const adId = generateUniqueAdId();
                try {
                    // Get current user ID to link profile
                    const user = await directus.request(readMe());

                    await directus.request(createItem('profiles', {
                        id: user.id, // Try to match ID if possible, or let it generate
                        user: user.id,
                        ad_id: adId,
                        display_name: displayName,
                        role: role,
                        phone: phone || null,
                        email: email,
                    }));
                } catch (profileErr) {
                    console.error("Profile creation failed", profileErr);
                    // Allow continuing as login succeeded
                }

                navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
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
                    Junte-se ao acompanhantesAGORA
                </h2>

                {useMock && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs p-3 rounded-md mb-4">
                        <strong>Modo Desenvolvimento:</strong> Usando autenticação mock. Os dados serão salvos localmente no navegador.
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome de Exibição</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Seu Nome"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            maxLength={255}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input
                            type="tel"
                            required
                            maxLength={20}
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={phone}
                            onChange={(e) => {
                                // Permite apenas números, espaços, parênteses, hífens e +
                                const value = e.target.value.replace(/[^\d\s()+-]/g, '');
                                setPhone(value);
                            }}
                            placeholder="(11) 98765-4321"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Digite seu número de telefone ou WhatsApp</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                maxLength={128}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                maxLength={128}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="********"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full bg-primary text-primary-foreground py-2 rounded-md font-medium transition-opacity",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Criando Conta...' : 'Criar Conta'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                        Entrar
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
