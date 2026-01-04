export const ONLINE_SERVICES = [
    'Videochamadas',
    'Sexting',
    'Ligação prévia',
    'Mostram o rosto',
    'Cara a cara'
] as const;

export const ONLINE_SERVICE_TO = [
    'Homens',
    'Mulheres',
    'Casais'
] as const;

export const VIRTUAL_FANTASIES = [
    'Roupa íntima',
    'Striptease',
    'Falar sujo',
    'Jogos de papéis',
    'Disfarces',
    'Jogos',
    'Fetiches',
    'Avaliar seu pênis',
    'Masturbação',
    'Squirting',
    'Sexo oral',
    'Penetração',
    'Sexo anal',
    'Chuva dourada',
    'Dominação'
] as const;

export const FOR_SALE = [
    'Áudios',
    'Pacote de Fotos',
    'Pacote de Vídeos',
    'Vídeos personalizados',
    'Roupa íntima'
] as const;

export type OnlineService = typeof ONLINE_SERVICES[number];
export type OnlineServiceTo = typeof ONLINE_SERVICE_TO[number];
export type VirtualFantasy = typeof VIRTUAL_FANTASIES[number];
export type ForSaleItem = typeof FOR_SALE[number];
