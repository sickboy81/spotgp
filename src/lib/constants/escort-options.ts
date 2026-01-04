// Opções específicas para acompanhantes

export const ESCORT_SERVICES = [
    'Beijos na boca',
    'Ejaculação corpo',
    'Fantasias e disfarces',
    'Gozo facial',
    'Massagem erótica',
    'Namoradinha',
    'PSE',
    'Sexo anal'
] as const;

export const ESCORT_SPECIAL_SERVICES = [
    'Beijo negro',
    'Chuva dourada',
    'Fetichismo',
    'Garganta profunda',
    'Sado duro',
    'Sado suave',
    'Squirting',
    'Strap on'
] as const;

export const ORAL_SEX_OPTIONS = [
    'Com preservativo',
    'Sem preservativo',
    'A combinar'
] as const;

export type EscortService = typeof ESCORT_SERVICES[number];
export type EscortSpecialService = typeof ESCORT_SPECIAL_SERVICES[number];
export type OralSexOption = typeof ORAL_SEX_OPTIONS[number];
