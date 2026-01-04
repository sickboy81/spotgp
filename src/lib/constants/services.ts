// Serviços disponíveis para anunciantes
export const GENERAL_SERVICES = [
    'Beijos na boca',
    'Ejaculação corpo',
    'Facial',
    'Fantasias e disfarces',
    'Massagem erótica',
    'Namoradinha',
    'Oral até o final',
    'Oral com camisinha',
    'Oral sem camisinha',
    'PSE',
    'Sexo anal'
] as const;

export const SPECIAL_SERVICES = [
    'Beijo negro',
    'Chuva dourada',
    'Fetichismo',
    'Garganta profunda',
    'Sado duro',
    'Sado suave',
    'Squirting',
    'Strap on'
] as const;

// Array completo de todos os serviços (para filtros e outras funcionalidades)
export const ALL_SERVICES = [...GENERAL_SERVICES, ...SPECIAL_SERVICES] as const;

export type ServiceType = typeof ALL_SERVICES[number];






