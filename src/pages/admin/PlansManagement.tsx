import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, DollarSign, Loader2, Search, Gift, User, TrendingUp, Play, Star, Sparkles, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getPricingConfig, savePricingConfig, resetPricingConfig, type BoostPlan as PricingBoostPlan, type ExtraFeature, type PricingConfig } from '@/lib/utils/pricing-config';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
    created_at: string;
    // Campos opcionais para planos de visibilidade
    type?: 'subscription' | 'visibility'; // Tipo do plano
    boostsPerDay?: number; // Para planos de visibilidade
    pricePerDay?: number; // Para planos de visibilidade
    recommended?: boolean; // Para planos de visibilidade
}

interface UserPlan {
    user_id: string;
    user_name?: string;
    plan_id: string;
    plan_name?: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_trial: boolean;
    payment_status: 'paid' | 'pending' | 'expired' | 'cancelled';
}

export default function PlansManagement() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'plans' | 'users'>('plans');
    
    // Pricing config state
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(getPricingConfig());
    const [pricingSaved, setPricingSaved] = useState(false);
    const [editingPricingPlan, setEditingPricingPlan] = useState<string | null>(null);
    const [editingFeature, setEditingFeature] = useState<string | null>(null);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [searchUserPlans, setSearchUserPlans] = useState('');
    const [filterUserPlans, setFilterUserPlans] = useState<'all' | 'active' | 'expired' | 'trial'>('all');
    const [assignForm, setAssignForm] = useState({
        userId: '',
        planId: '',
        isTrial: false,
    });
    const [users, setUsers] = useState<Array<{ id: string; display_name: string; email?: string }>>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [planForm, setPlanForm] = useState({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        features: [''],
        is_active: true,
    });

    // Functions must be defined before useEffect
    const loadPlans = async () => {
        try {
            // TODO: Load from database
            const mockPlans: Plan[] = [
                {
                    id: 'plan_1',
                    name: 'Básico',
                    description: 'Plano básico para iniciantes',
                    price: 49.90,
                    duration_days: 30,
                    features: ['1 anúncio', 'Até 5 fotos', 'Suporte básico'],
                    is_active: true,
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'plan_2',
                    name: 'Premium',
                    description: 'Plano premium com recursos avançados',
                    price: 99.90,
                    duration_days: 30,
                    features: ['Anúncios ilimitados', 'Até 20 fotos', 'Destaque na busca', 'Suporte prioritário'],
                    is_active: true,
                    created_at: new Date().toISOString(),
                },
            ];
            setPlans(mockPlans);
        } catch (err) {
            console.error('Error loading plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserPlans = async () => {
        try {
            // TODO: Load from database with user info
            // For now, try to get from Supabase if table exists
            try {
                const { data: userPlansData, error } = await supabase
                    .from('user_plans')
                    .select(`
                        *,
                        profile:profiles!user_plans_user_id_fkey(display_name)
                    `)
                    .order('created_at', { ascending: false });

                if (!error && userPlansData) {
                    const plansWithNames: UserPlan[] = userPlansData.map((up: any) => ({
                        user_id: up.user_id,
                        user_name: up.profile?.display_name || undefined,
                        plan_id: up.plan_id,
                        plan_name: plans.find(p => p.id === up.plan_id)?.name,
                        start_date: up.start_date,
                        end_date: up.end_date,
                        is_active: up.is_active,
                        is_trial: up.is_trial,
                        payment_status: up.payment_status,
                    }));
                    setUserPlans(plansWithNames);
                    return;
                }
            } catch (err) {
                console.warn('user_plans table not found, using mock data');
            }

            // Fallback to mock data
            const mockUserPlans: UserPlan[] = [];
            setUserPlans(mockUserPlans);
        } catch (err) {
            console.error('Error loading user plans:', err);
        }
    };

    useEffect(() => {
        loadPlans();
        loadUserPlans();
        setPricingConfig(getPricingConfig());
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, email')
                .order('display_name', { ascending: true })
                .limit(1000);

            if (!error && data) {
                setUsers(data.map(u => ({
                    id: u.id,
                    display_name: u.display_name || 'Sem nome',
                    email: u.email || undefined
                })));
            }
        } catch (err) {
            console.warn('Could not load users:', err);
        }
    };
    
    // Pricing handlers
    const handlePricingSave = () => {
        savePricingConfig(pricingConfig);
        setPricingSaved(true);
        setTimeout(() => setPricingSaved(false), 3000);
    };

    const handlePricingReset = () => {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            resetPricingConfig();
            setPricingConfig(getPricingConfig());
        }
    };

    const handleAddPricingPlan = () => {
        const newPlan: PricingBoostPlan = {
            id: `plan_${Date.now()}`,
            boostsPerDay: 6,
            duration: 7,
            totalPrice: 55,
            pricePerDay: 7.86,
            recommended: false,
            active: true,
        };
        setPricingConfig({
            ...pricingConfig,
            plans: [...pricingConfig.plans, newPlan],
        });
        setEditingPricingPlan(newPlan.id);
    };

    const handleUpdatePricingPlan = (planId: string, updates: Partial<PricingBoostPlan>) => {
        setPricingConfig({
            ...pricingConfig,
            plans: pricingConfig.plans.map(p => p.id === planId ? { ...p, ...updates } : p),
        });
    };

    const handleDeletePricingPlan = (planId: string) => {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            setPricingConfig({
                ...pricingConfig,
                plans: pricingConfig.plans.filter(p => p.id !== planId),
            });
        }
    };

    const handleAddFeature = () => {
        const newFeature: ExtraFeature = {
            id: `feature_${Date.now()}`,
            title: 'Nova Feature',
            description: 'Descrição da feature',
            price: 'R$ 0',
            bullets: ['Item 1'],
            active: true,
            icon: 'multimedia',
        };
        setPricingConfig({
            ...pricingConfig,
            extraFeatures: [...pricingConfig.extraFeatures, newFeature],
        });
        setEditingFeature(newFeature.id);
    };

    const handleUpdateFeature = (featureId: string, updates: Partial<ExtraFeature>) => {
        setPricingConfig({
            ...pricingConfig,
            extraFeatures: pricingConfig.extraFeatures.map(f => f.id === featureId ? { ...f, ...updates } : f),
        });
    };

    const handleDeleteFeature = (featureId: string) => {
        if (confirm('Tem certeza que deseja excluir esta feature?')) {
            setPricingConfig({
                ...pricingConfig,
                extraFeatures: pricingConfig.extraFeatures.filter(f => f.id !== featureId),
            });
        }
    };

    const handleAddCategory = (category: string) => {
        if (category.trim() && !pricingConfig.categories.includes(category.trim())) {
            setPricingConfig({
                ...pricingConfig,
                categories: [...pricingConfig.categories, category.trim()],
            });
        }
    };

    const handleRemoveCategory = (category: string) => {
        setPricingConfig({
            ...pricingConfig,
            categories: pricingConfig.categories.filter(c => c !== category),
        });
    };

    const updateBullet = (featureId: string, index: number, value: string) => {
        const feature = pricingConfig.extraFeatures.find(f => f.id === featureId);
        if (feature) {
            const newBullets = [...feature.bullets];
            newBullets[index] = value;
            handleUpdateFeature(featureId, { bullets: newBullets });
        }
    };

    const addBullet = (featureId: string) => {
        const feature = pricingConfig.extraFeatures.find(f => f.id === featureId);
        if (feature) {
            handleUpdateFeature(featureId, { bullets: [...feature.bullets, ''] });
        }
    };

    const removeBullet = (featureId: string, index: number) => {
        const feature = pricingConfig.extraFeatures.find(f => f.id === featureId);
        if (feature && feature.bullets.length > 1) {
            const newBullets = feature.bullets.filter((_, i) => i !== index);
            handleUpdateFeature(featureId, { bullets: newBullets });
        }
    };

    const ICON_OPTIONS = [
        { value: 'multimedia', label: 'Multimídia', icon: Play },
        { value: 'featured', label: 'Destacado', icon: Star },
        { value: 'stories', label: 'Histórias TOP', icon: Sparkles },
    ];

    const handleSavePlan = () => {
        if (editingPlan) {
            // Update existing plan
            setPlans(plans.map(p => p.id === editingPlan.id ? { ...editingPlan, ...planForm } as Plan : p));
        } else {
            // Create new plan
            const newPlan: Plan = {
                id: `plan_${Date.now()}`,
                ...planForm,
                features: planForm.features.filter(f => f.trim()),
                created_at: new Date().toISOString(),
            };
            setPlans([...plans, newPlan]);
        }
        setShowPlanForm(false);
        setEditingPlan(null);
        setPlanForm({ name: '', description: '', price: 0, duration_days: 30, features: [''], is_active: true });
        // TODO: Save to database
    };

    const handleEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            duration_days: plan.duration_days,
            features: plan.features.length > 0 ? plan.features : [''],
            is_active: plan.is_active,
        });
        setShowPlanForm(true);
    };

    const handleDeletePlan = (planId: string) => {
        if (confirm('Tem certeza que deseja deletar este plano?')) {
            setPlans(plans.filter(p => p.id !== planId));
            // TODO: Delete from database
        }
    };

    const handleTogglePlanActive = (planId: string) => {
        setPlans(plans.map(p => p.id === planId ? { ...p, is_active: !p.is_active } : p));
        // TODO: Update in database
    };

    const handleAssignPlan = async (userId: string, planId: string, isTrial: boolean = false) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
            alert('Plano não encontrado');
            return;
        }

        // Verify user exists
        try {
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', userId)
                .single();

            if (userError || !user) {
                alert('Usuário não encontrado');
                return;
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration_days);

            const userPlan: UserPlan = {
                user_id: userId,
                user_name: user.display_name || undefined,
                plan_id: planId,
                plan_name: plan.name,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                is_active: true,
                is_trial: isTrial,
                payment_status: isTrial ? 'paid' : 'paid', // Admin assigns are automatically paid
            };

            // Try to save to database
            try {
                const { error: insertError } = await supabase
                    .from('user_plans')
                    .insert({
                        user_id: userId,
                        plan_id: planId,
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        is_active: true,
                        is_trial: isTrial,
                        payment_status: isTrial ? 'paid' : 'paid',
                    });

                if (insertError) {
                    console.warn('Could not save to database, using local state:', insertError);
                }
            } catch (err) {
                console.warn('user_plans table not available, using local state');
            }

            setUserPlans([...userPlans, userPlan]);
            alert(`✅ Plano ${plan.name} ${isTrial ? '(período grátis)' : ''} atribuído com sucesso ao usuário ${user.display_name || userId}!`);
            loadUserPlans();
        } catch (err: any) {
            alert(`Erro ao atribuir plano: ${err.message}`);
        }
    };

    const handleExtendPlan = async (userId: string, days: number) => {
        const userPlan = userPlans.find(up => up.user_id === userId && up.is_active);
        if (!userPlan) {
            alert('Assinatura ativa não encontrada para este usuário');
            return;
        }

        const currentEnd = new Date(userPlan.end_date);
        currentEnd.setDate(currentEnd.getDate() + days);
        const newEndDate = currentEnd.toISOString();

        // Try to update in database
        try {
            const { error } = await supabase
                .from('user_plans')
                .update({ end_date: newEndDate })
                .eq('user_id', userId)
                .eq('plan_id', userPlan.plan_id)
                .eq('is_active', true);

            if (error) {
                console.warn('Could not update in database:', error);
            }
        } catch (err) {
            console.warn('user_plans table not available');
        }

        setUserPlans(userPlans.map(up => {
            if (up.user_id === userId && up.plan_id === userPlan.plan_id && up.is_active) {
                return { ...up, end_date: newEndDate };
            }
            return up;
        }));

        alert(`✅ Plano estendido em ${days} dias! Nova data de expiração: ${currentEnd.toLocaleDateString('pt-BR')}`);
        loadUserPlans();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
                    <p className="text-muted-foreground mt-1">
                        Criar e gerenciar planos de assinatura e atribuir aos usuários
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'plans'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Planos ({plans.length})
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'users'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Assinaturas de Usuários ({userPlans.length})
                </button>
            </div>

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setEditingPlan(null);
                                setPlanForm({ name: '', description: '', price: 0, duration_days: 30, features: [''], is_active: true });
                                setShowPlanForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Plano
                        </button>
                    </div>

                    {showPlanForm && (
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4">
                                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tipo de Plano</label>
                                        <select
                                            value={planForm.type || 'subscription'}
                                            onChange={(e) => setPlanForm({ ...planForm, type: e.target.value as 'subscription' | 'visibility' })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            <option value="subscription">Assinatura</option>
                                            <option value="visibility">Visibilidade (Subidas)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nome do Plano</label>
                                        <input
                                            type="text"
                                            value={planForm.name}
                                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder={planForm.type === 'visibility' ? "Ex: 12 subidas/dia" : "Ex: Premium"}
                                        />
                                    </div>
                                    {planForm.type === 'visibility' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Subidas por dia</label>
                                                <input
                                                    type="number"
                                                    value={planForm.boostsPerDay || 0}
                                                    onChange={(e) => setPlanForm({ ...planForm, boostsPerDay: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Preço Total (R$)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={planForm.price}
                                                    onChange={(e) => {
                                                        const price = parseFloat(e.target.value) || 0;
                                                        const pricePerDay = planForm.duration_days > 0 ? price / planForm.duration_days : 0;
                                                        setPlanForm({ ...planForm, price, pricePerDay });
                                                    }}
                                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={planForm.price}
                                                onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Duração (dias)</label>
                                        <input
                                            type="number"
                                            value={planForm.duration_days}
                                            onChange={(e) => {
                                                const days = parseInt(e.target.value) || 30;
                                                const pricePerDay = planForm.type === 'visibility' && planForm.price > 0 ? planForm.price / days : undefined;
                                                setPlanForm({ ...planForm, duration_days: days, pricePerDay });
                                            }}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    {planForm.type === 'visibility' && planForm.pricePerDay !== undefined && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Preço por dia (calculado)</label>
                                            <input
                                                type="text"
                                                value={`R$ ${planForm.pricePerDay.toFixed(2)}`}
                                                readOnly
                                                className="w-full px-4 py-2 bg-muted border border-input rounded-lg"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select
                                            value={planForm.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.value === 'active' })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                        </select>
                                    </div>
                                    {planForm.type === 'visibility' && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={planForm.recommended || false}
                                                onChange={(e) => setPlanForm({ ...planForm, recommended: e.target.checked })}
                                                className="rounded"
                                            />
                                            <label className="text-sm font-medium">Recomendado</label>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Descrição</label>
                                    <textarea
                                        value={planForm.description}
                                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none h-24"
                                        placeholder="Descrição do plano"
                                    />
                                </div>
                                {planForm.type === 'subscription' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Recursos (um por linha)</label>
                                    {planForm.features.map((feature, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => {
                                                    const newFeatures = [...planForm.features];
                                                    newFeatures[index] = e.target.value;
                                                    setPlanForm({ ...planForm, features: newFeatures });
                                                }}
                                                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Ex: Anúncios ilimitados"
                                            />
                                            {planForm.features.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setPlanForm({
                                                            ...planForm,
                                                            features: planForm.features.filter((_, i) => i !== index)
                                                        });
                                                    }}
                                                    className="px-3 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setPlanForm({ ...planForm, features: [...planForm.features, ''] })}
                                        className="mt-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 inline mr-2" />
                                        Adicionar Recurso
                                    </button>
                                </div>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowPlanForm(false);
                                            setEditingPlan(null);
                                        }}
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSavePlan}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleTogglePlanActive(plan.id)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                plan.is_active
                                                    ? "text-green-600 hover:bg-green-500/10"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                            title={plan.is_active ? "Desativar" : "Ativar"}
                                        >
                                            {plan.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditPlan(plan)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="text-3xl font-bold text-primary">
                                        R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        por {plan.duration_days} dias
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Recursos:</div>
                                    <ul className="space-y-1">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        
                        {/* Planos de Visibilidade (da configuração de preços) */}
                        {pricingConfig.plans.filter(p => p.active).map((plan) => (
                            <div key={`pricing_${plan.id}`} className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{plan.boostsPerDay} subidas/dia</h3>
                                        <p className="text-sm text-muted-foreground">{plan.duration} dias de visibilidade</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingPricingPlan(editingPricingPlan === plan.id ? null : plan.id)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePricingPlan(plan.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {editingPricingPlan === plan.id ? (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Subidas/dia</label>
                                                <input
                                                    type="number"
                                                    value={plan.boostsPerDay}
                                                    onChange={(e) => handleUpdatePricingPlan(plan.id, { boostsPerDay: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Duração (dias)</label>
                                                <input
                                                    type="number"
                                                    value={plan.duration}
                                                    onChange={(e) => handleUpdatePricingPlan(plan.id, { duration: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Preço Total</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={plan.totalPrice}
                                                    onChange={(e) => {
                                                        const total = parseFloat(e.target.value) || 0;
                                                        const perDay = plan.duration > 0 ? total / plan.duration : 0;
                                                        handleUpdatePricingPlan(plan.id, { totalPrice: total, pricePerDay: perDay });
                                                    }}
                                                    className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Preço/dia</label>
                                                <input
                                                    type="text"
                                                    value={plan.pricePerDay.toFixed(2)}
                                                    readOnly
                                                    className="w-full px-3 py-2 bg-muted border border-input rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.recommended || false}
                                                    onChange={(e) => handleUpdatePricingPlan(plan.id, { recommended: e.target.checked })}
                                                    className="rounded"
                                                />
                                                Recomendado
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.active !== false}
                                                    onChange={(e) => handleUpdatePricingPlan(plan.id, { active: e.target.checked })}
                                                    className="rounded"
                                                />
                                                Ativo
                                            </label>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingPricingPlan(null);
                                                    handlePricingSave();
                                                }}
                                                className="px-3 py-2 bg-primary text-white rounded text-sm"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <div className="text-3xl font-bold text-primary">
                                                R$ {plan.totalPrice.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                R$ {plan.pricePerDay.toFixed(2)}/dia • {plan.duration} dias
                                            </div>
                                        </div>
                                        {plan.recommended && (
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Recomendado</span>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        
                        {/* Botão para adicionar novo plano de visibilidade */}
                        <button
                            onClick={handleAddPricingPlan}
                            className="bg-card border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors min-h-[200px]"
                        >
                            <TrendingUp className="w-8 h-8 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">Novo Plano de Visibilidade</span>
                        </button>
                    </div>
                </div>
            )}

            {/* User Plans Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por usuário ou plano..."
                                    value={searchUserPlans}
                                    onChange={(e) => setSearchUserPlans(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <select
                                value={filterUserPlans}
                                onChange={(e) => setFilterUserPlans(e.target.value as any)}
                                className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            >
                                <option value="all">Todos os status</option>
                                <option value="active">Ativos</option>
                                <option value="expired">Expirados</option>
                                <option value="trial">Períodos Grátis</option>
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                setAssignForm({ userId: '', planId: '', isTrial: false });
                                setShowAssignModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Atribuir Plano
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Usuário</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Plano</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Início</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Fim</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Dias Restantes</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userPlans
                                    .filter(up => {
                                        const matchesSearch = 
                                            up.user_name?.toLowerCase().includes(searchUserPlans.toLowerCase()) ||
                                            up.user_id.toLowerCase().includes(searchUserPlans.toLowerCase()) ||
                                            up.plan_name?.toLowerCase().includes(searchUserPlans.toLowerCase());
                                        
                                        const matchesFilter =
                                            filterUserPlans === 'all' ||
                                            (filterUserPlans === 'active' && up.is_active && new Date(up.end_date) >= new Date()) ||
                                            (filterUserPlans === 'expired' && new Date(up.end_date) < new Date()) ||
                                            (filterUserPlans === 'trial' && up.is_trial);
                                        
                                        return matchesSearch && matchesFilter;
                                    })
                                    .map((userPlan) => {
                                    const isExpired = new Date(userPlan.end_date) < new Date();
                                    const daysRemaining = Math.ceil((new Date(userPlan.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <tr key={`${userPlan.user_id}_${userPlan.plan_id}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{userPlan.user_name || userPlan.user_id}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{userPlan.user_id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{userPlan.plan_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {userPlan.is_trial ? (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-600 text-xs rounded font-medium">
                                                        <Gift className="w-3 h-3 inline mr-1" />
                                                        Período Grátis
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 text-xs rounded font-medium">
                                                        <CreditCard className="w-3 h-3 inline mr-1" />
                                                        Pago
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(userPlan.start_date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={cn(isExpired && "text-red-600 font-medium")}>
                                                    {new Date(userPlan.end_date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 text-xs font-medium rounded",
                                                    daysRemaining > 7 && "bg-green-500/20 text-green-600",
                                                    daysRemaining > 0 && daysRemaining <= 7 && "bg-yellow-500/20 text-yellow-600",
                                                    daysRemaining <= 0 && "bg-red-500/20 text-red-600"
                                                )}>
                                                    {daysRemaining > 0 ? `${daysRemaining} dias` : 'Expirado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 text-xs font-medium rounded",
                                                    userPlan.payment_status === 'paid' && userPlan.is_active && !isExpired && "bg-green-500/20 text-green-600",
                                                    userPlan.payment_status === 'pending' && "bg-yellow-500/20 text-yellow-600",
                                                    (userPlan.payment_status === 'expired' || isExpired) && "bg-red-500/20 text-red-600",
                                                    userPlan.payment_status === 'cancelled' && "bg-muted text-muted-foreground",
                                                    !userPlan.is_active && "bg-gray-500/20 text-gray-600"
                                                )}>
                                                    {!userPlan.is_active && 'Inativo'}
                                                    {userPlan.is_active && userPlan.payment_status === 'paid' && !isExpired && 'Ativo'}
                                                    {userPlan.is_active && userPlan.payment_status === 'pending' && 'Pendente'}
                                                    {userPlan.is_active && (userPlan.payment_status === 'expired' || isExpired) && 'Expirado'}
                                                    {userPlan.payment_status === 'cancelled' && 'Cancelado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const days = prompt('Quantos dias adicionar?');
                                                            if (days && !isNaN(parseInt(days))) {
                                                                handleExtendPlan(userPlan.user_id, parseInt(days));
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                        title="Estender plano"
                                                    >
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        Estender
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Tem certeza que deseja cancelar esta assinatura?')) {
                                                                // TODO: Cancel subscription
                                                                alert('Assinatura cancelada');
                                                                loadUserPlans();
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors"
                                                        title="Cancelar assinatura"
                                                    >
                                                        <XCircle className="w-4 h-4 inline mr-1" />
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Tem certeza que deseja reativar esta assinatura?')) {
                                                                // TODO: Reactivate subscription
                                                                alert('Assinatura reativada');
                                                                loadUserPlans();
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                        title="Reativar assinatura"
                                                    >
                                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                                        Reativar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {userPlans.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhuma assinatura encontrada. Atribua planos aos usuários para começar.
                            </div>
                        )}
                    </div>

                    {/* Stats for User Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">Total de Assinaturas</div>
                            <div className="text-2xl font-bold">{userPlans.length}</div>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">Ativas</div>
                            <div className="text-2xl font-bold text-green-600">
                                {userPlans.filter(up => up.is_active && new Date(up.end_date) >= new Date()).length}
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">Expiradas</div>
                            <div className="text-2xl font-bold text-red-600">
                                {userPlans.filter(up => new Date(up.end_date) < new Date()).length}
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">Períodos Grátis</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {userPlans.filter(up => up.is_trial).length}
                            </div>
                        </div>
                    </div>

                    {/* Assign Plan Modal */}
                    {showAssignModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full">
                                <h3 className="text-xl font-bold mb-4">Atribuir Plano a Usuário</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Usuário *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={userSearchTerm}
                                                onChange={(e) => {
                                                    setUserSearchTerm(e.target.value);
                                                    setShowUserSearch(true);
                                                }}
                                                onFocus={() => setShowUserSearch(true)}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Buscar por nome ou email..."
                                            />
                                            {showUserSearch && userSearchTerm && (
                                                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {users
                                                        .filter(u => 
                                                            u.display_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                            u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                            u.id.toLowerCase().includes(userSearchTerm.toLowerCase())
                                                        )
                                                        .slice(0, 10)
                                                        .map(user => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setAssignForm({ ...assignForm, userId: user.id });
                                                                    setUserSearchTerm(user.display_name + (user.email ? ` (${user.email})` : ''));
                                                                    setShowUserSearch(false);
                                                                }}
                                                                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                                                            >
                                                                <div className="font-medium">{user.display_name}</div>
                                                                {user.email && (
                                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                )}
                                                                <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                                                            </button>
                                                        ))}
                                                    {users.filter(u => 
                                                        u.display_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                        u.id.toLowerCase().includes(userSearchTerm.toLowerCase())
                                                    ).length === 0 && (
                                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                                            Nenhum usuário encontrado
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {assignForm.userId && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                ID selecionado: <span className="font-mono">{assignForm.userId}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Selecione o Plano *</label>
                                        <select
                                            value={assignForm.planId}
                                            onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            <option value="">Selecione um plano...</option>
                                            {plans.filter(p => p.is_active).map(plan => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} - R$ {plan.price.toFixed(2)} ({plan.duration_days} dias)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={assignForm.isTrial}
                                            onChange={(e) => setAssignForm({ ...assignForm, isTrial: e.target.checked })}
                                            className="w-4 h-4"
                                            id="isTrial"
                                        />
                                        <label htmlFor="isTrial" className="text-sm cursor-pointer">
                                            Atribuir como período grátis (trial)
                                        </label>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setShowAssignModal(false);
                                                setAssignForm({ userId: '', planId: '', isTrial: false });
                                                setUserSearchTerm('');
                                                setShowUserSearch(false);
                                            }}
                                            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!assignForm.userId.trim() || !assignForm.planId) {
                                                    alert('Preencha todos os campos obrigatórios');
                                                    return;
                                                }
                                                await handleAssignPlan(assignForm.userId.trim(), assignForm.planId, assignForm.isTrial);
                                                setShowAssignModal(false);
                                                setAssignForm({ userId: '', planId: '', isTrial: false });
                                                setUserSearchTerm('');
                                                setShowUserSearch(false);
                                            }}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            Atribuir Plano
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

