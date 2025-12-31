import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, Sparkles, User, Wallet, Check, CheckCircle, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SERVICES } from '@/lib/constants/services';

import { SERVICE_TO } from '@/lib/constants/massage-options';
import { SERVICE_LOCATIONS } from '@/lib/constants/profile-options';

interface FilterSidebarProps {
    className?: string;
    onFilterChange: (filters: FilterState) => void;
    activeFilters: FilterState;
    onClose?: () => void;
}

export interface FilterState {
    city: string;
    state: string;
    neighborhood: string; // Added
    gender: string[]; // Added
    priceMin: number | '';
    priceMax: number | '';
    ageRange: [number, number];
    hairColor: string[];
    bodyType: string[];
    ethnicity: string[];
    services: string[];
    paymentMethods: string[];
    serviceTo: string[]; // Added - Serviços para
    serviceLocations: string[]; // Added - Local de atendimento
    hasPlace: boolean | null;
    videoCall: boolean | null;
    verifiedOnly: boolean;
    // Categories for header alignment
    category: string | null;
    keyword: string; // Added
}

const INITIAL_FILTERS: FilterState = {
    city: '',
    state: '',
    neighborhood: '',
    gender: [],
    priceMin: '',
    priceMax: '',
    ageRange: [18, 60],
    hairColor: [],
    bodyType: [],
    ethnicity: [], // Added
    services: [],
    paymentMethods: [],
    serviceTo: [], // Added
    serviceLocations: [], // Added
    hasPlace: null,
    videoCall: null,
    verifiedOnly: false,
    category: null,
    keyword: '',
};

// Generate locations from BRAZILIAN_CITIES for complete coverage


const HAIR_COLORS = ['Loira', 'Morena', 'Ruiva', 'Preto', 'Colorido'];
const BODY_TYPES = ['Magro', 'Mignon', 'Fitness', 'Curvilínea', 'Plus Size'];
const ETHNICITIES = ['Branca', 'Negra', 'Mulata', 'Oriental', 'Latina'];
const PAYMENTS = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Crypto'];
const SERVICES = [...ALL_SERVICES];

export function FilterSidebar({ className, onFilterChange, activeFilters, onClose }: FilterSidebarProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(activeFilters);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        price: true,
        appearance: false,
        services: false,
        content: false
    });

    // Sync active filters from parent
    useEffect(() => {
        setLocalFilters(activeFilters);
    }, [activeFilters]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleFilterUpdate = (newFilters: Partial<FilterState>) => {
        const updated = { ...localFilters, ...newFilters };
        setLocalFilters(updated);
        // Don't apply immediately - wait for "Aplicar" button
    };

    const handleApply = () => {
        onFilterChange(localFilters);
        if (onClose) {
            onClose();
        }
    };

    const toggleArrayItem = (field: keyof FilterState, value: string) => {
        const current = localFilters[field] as string[];
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        handleFilterUpdate({ [field]: updated });
    };

    return (
        <aside className={cn("w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden", className)}>
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-foreground">
                    <Filter className="w-4 h-4 text-primary" />
                    Filtros Avançados
                </h3>
                <button
                    onClick={() => {
                        setLocalFilters(INITIAL_FILTERS);
                        onFilterChange(INITIAL_FILTERS);
                        if (onClose) {
                            onClose();
                        }
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                    Limpar tudo
                </button>
            </div>

            <div className="divide-y divide-border">
                {/* 1. Quick Toggles */}
                <div className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleFilterUpdate({ verifiedOnly: !localFilters.verifiedOnly })}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                                localFilters.verifiedOnly
                                    ? "bg-blue-500/10 border-blue-500 text-blue-500"
                                    : "bg-background border-input text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            {localFilters.verifiedOnly && <Check className="w-3 h-3" />} Verificadas
                        </button>
                        <button
                            onClick={() => handleFilterUpdate({ hasPlace: localFilters.hasPlace === true ? null : true })}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                                localFilters.hasPlace === true
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-background border-input text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            Com Local
                        </button>
                        <button
                            onClick={() => handleFilterUpdate({ videoCall: localFilters.videoCall === true ? null : true })}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                                localFilters.videoCall === true
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-background border-input text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            Videochamada
                        </button>
                    </div>
                </div>

                {/* 2. Price Range */}
                <div className="p-4">
                    <button
                        onClick={() => toggleSection('price')}
                        className="flex justify-between items-center w-full text-sm font-semibold mb-2"
                    >
                        <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-muted-foreground" /> Valor / Pagamento</span>
                        {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedSections.price && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-2">
                                    Valor: <span className="text-foreground font-bold">
                                        {localFilters.priceMin ? `R$ ${localFilters.priceMin}` : 'Qualquer'} - {localFilters.priceMax ? `R$ ${localFilters.priceMax}` : 'Qualquer'}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-muted-foreground block mb-1">Mínimo (R$)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            placeholder="Qualquer"
                                            value={localFilters.priceMin === '' ? '' : localFilters.priceMin}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue = value === '' ? '' : Number(value);
                                                if (numValue === '' || (typeof numValue === 'number' && numValue >= 0)) {
                                                    handleFilterUpdate({
                                                        priceMin: numValue,
                                                        priceMax: (typeof numValue === 'number' && localFilters.priceMax !== '' && numValue > localFilters.priceMax)
                                                            ? ''
                                                            : localFilters.priceMax
                                                    });
                                                }
                                            }}
                                            className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted-foreground block mb-1">Máximo (R$)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            placeholder="Qualquer"
                                            value={localFilters.priceMax === '' ? '' : localFilters.priceMax}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue = value === '' ? '' : Number(value);
                                                if (numValue === '' || (typeof numValue === 'number' && numValue >= 0)) {
                                                    handleFilterUpdate({
                                                        priceMax: numValue,
                                                        priceMin: (typeof numValue === 'number' && localFilters.priceMin !== '' && numValue < localFilters.priceMin)
                                                            ? ''
                                                            : localFilters.priceMin
                                                    });
                                                }
                                            }}
                                            className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Métodos de Pagamento</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PAYMENTS.map(method => (
                                        <button
                                            key={method}
                                            onClick={() => toggleArrayItem('paymentMethods', method)}
                                            className={cn(
                                                "text-[10px] px-2.5 py-1 rounded-md border transition-all",
                                                localFilters.paymentMethods.includes(method)
                                                    ? "bg-foreground text-background border-foreground font-medium"
                                                    : "bg-background border-input text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2.5. Age Range */}
                <div className="p-4">
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Idade
                        </label>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-2">
                                Idade: <span className="text-foreground font-bold">{localFilters.ageRange[0]} - {localFilters.ageRange[1]} anos</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-muted-foreground block mb-1">De</label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="80"
                                        value={localFilters.ageRange[0]}
                                        onChange={(e) => {
                                            const newMin = Math.max(18, Math.min(Number(e.target.value), localFilters.ageRange[1] - 1));
                                            handleFilterUpdate({ ageRange: [newMin, localFilters.ageRange[1]] });
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground block mb-1">Até</label>
                                    <input
                                        type="number"
                                        min={localFilters.ageRange[0] + 1}
                                        max="80"
                                        value={localFilters.ageRange[1]}
                                        onChange={(e) => {
                                            const newMax = Math.min(80, Math.max(Number(e.target.value), localFilters.ageRange[0] + 1));
                                            handleFilterUpdate({ ageRange: [localFilters.ageRange[0], newMax] });
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Appearance */}
                <div className="p-4">
                    <button
                        onClick={() => toggleSection('appearance')}
                        className="flex justify-between items-center w-full text-sm font-semibold mb-2"
                    >
                        <span className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Aparência</span>
                        {expandedSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedSections.appearance && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                            {/* Hair */}
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Cor do Cabelo</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {HAIR_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => toggleArrayItem('hairColor', color)}
                                            className={cn(
                                                "text-[10px] px-2.5 py-1 rounded-md border transition-all",
                                                localFilters.hairColor.includes(color)
                                                    ? "bg-foreground text-background border-foreground font-medium"
                                                    : "bg-background border-input text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Tipo Físico</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {BODY_TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => toggleArrayItem('bodyType', type)}
                                            className={cn(
                                                "text-[10px] px-2.5 py-1 rounded-md border transition-all",
                                                localFilters.bodyType.includes(type)
                                                    ? "bg-foreground text-background border-foreground font-medium"
                                                    : "bg-background border-input text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ethnicity */}
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Etnia</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {ETHNICITIES.map(eth => (
                                        <button
                                            key={eth}
                                            onClick={() => toggleArrayItem('ethnicity', eth)}
                                            className={cn(
                                                "text-[10px] px-2.5 py-1 rounded-md border transition-all",
                                                localFilters.ethnicity.includes(eth)
                                                    ? "bg-foreground text-background border-foreground font-medium"
                                                    : "bg-background border-input text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {eth}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Services */}
                <div className="p-4">
                    <button
                        onClick={() => toggleSection('services')}
                        className="flex justify-between items-center w-full text-sm font-semibold mb-2"
                    >
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-muted-foreground" /> Serviços</span>
                        {expandedSections.services ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedSections.services && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-wrap gap-1.5">
                                {SERVICES.map(service => (
                                    <button
                                        key={service}
                                        onClick={() => toggleArrayItem('services', service)}
                                        className={cn(
                                            "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                                            localFilters.services.includes(service)
                                                ? "bg-primary/10 border-primary text-primary font-medium"
                                                : "bg-background border-input text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {service}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Serviços para */}
                <div className="p-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Serviços para
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {SERVICE_TO.map(option => (
                                <button
                                    key={option}
                                    onClick={() => toggleArrayItem('serviceTo', option)}
                                    className={cn(
                                        "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                                        localFilters.serviceTo.includes(option)
                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                            : "bg-background border-input text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Local de Atendimento */}
                <div className="p-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <Home className="w-3.5 h-3.5" /> Local de Atendimento
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {SERVICE_LOCATIONS.map(location => (
                                <button
                                    key={location}
                                    onClick={() => toggleArrayItem('serviceLocations', location)}
                                    className={cn(
                                        "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                                        localFilters.serviceLocations.includes(location)
                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                            : "bg-background border-input text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {location}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Button */}
            <div className="p-4 border-t border-border bg-muted/30">
                <button
                    onClick={handleApply}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle className="w-4 h-4" />
                    Aplicar Filtros
                </button>
            </div>
        </aside>
    );
}
