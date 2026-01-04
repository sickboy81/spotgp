// Opções específicas para massagistas

export const MASSAGE_TYPES = [
    'Terapêuticas',
    'Relaxantes',
    'Sensoriais',
    'Corpo a corpo',
    'Tântricas',
    'Prostática',
    'Tailandesa'
] as const;

export const OTHER_SERVICES = [
    'Depilação',
    'Estética',
    'Reflexologia podal'
] as const;

export const HAPPY_ENDING = [
    'Masturbação',
    'Sexo oral',
    'Penetração'
] as const;

export const FACILITIES = [
    'Com local',
    'Ducha',
    'Maca',
    'Tatami',
    'Óleos essenciais',
    'Música relaxante',
    'Material descartável'
] as const;

export const SERVICE_TO = [
    'Homens',
    'Mulheres',
    'Casais',
    'Deficientes físicos'
] as const;

export type MassageType = typeof MASSAGE_TYPES[number];
export type OtherService = typeof OTHER_SERVICES[number];
export type HappyEnding = typeof HAPPY_ENDING[number];
export type Facility = typeof FACILITIES[number];
export type ServiceTo = typeof SERVICE_TO[number];


