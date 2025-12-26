// Categorias disponíveis para anunciantes
export const ADVERTISER_CATEGORIES = [
    'Acompanhante',
    'Massagista',
    'Atendimento Online'
] as const;

export type AdvertiserCategory = typeof ADVERTISER_CATEGORIES[number];


