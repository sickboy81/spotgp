// Geocoding service using OpenStreetMap Nominatim API
// Free, no API key required, but requires User-Agent header
// Rate limit: 1 request per second

import { BRAZILIAN_CITIES } from '../constants/brazilian-cities';

export interface GeocodeResult {
    lat: number;
    lng: number;
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

/**
 * Wait if necessary to respect rate limiting (1 request per second)
 */
async function waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
}

/**
 * Normalize and clean address parts for geocoding query
 */
function normalizeAddressPart(part: string | undefined | null): string {
    if (!part) return '';
    return part.trim().replace(/\s+/g, ' ');
}

/**
 * Build geocoding query from address parts
 * Order: street_address, neighborhood, address_reference, city, state, Brazil
 */
function buildGeocodeQuery(
    city: string,
    state: string,
    neighborhood?: string,
    streetAddress?: string,
    reference?: string
): string {
    const parts: string[] = [];
    
    // Add street address first if available (most specific)
    if (streetAddress) {
        parts.push(normalizeAddressPart(streetAddress));
    }
    
    // Add neighborhood
    if (neighborhood) {
        parts.push(normalizeAddressPart(neighborhood));
    }
    
    // Add reference (can help with precision)
    if (reference) {
        parts.push(normalizeAddressPart(reference));
    }
    
    // Always include city, state, and Brazil
    parts.push(normalizeAddressPart(city));
    parts.push(normalizeAddressPart(state));
    parts.push('Brazil');
    
    return parts.filter(part => part.length > 0).join(', ');
}

/**
 * Geocode an address using Nominatim API
 * Returns coordinates or throws error
 */
async function geocodeWithNominatim(query: string): Promise<GeocodeResult> {
    await waitForRateLimit();
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`;
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'acompanhantesAGORA/1.0 (contact: admin@acompanhantesagora.com)', // Required by Nominatim
        },
    });
    
    if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No results found for address');
    }
    
    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates returned from geocoding service');
    }
    
    return { lat, lng };
}

/**
 * Reverse geocode coordinates to get city name
 * Uses Nominatim reverse geocoding to identify the actual city at the given coordinates
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; state: string } | null> {
    await waitForRateLimit();
    
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'acompanhantesAGORA/1.0 (contact: admin@acompanhantesagora.com)',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Reverse geocoding request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.address) {
            return null;
        }
        
        const address = data.address;
        
        // Try different possible fields for city name (varies by country/region)
        const cityName = address.city || address.town || address.municipality || address.county || address.state_district || null;
        const stateCode = address.state_code || address.state || null;
        
        // For Brazil, state_code might be in format like "SP" or "São Paulo"
        // Try to normalize it
        let normalizedState = stateCode;
        if (stateCode && stateCode.length > 2) {
            // If it's a full state name, try to match with our state codes
            const stateMap: Record<string, string> = {
                'São Paulo': 'SP',
                'Rio de Janeiro': 'RJ',
                'Minas Gerais': 'MG',
                'Paraná': 'PR',
                'Rio Grande do Sul': 'RS',
                'Bahia': 'BA',
                'Distrito Federal': 'DF',
                'Ceará': 'CE',
                'Pernambuco': 'PE',
                'Santa Catarina': 'SC',
                'Goiás': 'GO',
                'Pará': 'PA',
                'Amazonas': 'AM',
                'Espírito Santo': 'ES',
                'Maranhão': 'MA',
                'Alagoas': 'AL',
                'Piauí': 'PI',
                'Rio Grande do Norte': 'RN',
                'Paraíba': 'PB',
                'Sergipe': 'SE',
                'Mato Grosso': 'MT',
                'Mato Grosso do Sul': 'MS',
                'Rondônia': 'RO',
                'Acre': 'AC',
                'Roraima': 'RR',
                'Amapá': 'AP',
                'Tocantins': 'TO',
            };
            normalizedState = stateMap[stateCode] || stateCode;
        }
        
        if (cityName && normalizedState) {
            return {
                city: cityName,
                state: normalizedState,
            };
        }
        
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

/**
 * Get city coordinates as fallback
 */
function getCityCoordinates(city: string): GeocodeResult | null {
    const cityData = BRAZILIAN_CITIES[city];
    if (cityData) {
        return {
            lat: cityData.lat,
            lng: cityData.lng,
        };
    }
    return null;
}

/**
 * Geocode an address with fallback strategy
 * 
 * Strategy:
 * 1. Try with all address parts (street, neighborhood, reference, city, state)
 * 2. If fails, try without reference
 * 3. If fails, try without street address
 * 4. If fails, try with just neighborhood, city, state
 * 5. If fails, use city coordinates as fallback
 * 
 * @returns Coordinates (either geocoded or city fallback)
 */
export async function geocodeAddress(
    city: string,
    state: string,
    neighborhood?: string,
    streetAddress?: string,
    reference?: string
): Promise<GeocodeResult> {
    if (!city || !state) {
        throw new Error('City and state are required for geocoding');
    }
    
    // Build query with all available parts
    const fullQuery = buildGeocodeQuery(city, state, neighborhood, streetAddress, reference);
    
    try {
        // Try with full address
        return await geocodeWithNominatim(fullQuery);
    } catch (error) {
        console.warn('Geocoding with full address failed, trying with fewer fields:', error);
        
        // Fallback 1: Try without reference
        if (reference) {
            try {
                const queryWithoutRef = buildGeocodeQuery(city, state, neighborhood, streetAddress);
                return await geocodeWithNominatim(queryWithoutRef);
            } catch (error2) {
                console.warn('Geocoding without reference failed:', error2);
            }
        }
        
        // Fallback 2: Try without street address
        if (streetAddress) {
            try {
                const queryWithoutStreet = buildGeocodeQuery(city, state, neighborhood, undefined, reference);
                return await geocodeWithNominatim(queryWithoutStreet);
            } catch (error3) {
                console.warn('Geocoding without street address failed:', error3);
            }
        }
        
        // Fallback 3: Try with just neighborhood, city, state
        if (neighborhood) {
            try {
                const queryMinimal = buildGeocodeQuery(city, state, neighborhood);
                return await geocodeWithNominatim(queryMinimal);
            } catch (error4) {
                console.warn('Geocoding with minimal address failed:', error4);
            }
        }
        
        // Final fallback: Use city coordinates
        const cityCoords = getCityCoordinates(city);
        if (cityCoords) {
            console.warn('Using city coordinates as fallback for geocoding');
            return cityCoords;
        }
        
        // If everything fails, throw error
        throw new Error(`Unable to geocode address for ${city}, ${state} and no city coordinates available`);
    }
}

