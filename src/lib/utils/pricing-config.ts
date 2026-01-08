// Sistema de configuração de planos e preços
// Armazena configurações em localStorage (será migrado para Supabase em produção)

export interface BoostPlan {
    id: string;
    boostsPerDay: number;
    duration: number;
    totalPrice: number;
    pricePerDay: number;
    recommended?: boolean;
    active?: boolean;
}

export interface PricingSection {
    title: string;
    description: string;
}

export interface ExtraFeature {
    id: string;
    title: string;
    description: string;
    price: string; // Formato: "R$ 5 por dia" ou "50%"
    bullets: string[];
    active: boolean;
    icon: 'multimedia' | 'featured' | 'stories';
}

export interface PricingConfig {
    mainSection: PricingSection;
    categories: string[];
    defaultCity: string;
    plans: BoostPlan[];
    extraFeatures: ExtraFeature[];
}

const DEFAULT_CONFIG: PricingConfig = {
    mainSection: {
        title: 'Subidas Automáticas',
        description: 'Dê mais visibilidade ao seu anúncio, fazendo com que periodicamente suba à primeira posição da lista.'
    },
    categories: [
        'Acompanhantes',
        'Trans',
        'Homens',
        'Massagens Mulheres',
        'Massagens Travestis',
        'Massagens Homens',
        'Videochamadas Mulheres',
        'Videochamadas Travestis',
        'Videochamadas Homens',
    ],
    defaultCity: 'Rio de Janeiro',
    plans: [
        // 6 Subidas
        { id: '6-3', boostsPerDay: 6, duration: 3, totalPrice: 35, pricePerDay: 11.67, recommended: false, active: true },
        { id: '6-7', boostsPerDay: 6, duration: 7, totalPrice: 55, pricePerDay: 7.86, recommended: true, active: true },
        { id: '6-15', boostsPerDay: 6, duration: 15, totalPrice: 85, pricePerDay: 5.67, recommended: false, active: true },
        
        // 12 Subidas
        { id: '12-3', boostsPerDay: 12, duration: 3, totalPrice: 55, pricePerDay: 18.33, recommended: false, active: true },
        { id: '12-7', boostsPerDay: 12, duration: 7, totalPrice: 85, pricePerDay: 12.14, recommended: true, active: true },
        { id: '12-15', boostsPerDay: 12, duration: 15, totalPrice: 130, pricePerDay: 8.67, recommended: false, active: true },
        
        // 24 Subidas
        { id: '24-3', boostsPerDay: 24, duration: 3, totalPrice: 85, pricePerDay: 28.33, recommended: false, active: true },
        { id: '24-7', boostsPerDay: 24, duration: 7, totalPrice: 130, pricePerDay: 18.57, recommended: true, active: true },
        { id: '24-15', boostsPerDay: 24, duration: 15, totalPrice: 195, pricePerDay: 13, recommended: false, active: true },
    ],
    extraFeatures: [
        {
            id: 'multimedia',
            title: 'Multimídia',
            description: 'Por mais R$ 5 por dia você pode fazer com que o seu anúncio mostre mais fotos e vídeos.',
            price: 'R$ 5 por dia',
            bullets: [
                'Cada vídeo pode durar até 1 minuto.',
                'No vídeo só pode aparecer você.'
            ],
            active: true,
            icon: 'multimedia'
        },
        {
            id: 'featured',
            title: 'Destacado',
            description: 'Por mais 50% você pode fazer com que seu anúncio apareça destacado na web.',
            price: '50%',
            bullets: [
                'Nas listas o seu anúncio será mostrado com o fundo ressaltado em um amarelo chamativo e mostrando uma estrela.',
                'Também será incluído de forma rotativa em outros anúncios da mesma cidade.'
            ],
            active: true,
            icon: 'featured'
        },
        {
            id: 'stories',
            title: 'Histórias TOP',
            description: 'Por 50% a mais, você poderá gravar a sua História cada dia em um vídeo.',
            price: '50% a mais',
            bullets: [
                'O vídeo será mostrado como capa do seu anúncio nas listas da sua cidade.',
                'Além disso, será mostrado durante esse tempo alternando junto com outras Histórias na Seção TOP de Rio de Janeiro.',
                'Cada vídeo pode durar até 15 segundos.',
                'O vídeo deve ser tipo selfie e você deverá gravá-lo diretamente através do seu painel de controle.',
                'Você não pode gravar uma tela em que outro vídeo esteja sendo reproduzido.'
            ],
            active: true,
            icon: 'stories'
        }
    ]
};

const STORAGE_KEY = 'pricing_config';

export function getPricingConfig(): PricingConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de preços:', error);
    }
    return DEFAULT_CONFIG;
}

export function savePricingConfig(config: PricingConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
        console.error('Erro ao salvar configuração de preços:', error);
    }
}

export function resetPricingConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// Funções auxiliares
export function getActivePlans(): BoostPlan[] {
    const config = getPricingConfig();
    return config.plans.filter(p => p.active);
}

export function getRecommendedPlans(): BoostPlan[] {
    const config = getPricingConfig();
    return config.plans.filter(p => p.active && p.recommended);
}







