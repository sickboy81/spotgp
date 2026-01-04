// Geocoding service using OpenStreetMap Nominatim API
// Free, no API key required, but requires User-Agent header
// Rate limit: 1 request per second

import { BRAZILIAN_CITIES } from '../constants/brazilian-cities';

export interface GeocodeResult {
    lat: number;
    lng: number;
    approximate_address?: string; // Neighborhood, City - State
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
export async function geocodeWithNominatim(query: string): Promise<GeocodeResult> {
    await waitForRateLimit();

    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`;

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

    // Construct approximate address
    let approximate_address = '';
    if (result.address) {
        const addr = result.address;
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || '';
        const city = addr.city || addr.town || addr.municipality || '';
        const state = addr.state_code || addr.state || '';

        const parts = [neighborhood, city, state].filter(p => p && p.length > 0);
        if (parts.length > 0) {
            approximate_address = parts.join(', ');
        }
    }

    return { lat, lng, approximate_address };
}

/**
 * Reverse geocode coordinates to get city name
 * Uses Nominatim reverse geocoding to identify the actual city at the given coordinates
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; state: string } | null> {
    await waitForRateLimit();

    // Use zoom level 18 for city-level accuracy
    // Add more parameters to get better city identification
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=pt-BR,pt,en`;

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
        // Priority order: city > town > municipality > county > village > state_district
        // For Brazil, sometimes the city name comes in different fields
        // Also check "city_district" which can contain the actual city name in some regions
        let cityName = address.city || 
                      address.town || 
                      address.municipality || 
                      address.county || 
                      address.village ||
                      address.city_district ||
                      address.state_district || 
                      null;
        
        // If we got a result but cityName is still null, try to extract from display_name
        if (!cityName && data.display_name) {
            // display_name format: "Street, Neighborhood, City - State, Country"
            const parts = data.display_name.split(',');
            if (parts.length >= 3) {
                // Usually city is the 3rd or 2nd to last part (before state)
                const cityCandidate = parts[parts.length - 3]?.trim();
                if (cityCandidate && cityCandidate.length > 2) {
                    cityName = cityCandidate;
                }
            }
        }
        
        // If city name contains "São" or other common prefixes, try to clean it
        // Sometimes Nominatim returns "São Paulo - SP" or similar
        if (cityName) {
            // Remove state code suffix if present (e.g., "São Paulo - SP" -> "São Paulo")
            cityName = cityName.split(' - ')[0].trim();
            // Remove parentheses content (e.g., "São Paulo (SP)" -> "São Paulo")
            cityName = cityName.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove common suffixes like "Município de" or "Cidade de"
            cityName = cityName.replace(/^(município de|cidade de|municipio de)\s+/i, '').trim();
        }
        
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
        
        // Special handling for major cities where Nominatim might return neighborhoods/districts
        // Check if we're in a major city area but got a neighborhood name instead
        const majorCitiesMap: Record<string, { name: string; state: string; bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number } }> = {
            'RJ': {
                name: 'Rio de Janeiro',
                state: 'RJ',
                bounds: { latMin: -23.1, latMax: -22.7, lngMin: -43.8, lngMax: -43.1 }
            },
            'SP': {
                name: 'São Paulo',
                state: 'SP',
                bounds: { latMin: -23.8, latMax: -23.3, lngMin: -46.8, lngMax: -46.3 }
            },
            'MG': {
                name: 'Belo Horizonte',
                state: 'MG',
                bounds: { latMin: -20.1, latMax: -19.8, lngMin: -44.1, lngMax: -43.8 }
            }
        };
        
        // If we have coordinates and state, check if we're in a major city area
        if (latitude && longitude && normalizedState && majorCitiesMap[normalizedState]) {
            const majorCity = majorCitiesMap[normalizedState];
            const inBounds = latitude >= majorCity.bounds.latMin && 
                           latitude <= majorCity.bounds.latMax &&
                           longitude >= majorCity.bounds.lngMin && 
                           longitude <= majorCity.bounds.lngMax;
            
            // If we're in the bounds of a major city but got a different city name (likely a neighborhood)
            // OR if cityName is null/empty, use the major city
            if (inBounds && (!cityName || cityName.toLowerCase() !== majorCity.name.toLowerCase())) {
                console.log(`Detected location in ${majorCity.name} area, but got "${cityName || 'null'}". Using ${majorCity.name} instead.`);
                cityName = majorCity.name;
            }
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

