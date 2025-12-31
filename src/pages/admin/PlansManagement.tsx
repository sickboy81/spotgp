import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pb } from '@/lib/pocketbase';
import { getPricingConfig, savePricingConfig, resetPricingConfig, type BoostPlan as PricingBoostPlan, type PricingConfig } from '@/lib/utils/pricing-config';
import { RecordModel } from 'pocketbase';

interface Plan extends RecordModel {
    name: string;
    description: string;
    price: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
    type?: 'subscription' | 'visibility';
    boostsPerDay?: number;
    pricePerDay?: number;
    recommended?: boolean;
}

interface UserPlan {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    plan_id: string;
    plan_name?: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_trial: boolean;
    payment_status: 'paid' | 'pending' | 'expired' | 'cancelled';
}

interface PlanFormState {
    name: string;
    description: string;
    price: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
    type: 'subscription' | 'visibility';
    boostsPerDay?: number;
    pricePerDay?: number;
    recommended?: boolean;
}

export default function PlansManagement() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
    const [activeTab, setActiveTab] = useState<'plans' | 'users'>('plans');
    const [loading, setLoading] = useState(true);

    // Pricing config state
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(getPricingConfig());
    const [editingPricingPlan, setEditingPricingPlan] = useState<string | null>(null);

    // Form state
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planForm, setPlanForm] = useState<PlanFormState>({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        features: [''],
        is_active: true,
        type: 'subscription'
    });

    const loadPlans = useCallback(async () => {
        try {
            const result = await pb.collection('plans').getFullList<Plan>({
                sort: 'price',
            });
            setPlans(result);
        } catch (err) {
            console.warn('Error loading plans (collection might not exist yet):', err);
            setPlans([]);
        }
    }, []);

    const loadUserPlans = useCallback(async () => {
        try {
            try {
                const userPlansData = await pb.collection('user_plans').getFullList({
                    sort: '-created',
                    expand: 'user_id'
                });

                const plansWithDetails: UserPlan[] = userPlansData.map((up: RecordModel) => ({
                    id: up.id,
                    user_id: up.user_id,
                    user_name: up.expand?.user_id?.display_name || 'Desconhecido',
                    user_email: up.expand?.user_id?.email,
                    plan_id: up.plan_id,
                    plan_name: plans.find(p => p.id === up.plan_id)?.name || 'Plano Arquivado',
                    start_date: up.start_date,
                    end_date: up.end_date,
                    is_active: up.is_active,
                    is_trial: up.is_trial,
                    payment_status: up.payment_status,
                }));
                setUserPlans(plansWithDetails);
            } catch {
                setUserPlans([]);
            }
        } catch (err) {
            console.error('Error loading user plans:', err);
        }
    }, [plans]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadPlans()]); // Load plans first
            setPricingConfig(getPricingConfig());
            setLoading(false);
        };
        init();
    }, [loadPlans]);

    // Load user plans when tab changes or plans loaded
    useEffect(() => {
        if (plans.length > 0) {
            loadUserPlans(); // eslint-disable-line
        }
    }, [plans, loadUserPlans]);

    // Pricing handlers
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

    const handleSavePlan = async () => {
        try {
            const data = {
                ...planForm,
                features: planForm.features.filter(f => f.trim())
            };

            if (editingPlan) {
                await pb.collection('plans').update(editingPlan.id, data);
            } else {
                await pb.collection('plans').create(data);
            }

            await loadPlans();
            setShowPlanForm(false);
            setEditingPlan(null);
            resetForm();
            alert('Plano salvo com sucesso!');
        } catch (err: unknown) {
            console.error('Error saving plan:', err);
            alert(`Erro ao salvar plano: ${(err as Error).message}`);
        }
    };

    const resetForm = () => {
        setPlanForm({
            name: '',
            description: '',
            price: 0,
            duration_days: 30,
            features: [''],
            is_active: true,
            type: 'subscription',
            boostsPerDay: undefined,
            pricePerDay: undefined,
            recommended: false
        });
    };

    const handleEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            duration_days: plan.duration_days,
            features: plan.features?.length > 0 ? plan.features : [''],
            is_active: plan.is_active,
            type: plan.type || 'subscription',
            boostsPerDay: plan.boostsPerDay,
            pricePerDay: plan.pricePerDay,
            recommended: plan.recommended
        });
        setShowPlanForm(true);
    };

    const handleDeletePlan = async (planId: string) => {
        if (confirm('Tem certeza que deseja deletar este plano?')) {
            try {
                await pb.collection('plans').delete(planId);
                await loadPlans();
            } catch (err: unknown) {
                alert(`Erro ao deletar plano: ${(err as Error).message}`);
            }
        }
    };

    const handleTogglePlanActive = async (plan: Plan) => {
        try {
            await pb.collection('plans').update(plan.id, { is_active: !plan.is_active });
            await loadPlans();
        } catch (err: unknown) {
            alert(`Erro ao atualizar plano: ${(err as Error).message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando planos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
                    <p className="text-muted-foreground mt-1">
                        Criar e gerenciar planos de assinatura e visibilidade
                    </p>
                </div>
                {activeTab === 'plans' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (confirm('Salvar configurações de preço?')) {
                                    savePricingConfig(pricingConfig);
                                    alert('Configurações salvas!');
                                }
                            }}
                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            aria-label="Salvar configurações"
                        >
                            Salvar Configs
                        </button>
                        <button
                            onClick={() => {
                                // eslint-disable-next-line no-restricted-globals
                                if (confirm('Restaurar padrão?')) {
                                    resetPricingConfig();
                                    setPricingConfig(getPricingConfig());
                                }
                            }}
                            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            aria-label="Restaurar padrão"
                        >
                            Restaurar Padrão
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'plans'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Aba Planos"
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
                    aria-label="Aba Assinaturas"
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
                                resetForm();
                                setShowPlanForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            aria-label="Criar novo plano"
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
                                            value={planForm.type}
                                            onChange={(e) => setPlanForm({ ...planForm, type: e.target.value as 'subscription' | 'visibility' })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            aria-label="Tipo de Plano"
                                        >
                                            <option value="subscription">Assinatura</option>
                                            <option value="visibility">Visibilidade</option>
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
                                            aria-label="Nome do Plano"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={planForm.price}
                                            onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            aria-label="Preço do Plano"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Duração (dias)</label>
                                        <input
                                            type="number"
                                            value={planForm.duration_days}
                                            onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) || 30 })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            aria-label="Duração em dias"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select
                                            value={planForm.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.value === 'active' })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            aria-label="Status do Plano"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                        </select>
                                    </div>
                                    {planForm.type === 'visibility' && (
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="plan-recommended"
                                                checked={planForm.recommended || false}
                                                onChange={(e) => setPlanForm({ ...planForm, recommended: e.target.checked })}
                                                className="rounded"
                                                aria-label="Recomendado"
                                            />
                                            <label htmlFor="plan-recommended" className="text-sm font-medium">Recomendado</label>
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
                                        aria-label="Descrição do Plano"
                                    />
                                </div>
                                {planForm.type === 'subscription' && (
                                    <>
                                        <label className="block text-sm font-medium mb-1">Recursos</label>
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
                                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                                                    placeholder="Recurso do plano"
                                                    aria-label={`Recurso ${index + 1}`}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newFeatures = planForm.features.filter((_, i) => i !== index);
                                                        setPlanForm({ ...planForm, features: newFeatures });
                                                    }}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded"
                                                    aria-label="Remover recurso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setPlanForm({ ...planForm, features: [...planForm.features, ''] })}
                                            className="text-primary hover:underline text-sm"
                                            aria-label="Adicionar recurso"
                                        >
                                            + Adicionar Recurso
                                        </button>
                                    </>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowPlanForm(false);
                                            setEditingPlan(null);
                                        }}
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                                        aria-label="Cancelar edição"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSavePlan}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                        aria-label="Salvar plano"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-card border border-border rounded-lg p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold">{plan.name}</h3>
                                            {plan.type === 'visibility' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                                    VISIBILIDADE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                                    </div>
                                    <div className="flex gap-1 pl-2">
                                        <button
                                            onClick={() => handleTogglePlanActive(plan)}
                                            className={cn("p-2 rounded-lg transition-colors", plan.is_active ? "text-green-600 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted")}
                                            aria-label={plan.is_active ? "Desativar plano" : "Ativar plano"}
                                            title={plan.is_active ? "Desativar" : "Ativar"}
                                        >
                                            {plan.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditPlan(plan)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded"
                                            aria-label="Editar plano"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded"
                                            aria-label="Deletar plano"
                                            title="Excluir"
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
                                <div className="mt-auto space-y-2">
                                    <div className="text-sm font-medium">Recursos:</div>
                                    <ul className="space-y-1">
                                        {plan.features?.slice(0, 4).map((feature, index) => (
                                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                                <span className="truncate">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.features?.length > 4 && (
                                            <li className="text-xs text-muted-foreground pl-5 whitespace-nowrap">
                                                + {plan.features.length - 4} recursos...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ))}

                        {/* Config Pricing Plans (Visual Only for reference, mixed with DB plans in this UI approach is tricky, keeping separate if desired or treating config as source of truth for Boosts) */}
                        {/* Integrating the Config Pricing Plans as logical "Visibility Plans" if they are not in DB is confusing. 
                            For this version, we assume Admins create Visibility Plans in DB (yellow cards) 
                            AND/OR we show the Config plans below as 'System Default Plans' */}

                        {pricingConfig.plans.filter(p => !p.id.startsWith('db_')).map((plan) => (
                            <div key={`config_${plan.id}`} className="bg-card border border-border border-dashed rounded-lg p-6 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-muted rounded">SISTEMA (CONFIG)</span>
                                    {plan.recommended && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                                            RECOMENDADO
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold">{plan.boostsPerDay} subidas/dia</h3>
                                <div className="text-2xl font-bold text-muted-foreground mt-2">
                                    R$ {plan.totalPrice.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {plan.duration} dias
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => setEditingPricingPlan(editingPricingPlan === plan.id ? null : plan.id)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                        aria-label="Editar plano de configuração"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePricingPlan(plan.id)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        aria-label="Excluir plano de configuração"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {editingPricingPlan === plan.id && (
                                    <div className="mt-4 space-y-2 p-2 bg-muted/50 rounded animate-in fade-in zoom-in-95">
                                        <div>
                                            <label className="text-xs">Preço Total</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm p-1 rounded border"
                                                value={plan.totalPrice}
                                                onChange={(e) => handleUpdatePricingPlan(plan.id, { totalPrice: parseFloat(e.target.value) || 0 })}
                                                aria-label="Preço total do plano de configuração"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div
                            className="border-2 border-dashed border-border rounded-lg p-6 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                            onClick={() => {
                                const newPlan: PricingBoostPlan = {
                                    id: `plan_${Date.now()}`,
                                    boostsPerDay: 5,
                                    duration: 7,
                                    totalPrice: 49.90,
                                    pricePerDay: 7.12,
                                    recommended: false,
                                    active: true,
                                };
                                setPricingConfig({
                                    ...pricingConfig,
                                    plans: [...pricingConfig.plans, newPlan],
                                });
                            }}
                        >
                            <div className="text-center">
                                <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <span className="font-medium text-muted-foreground">Novo Plano (Config)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-lg">Assinaturas Ativas e Histórico</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar usuário..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg"
                                aria-label="Buscar assinatura de usuário"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-4 py-3">Usuário</th>
                                    <th className="px-4 py-3">Plano</th>
                                    <th className="px-4 py-3">Início</th>
                                    <th className="px-4 py-3">Fim</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {userPlans.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            Nenhuma assinatura encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    userPlans.map((up) => (
                                        <tr key={up.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {up.user_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{up.user_name}</div>
                                                        <div className="text-xs text-muted-foreground">{up.user_email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-primary">
                                                {up.plan_name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                                                {new Date(up.start_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(up.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    up.is_active && new Date(up.end_date) > new Date()
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-red-500/10 text-red-600"
                                                )}>
                                                    {up.is_active && new Date(up.end_date) > new Date() ? 'Ativo' : 'Expirado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {up.is_trial ? (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Trial</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Pago</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
