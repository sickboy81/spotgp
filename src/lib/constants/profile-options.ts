// Profile options constants
export const HAIR_COLORS = ['Loira', 'Morena', 'Ruiva', 'Preto', 'Colorido'] as const;
export const BODY_TYPES = ['Magro', 'Mignon', 'Fitness', 'Curvilínea', 'Plus Size'] as const;

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
export type Ethnicity = typeof ETHNICITIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type Gender = typeof GENDERS[number];


