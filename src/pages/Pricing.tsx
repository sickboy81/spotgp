import { useState, useEffect } from 'react';
import { TrendingUp, Play, Star, Sparkles, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { getPricingConfig, type BoostPlan } from '@/lib/utils/pricing-config';

export default function Pricing() {
    const { user } = useAuth();
    const [config, setConfig] = useState(getPricingConfig());
    const [selectedCategory, setSelectedCategory] = useState(config.categories[0] || 'Acompanhantes');
    const [selectedCity, setSelectedCity] = useState(config.defaultCity);
    const [selectedBoosts, setSelectedBoosts] = useState<number | null>(null);

    // Recarrega configuração quando muda (para admin preview)
    useEffect(() => {
        const interval = setInterval(() => {
            const newConfig = getPricingConfig();
            setConfig(newConfig);
            setSelectedCategory(prev => newConfig.categories.includes(prev) ? prev : (newConfig.categories[0] || ''));
            setSelectedCity(newConfig.defaultCity);
        }, 2000); // Verifica a cada 2 segundos

        return () => clearInterval(interval);
    }, []);

    const activePlans = config.plans.filter(p => p.active);
    const filteredPlans = selectedBoosts
        ? activePlans.filter(p => p.boostsPerDay === selectedBoosts)
        : activePlans.filter(p => p.recommended);

    // Obter opções únicas de subidas para filtro
    const uniqueBoosts = Array.from(new Set(activePlans.map(p => p.boostsPerDay))).sort((a, b) => a - b);

    const handlePurchase = (plan: BoostPlan) => {
        if (!user) {
            alert('Faça login para contratar um plano');
            return;
        }
        // TODO: Implement purchase flow
        alert(`Contratando: ${plan.boostsPerDay} subidas / dia por ${plan.duration} dias - R$ ${plan.totalPrice.toFixed(2)} `);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Preços</h1>
                    <p className="text-lg text-muted-foreground">Aumente a visibilidade do seu anúncio</p>
                </div>

                {/* Subidas Automáticas */}
                <section className="mb-16">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold">{config.mainSection.title}</h2>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            {config.mainSection.description}
                        </p>
                    </div>

                    {/* Filtros */}
                    <div className="mb-8 space-y-4">
                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Setor</label>
                            <div className="flex flex-wrap gap-2">
                                {config.categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            selectedCategory === cat
                                                ? "bg-primary text-white"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cidade */}
                        <div className="max-w-md">
                            <label className="block text-sm font-medium mb-2">Cidade</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    placeholder="Buscar cidade..."
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Filtro por número de subidas */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Subidas por dia</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedBoosts(null)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        selectedBoosts === null
                                            ? "bg-primary text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    Todos
                                </button>
                                {uniqueBoosts.map(boosts => (
                                    <button
                                        key={boosts}
                                        onClick={() => setSelectedBoosts(boosts)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            selectedBoosts === boosts
                                                ? "bg-primary text-white"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {boosts} subidas
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Planos Recomendados */}
                    {!selectedBoosts && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">Planos Recomendados</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {filteredPlans.map(plan => (
                                    <div
                                        key={plan.id}
                                        className={cn(
                                            "bg-card border-2 rounded-xl p-6 shadow-lg relative",
                                            plan.recommended
                                                ? "border-primary bg-primary/5"
                                                : "border-border"
                                        )}
                                    >
                                        {plan.recommended && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                                                Recomendado
                                            </div>
                                        )}
                                        <div className="text-center mb-4">
                                            <div className="text-3xl font-bold mb-1">{plan.duration} dias</div>
                                            <div className="text-lg text-muted-foreground">{plan.boostsPerDay} subidas / dia</div>
                                        </div>
                                        <div className="text-center mb-6">
                                            <div className="text-4xl font-bold mb-1">R$ {plan.totalPrice.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">R$ {plan.pricePerDay.toFixed(2)} / dia</div>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase(plan)}
                                            className={cn(
                                                "w-full py-3 rounded-lg font-bold transition-colors",
                                                plan.recommended
                                                    ? "bg-primary text-white hover:bg-primary/90"
                                                    : "bg-muted text-foreground hover:bg-muted/80"
                                            )}
                                        >
                                            Contratar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Todos os Planos - Mostra apenas quando há filtro de subidas */}
                    {selectedBoosts && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{selectedBoosts} Subidas por Dia</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {filteredPlans.map(plan => (
                                    <div
                                        key={plan.id}
                                        className={cn(
                                            "bg-card border-2 rounded-xl p-6 shadow-lg relative transition-transform hover:scale-105",
                                            plan.recommended
                                                ? "border-primary bg-primary/5"
                                                : "border-border"
                                        )}
                                    >
                                        {plan.recommended && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                                                Recomendado
                                            </div>
                                        )}
                                        <div className="text-center mb-4">
                                            <div className="text-2xl font-bold mb-1">{plan.duration} dias</div>
                                            <div className="text-base text-muted-foreground">{plan.boostsPerDay} subidas / dia</div>
                                        </div>
                                        <div className="text-center mb-6">
                                            <div className="text-3xl font-bold mb-1">R$ {plan.totalPrice.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">R$ {plan.pricePerDay.toFixed(2)} / dia</div>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase(plan)}
                                            className={cn(
                                                "w-full py-3 rounded-lg font-bold transition-colors",
                                                plan.recommended
                                                    ? "bg-primary text-white hover:bg-primary/90"
                                                    : "bg-muted text-foreground hover:bg-muted/80"
                                            )}
                                        >
                                            Contratar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Extras */}
                {config.extraFeatures.filter(f => f.active).length > 0 && (
                    <div className={cn(
                        "grid gap-6 mb-12",
                        config.extraFeatures.filter(f => f.active).length === 1 ? "grid-cols-1" :
                            config.extraFeatures.filter(f => f.active).length === 2 ? "grid-cols-1 md:grid-cols-2" :
                                "grid-cols-1 md:grid-cols-3"
                    )}>
                        {config.extraFeatures.filter(f => f.active).map(feature => {
                            const IconComponent = feature.icon === 'multimedia' ? Play :
                                feature.icon === 'featured' ? Star :
                                    feature.icon === 'stories' ? Sparkles : Play;

                            const bgColor = feature.icon === 'multimedia' ? 'bg-blue-500/10 border-blue-500/30' :
                                feature.icon === 'featured' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                    'bg-pink-500/10 border-pink-500/30';

                            const iconBg = feature.icon === 'multimedia' ? 'bg-blue-500/10 text-blue-500' :
                                feature.icon === 'featured' ? 'bg-yellow-500/20 text-yellow-600' :
                                    'bg-pink-500/20 text-pink-600';

                            return (
                                <div key={feature.id} className={cn("border rounded-xl p-6", bgColor)}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn("p-2 rounded-lg", iconBg)}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold">{feature.title}</h3>
                                    </div>
                                    <p className="text-muted-foreground mb-4">
                                        {feature.description.split(feature.price).map((part, idx, arr) =>
                                            idx === arr.length - 1 ? (
                                                <span key={idx}>{part}</span>
                                            ) : (
                                                <span key={idx}>
                                                    {part}
                                                    <strong>{feature.price}</strong>
                                                </span>
                                            )
                                        )}
                                    </p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {feature.bullets.map((bullet, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Aviso de Login */}
                {!user && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
                        <p className="text-muted-foreground mb-4">
                            Faça login para contratar os planos de visibilidade
                        </p>
                        <Link
                            to="/login"
                            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                        >
                            Fazer Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

