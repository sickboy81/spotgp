// Profile options constants
export const HAIR_COLORS = ['Morenas', 'Loiras', 'Ruivas'] as const;
export const BODY_TYPES = ['Gordinhas', 'Magras'] as const;
export const STATURES = ['Altas', 'Mignon'] as const;
export const BREAST_TYPES = ['Peitudas', 'Seios naturais'] as const;
export const PUBIS_TYPES = ['Peludas', 'Pubis depilado'] as const;

// Local de atendimento
export const SERVICE_LOCATIONS = [
    'Em casa',
    'Privê',
    'Eventos e festas',
    'Hotel / Motel',
    'Clubes de Swing',
    'Boate'
] as const;

export type ServiceLocation = typeof SERVICE_LOCATIONS[number];
export const ETHNICITIES = ['Branca', 'Negra', 'Mulata', 'Oriental', 'Latina'] as const;
export const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Crypto'] as const;
export const GENDERS = ['Mulher', 'Trans', 'Homem'] as const;

export type HairColor = typeof HAIR_COLORS[number];
export type BodyType = typeof BODY_TYPES[number];
export type Stature = typeof STATURES[number];
export type BreastType = typeof BREAST_TYPES[number];
export type PubisType = typeof PUBIS_TYPES[number];
export type Ethnicity = typeof ETHNICITIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type Gender = typeof GENDERS[number];


