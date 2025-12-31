import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Play, Star, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPricingConfig, savePricingConfig, resetPricingConfig, type BoostPlan, type ExtraFeature, type PricingConfig } from '@/lib/utils/pricing-config';

const ICON_OPTIONS = [
    { value: 'multimedia', label: 'Multimídia', icon: Play },
    { value: 'featured', label: 'Destacado', icon: Star },
    { value: 'stories', label: 'Histórias TOP', icon: Sparkles },
];

export default function PricingManagement() {
    const [config, setConfig] = useState<PricingConfig>(getPricingConfig());
    const [saved, setSaved] = useState(false);
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [editingFeature, setEditingFeature] = useState<string | null>(null);




    const handleSave = () => {
        savePricingConfig(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            resetPricingConfig();
            setConfig(getPricingConfig());
        }
    };

    const handleAddPlan = () => {
        const newPlan: BoostPlan = {
            id: `plan_${Date.now()}`,
            boostsPerDay: 6,
            duration: 7,
            totalPrice: 55,
            pricePerDay: 7.86,
            recommended: false,
            active: true,
        };
        setConfig({
            ...config,
            plans: [...config.plans, newPlan],
        });
        setEditingPlan(newPlan.id);
    };

    const handleUpdatePlan = (planId: string, updates: Partial<BoostPlan>) => {
        setConfig({
            ...config,
            plans: config.plans.map(p => p.id === planId ? { ...p, ...updates } : p),
        });
    };

    const handleDeletePlan = (planId: string) => {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            setConfig({
                ...config,
                plans: config.plans.filter(p => p.id !== planId),
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
        setConfig({
            ...config,
            extraFeatures: [...config.extraFeatures, newFeature],
        });
        setEditingFeature(newFeature.id);
    };

    const handleUpdateFeature = (featureId: string, updates: Partial<ExtraFeature>) => {
        setConfig({
            ...config,
            extraFeatures: config.extraFeatures.map(f => f.id === featureId ? { ...f, ...updates } : f),
        });
    };

    const handleDeleteFeature = (featureId: string) => {
        if (confirm('Tem certeza que deseja excluir esta feature?')) {
            setConfig({
                ...config,
                extraFeatures: config.extraFeatures.filter(f => f.id !== featureId),
            });
        }
    };

    const handleAddCategory = (category: string) => {
        if (category.trim() && !config.categories.includes(category.trim())) {
            setConfig({
                ...config,
                categories: [...config.categories, category.trim()],
            });
        }
    };

    const handleRemoveCategory = (category: string) => {
        setConfig({
            ...config,
            categories: config.categories.filter(c => c !== category),
        });
    };

    const updateBullet = (featureId: string, index: number, value: string) => {
        const feature = config.extraFeatures.find(f => f.id === featureId);
        if (feature) {
            const newBullets = [...feature.bullets];
            newBullets[index] = value;
            handleUpdateFeature(featureId, { bullets: newBullets });
        }
    };

    const addBullet = (featureId: string) => {
        const feature = config.extraFeatures.find(f => f.id === featureId);
        if (feature) {
            handleUpdateFeature(featureId, { bullets: [...feature.bullets, ''] });
        }
    };

    const removeBullet = (featureId: string, index: number) => {
        const feature = config.extraFeatures.find(f => f.id === featureId);
        if (feature && feature.bullets.length > 1) {
            const newBullets = feature.bullets.filter((_, i) => i !== index);
            handleUpdateFeature(featureId, { bullets: newBullets });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Gerenciamento de Preços</h1>
                    <p className="text-muted-foreground">Configure planos, textos e features da página de preços</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Salvo!</span>
                        </div>
                    )}
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
                    >
                        Restaurar Padrão
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Configurações
                    </button>
                </div>
            </div>

            {/* Seção Principal */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Seção Principal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Título</label>
                        <input
                            type="text"
                            value={config.mainSection.title}
                            onChange={(e) => setConfig({ ...config, mainSection: { ...config.mainSection, title: e.target.value } })}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Ex: Subidas Automáticas"
                            aria-label="Título da seção principal"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <textarea
                            value={config.mainSection.description}
                            onChange={(e) => setConfig({ ...config, mainSection: { ...config.mainSection, description: e.target.value } })}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                            placeholder="Descrição da seção..."
                            aria-label="Descrição da seção principal"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Cidade Padrão</label>
                        <input
                            type="text"
                            value={config.defaultCity}
                            onChange={(e) => setConfig({ ...config, defaultCity: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Ex: Rio de Janeiro"
                            aria-label="Cidade Padrão"
                        />
                    </div>
                </div>
            </div>

            {/* Categorias */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Categorias (Setores)</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {config.categories.map(cat => (
                        <div key={cat} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-lg">
                            <span className="text-sm">{cat}</span>
                            <button
                                onClick={() => handleRemoveCategory(cat)}
                                className="text-red-500 hover:text-red-600"
                                aria-label={`Remover categoria ${cat}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nova categoria"
                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        aria-label="Nova categoria"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddCategory(e.currentTarget.value);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            const input = document.querySelector('input[placeholder="Nova categoria"]') as HTMLInputElement;
                            if (input) {
                                handleAddCategory(input.value);
                                input.value = '';
                            }
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        aria-label="Adicionar categoria"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Planos */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Planos de Subidas</h2>
                    <button
                        onClick={handleAddPlan}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Plano
                    </button>
                </div>
                <div className="space-y-4">
                    {config.plans.map(plan => (
                        <div key={plan.id} className={cn(
                            "border rounded-lg p-4",
                            editingPlan === plan.id ? "border-primary bg-primary/5" : "border-border"
                        )}>
                            {editingPlan === plan.id ? (
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Subidas/dia</label>
                                        <input
                                            type="number"
                                            value={plan.boostsPerDay}
                                            onChange={(e) => handleUpdatePlan(plan.id, { boostsPerDay: parseInt(e.target.value) || 0 })}
                                            className="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                                            aria-label="Subidas por dia"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Duração (dias)</label>
                                        <input
                                            type="number"
                                            value={plan.duration}
                                            onChange={(e) => handleUpdatePlan(plan.id, { duration: parseInt(e.target.value) || 0 })}
                                            className="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                                            aria-label="Duração em dias"
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
                                                handleUpdatePlan(plan.id, { totalPrice: total, pricePerDay: perDay });
                                            }}
                                            className="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                                            aria-label="Preço total"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Preço/dia</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={plan.pricePerDay.toFixed(2)}
                                            readOnly
                                            className="w-full px-2 py-1 bg-muted border border-input rounded text-sm"
                                            aria-label="Preço por dia"
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={plan.recommended || false}
                                                onChange={(e) => handleUpdatePlan(plan.id, { recommended: e.target.checked })}
                                                className="rounded"
                                            />
                                            Recomendado
                                        </label>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={plan.active !== false}
                                                onChange={(e) => handleUpdatePlan(plan.id, { active: e.target.checked })}
                                                className="rounded"
                                            />
                                            Ativo
                                        </label>
                                    </div>
                                    <div className="col-span-full flex gap-2">
                                        <button
                                            onClick={() => setEditingPlan(null)}
                                            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 text-sm"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                            aria-label="Excluir plano"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="font-bold">{plan.boostsPerDay} subidas/dia</div>
                                            <div className="text-sm text-muted-foreground">{plan.duration} dias</div>
                                        </div>
                                        <div>
                                            <div className="font-bold">R$ {plan.totalPrice.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">R$ {plan.pricePerDay.toFixed(2)}/dia</div>
                                        </div>
                                        {plan.recommended && (
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Recomendado</span>
                                        )}
                                        {!plan.active && (
                                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">Inativo</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setEditingPlan(plan.id)}
                                        className="p-2 hover:bg-muted rounded-lg"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Extras */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Features Extras</h2>
                    <button
                        onClick={handleAddFeature}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Feature
                    </button>
                </div>
                <div className="space-y-6">
                    {config.extraFeatures.map(feature => {
                        const IconComponent = ICON_OPTIONS.find(opt => opt.value === feature.icon)?.icon || Play;
                        return (
                            <div key={feature.id} className={cn(
                                "border rounded-xl p-6",
                                editingFeature === feature.id ? "border-primary bg-primary/5" : "border-border"
                            )}>
                                {editingFeature === feature.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Título</label>
                                                <input
                                                    type="text"
                                                    value={feature.title}
                                                    onChange={(e) => handleUpdateFeature(feature.id, { title: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                                                    aria-label="Título da feature"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Preço</label>
                                                <input
                                                    type="text"
                                                    value={feature.price}
                                                    onChange={(e) => handleUpdateFeature(feature.id, { price: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                                                    placeholder="Ex: R$ 5 por dia ou 50%"
                                                    aria-label="Preço da feature"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Descrição</label>
                                            <textarea
                                                value={feature.description}
                                                onChange={(e) => handleUpdateFeature(feature.id, { description: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg min-h-[80px]"
                                                aria-label="Descrição da feature"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Ícone</label>
                                            <select
                                                value={feature.icon}
                                                onChange={(e) => handleUpdateFeature(feature.id, { icon: e.target.value as 'multimedia' | 'featured' | 'stories' })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                                                aria-label="Ícone da feature"
                                            >
                                                {ICON_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Bullets (Itens de lista)</label>
                                            <div className="space-y-2">
                                                {feature.bullets.map((bullet, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={bullet}
                                                            onChange={(e) => updateBullet(feature.id, idx, e.target.value)}
                                                            className="flex-1 px-4 py-2 bg-background border border-input rounded-lg"
                                                            aria-label={`Item ${idx + 1}`}
                                                        />
                                                        <button
                                                            onClick={() => removeBullet(feature.id, idx)}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                            aria-label="Remover item"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addBullet(feature.id)}
                                                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 text-sm"
                                                >
                                                    <Plus className="w-4 h-4 inline mr-1" />
                                                    Adicionar Item
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={feature.active}
                                                    onChange={(e) => handleUpdateFeature(feature.id, { active: e.target.checked })}
                                                    className="rounded"
                                                />
                                                Ativo
                                            </label>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingFeature(null)}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                            >
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFeature(feature.id)}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                aria-label="Excluir feature"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    feature.icon === 'multimedia' && "bg-blue-500/10 text-blue-500",
                                                    feature.icon === 'featured' && "bg-yellow-500/10 text-yellow-500",
                                                    feature.icon === 'stories' && "bg-pink-500/10 text-pink-500"
                                                )}>
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">{feature.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                    <p className="text-sm font-medium mt-1">Preço: {feature.price}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!feature.active && (
                                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">Inativo</span>
                                                )}
                                                <button
                                                    onClick={() => setEditingFeature(feature.id)}
                                                    className="p-2 hover:bg-muted rounded-lg"
                                                    aria-label={`Editar feature ${feature.title}`}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <ul className="space-y-1 text-sm text-muted-foreground ml-12">
                                            {feature.bullets.map((bullet, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preview Link */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
                <p className="text-muted-foreground mb-4">
                    Visualize as alterações na página de preços
                </p>
                <a
                    href="/precos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                    Ver Página de Preços
                </a>
            </div>
        </div>
    );
}

