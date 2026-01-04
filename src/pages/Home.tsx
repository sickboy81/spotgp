import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { MapPin, Filter, Search, Heart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, normalizeString } from '@/lib/utils';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { FilterSidebar, FilterState } from '@/components/features/filters/FilterSidebar';
import { BRAZILIAN_CITIES } from '@/lib/constants/brazilian-cities';
import { NEIGHBORHOODS_BY_CITY } from '@/lib/constants/neighborhoods';
import { reverseGeocode } from '@/lib/services/geocoding';
import { LazyImage } from '@/components/features/media/LazyImage';
import { getCurrentOnlineStatus, ProfileData } from '@/lib/api/profile';
import { sanitizeInput } from '@/lib/utils/validation';

export default function Home() {
    const observerTarget = useRef(null);

    // Filters State
    const [isLocating, setIsLocating] = useState(false);
    const [isLocationActive, setIsLocationActive] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [maxDistance, setMaxDistance] = useState<number>(30); // Distância máxima em km (padrão 30km)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Autocomplete State
    const [citySearch, setCitySearch] = useState('');
    const [isCityListOpen, setIsCityListOpen] = useState(false);

    // Advanced Filters State
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        city: '',
        state: '',
        neighborhood: '',
        gender: [],
        priceMin: '',
        priceMax: '',
        ageRange: [18, 60],
        hairColor: [],
        bodyType: [],
        ethnicity: [], // Added
        services: [],
        paymentMethods: [],
        serviceTo: [],
        serviceLocations: [],
        hasPlace: null,
        videoCall: null,
        verifiedOnly: false,
        category: null,
        keyword: '',
    });

    // Sync input with external filter changes (e.g. geolocation)
    useEffect(() => {
        if (activeFilters.city) {
            setCitySearch(activeFilters.city);
        } else if (!activeFilters.city && citySearch !== '') {
            if (!isCityListOpen) setCitySearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilters.city]);

    // Supported Cities
    // Sort alphabetiacally for the dropdown
    const SORTED_CITIES = Object.keys(BRAZILIAN_CITIES).sort();

    // Haversine Formula for distance
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const handleGeolocation = useCallback(() => {
        // Toggle off if already active
        if (isLocationActive) {
            setIsLocationActive(false);
            setUserLocation(null);
            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' })); // Clear all location
            return;
        }

        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // First, check if user is within a major city's area by coordinates
                // This catches cases where Nominatim returns neighborhoods instead of the main city
                let identifiedCity: string | null = null;
                let identifiedState: string | null = null;
                
                // Check coordinates against capitals and major cities first
                // Use larger radius for major cities (50km) to catch all neighborhoods
                const majorCities = Object.entries(BRAZILIAN_CITIES)
                    .filter(([_, coords]) => coords.capital) // Only capitals first
                    .map(([name, coords]) => ({ name, ...coords }));
                
                // Sort by distance to find the closest capital
                const distancesToCapitals = majorCities.map(city => ({
                    ...city,
                    distance: getDistance(latitude, longitude, city.lat, city.lng)
                })).sort((a, b) => a.distance - b.distance);
                
                // Use larger radius for major capitals (70km covers entire metropolitan areas)
                // This ensures we catch all neighborhoods within the city
                const radiusForCapitals = 70;
                
                if (distancesToCapitals.length > 0 && distancesToCapitals[0].distance < radiusForCapitals) {
                    identifiedCity = distancesToCapitals[0].name;
                    identifiedState = distancesToCapitals[0].state;
                    // Pre-fill city in the input field
                    setCitySearch(identifiedCity);
                    console.log(`Detected location within ${identifiedCity} area (${distancesToCapitals[0].distance.toFixed(1)}km from center) - will show in city field`);
                }

                // If not found by coordinates, try reverse geocoding
                if (!identifiedCity) {
                    try {
                        const reverseResult = await reverseGeocode(latitude, longitude);
                        if (reverseResult) {
                            identifiedCity = reverseResult.city;
                            identifiedState = reverseResult.state;
                        }
                    } catch (error) {
                        console.warn('Reverse geocoding failed:', error);
                    }
                } else {
                    // We found city by coordinates, but let's also try reverse geocoding to confirm
                    try {
                        const reverseResult = await reverseGeocode(latitude, longitude);
                        if (reverseResult) {
                            // If reverse geocoding also identifies the same city or a close match, use it
                            const reverseCity = reverseResult.city;
                            const normalizedReverse = normalizeString(reverseCity);
                            const normalizedIdentified = normalizeString(identifiedCity);
                            
                            // If they match or reverse geocoding found the same city, trust it
                            if (normalizedReverse === normalizedIdentified || 
                                normalizedReverse.includes(normalizedIdentified) ||
                                normalizedIdentified.includes(normalizedReverse)) {
                                identifiedCity = reverseCity; // Use the exact name from reverse geocoding
                                identifiedState = reverseResult.state;
                                console.log(`Reverse geocoding confirmed: ${identifiedCity}`);
                            } else {
                                // Reverse geocoding found something different, but we're in a major city area
                                // Trust the coordinate-based detection for major cities
                                // But still show the identified city in the field
                                setCitySearch(identifiedCity);
                                console.log(`Reverse geocoding found "${reverseCity}" but coordinates indicate "${identifiedCity}". Using coordinate-based detection.`);
                            }
                        }
                    } catch (error) {
                        console.warn('Reverse geocoding confirmation failed, using coordinate-based detection:', error);
                    }
                }

                // Now process the identified city
                if (identifiedCity && identifiedState) {

                        // Check if the identified city is in our supported cities list
                        // Try exact match first
                        let matchedCity: string | undefined = undefined;
                        
                        if (BRAZILIAN_CITIES[identifiedCity]) {
                            matchedCity = identifiedCity;
                        } else {
                            // Try case-insensitive match
                            const cityKeys = Object.keys(BRAZILIAN_CITIES);
                            matchedCity = cityKeys.find(city =>
                                city.toLowerCase() === identifiedCity!.toLowerCase()
                            );

                            // If not found, try normalized match (without accents)
                            if (!matchedCity) {
                                const normalizedIdentified = normalizeString(identifiedCity!);
                                matchedCity = cityKeys.find(city => {
                                    const normalizedCity = normalizeString(city);
                                    return normalizedCity === normalizedIdentified;
                                });
                            }

                            // If still not found, try partial match (contains)
                            if (!matchedCity) {
                                const normalizedIdentified = normalizeString(identifiedCity!);
                                matchedCity = cityKeys.find(city => {
                                    const normalizedCity = normalizeString(city);
                                    return normalizedCity.includes(normalizedIdentified) || 
                                           normalizedIdentified.includes(normalizedCity);
                                });
                            }
                        }

                        if (matchedCity) {
                            // Trust the reverse geocoding result - it tells us the actual city where user is
                            // Validate distance only to catch obvious errors (e.g., > 100km difference)
                            const cityCoords = BRAZILIAN_CITIES[matchedCity];
                            const distanceToCity = getDistance(latitude, longitude, cityCoords.lat, cityCoords.lng);
                            
                            // Only reject if the distance is clearly wrong (> 100km)
                            // This allows for cities with large areas or imprecise coordinates
                            if (distanceToCity < 100) {
                                // Set city in the input field for display, but don't use it as filter
                                // Filter will be by distance only
                                setIsLocationActive(true);
                                setUserLocation({ lat: latitude, lng: longitude });
                                setCitySearch(matchedCity); // Show city in the input field
                                // Don't set city in activeFilters - we filter by distance, not city
                                setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                                console.log(`Geolocation active: showing people within ${maxDistance}km of ${matchedCity}`);
                                setIsLocating(false);
                                return;
                            } else {
                                console.warn(`City "${matchedCity}" from reverse geocoding seems incorrect (${distanceToCity.toFixed(1)}km away), will try to find better match`);
                                // Keep the identified city name for reference, but continue to find better match
                            }
                        } else {
                            // City not found in our list, but we know the state
                            // Try to find cities in the same state that are close
                            console.warn(`City "${identifiedCity}" from reverse geocoding not in supported list, but state is ${identifiedState}`);
                            
                            // If we have the state, try to find the closest city in that state
                            if (identifiedState) {
                                let closestInState = '';
                                let minDistInState = Infinity;
                                
                                Object.entries(BRAZILIAN_CITIES).forEach(([city, coords]) => {
                                    if (coords.state === identifiedState) {
                                        const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
                                        if (dist < minDistInState) {
                                            minDistInState = dist;
                                            closestInState = city;
                                        }
                                    }
                                });
                                
                                // If found a city in the same state within reasonable distance (< 50km), use it
                                // But don't filter by city - use distance instead
                                if (closestInState && minDistInState < 50) {
                                    setIsLocationActive(true);
                                    setUserLocation({ lat: latitude, lng: longitude });
                                    // Clear city filter to show all people within maxDistance
                                    setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                                    console.log(`Geolocation active: showing people within ${maxDistance}km (near ${closestInState})`);
                                    setIsLocating(false);
                                    return;
                                }
                            }
                        }
                    }

                // LAST RESORT: Show options including the actual identified city
                // Build a list that includes the actual city (even if not in our list) + nearby supported cities
                console.warn('Reverse geocoding identified a city not in supported list. Showing options.');
                
                let closestCity = '';
                let minDistance = Infinity;
                let closestCityInState = '';
                let minDistanceInState = Infinity;
                const nearbyCities: Array<{ city: string; distance: number; state: string; isActualCity?: boolean }> = [];

                // FIRST: Add the actual identified city as the primary option (distance = 0, it's where user is!)
                if (identifiedCity && identifiedState) {
                    nearbyCities.push({ 
                        city: identifiedCity, 
                        distance: 0, 
                        state: identifiedState,
                        isActualCity: true 
                    });
                }

                // THEN: Find nearby supported cities
                Object.entries(BRAZILIAN_CITIES).forEach(([city, coords]) => {
                    const rawDistance = getDistance(latitude, longitude, coords.lat, coords.lng);

                    // If we have a state from reverse geocoding, prioritize cities in that state
                    if (identifiedState && coords.state === identifiedState) {
                        if (rawDistance < minDistanceInState) {
                            minDistanceInState = rawDistance;
                            closestCityInState = city;
                        }
                    }

                    // Track overall closest city
                    if (rawDistance < minDistance) {
                        minDistance = rawDistance;
                        closestCity = city;
                    }

                    // Collect nearby cities within 50km for comparison
                    if (rawDistance < 50) {
                        nearbyCities.push({ city, distance: rawDistance, state: coords.state });
                    }
                });

                // Sort nearby cities by distance (actual city will be first with distance 0)
                nearbyCities.sort((a, b) => {
                    // Actual city always first
                    if (a.isActualCity) return -1;
                    if (b.isActualCity) return 1;
                    return a.distance - b.distance;
                });

                const suggestedCity = identifiedCity || closestCityInState || closestCity;

                // Build message showing actual city first, then nearby options
                let message = '';
                
                if (identifiedCity) {
                    message = `✅ CIDADE IDENTIFICADA: ${identifiedCity} - ${identifiedState}\n\n`;
                    message += `📍 Esta é a cidade onde você está localizado.\n\n`;
                    
                    if (nearbyCities.length > 1) {
                        // Filter out the actual city from the list for display (it's already mentioned)
                        const otherCities = nearbyCities.filter(c => !c.isActualCity).slice(0, 4);
                        if (otherCities.length > 0) {
                            const citiesList = otherCities.map(c => 
                                `• ${c.city} (${c.distance.toFixed(1)}km de distância)`
                            ).join('\n');
                            message += `Cidades próximas na nossa lista:\n${citiesList}\n\n`;
                        }
                    }
                    
                    message += `Deseja usar "${identifiedCity}" (sua cidade atual)?\n\n`;
                    message += `• SIM = Usar ${identifiedCity}\n`;
                    message += `• NÃO = Escolher uma cidade próxima da lista`;
                } else {
                    message = `Não foi possível identificar sua cidade automaticamente.\n\n`;
                    
                    if (nearbyCities.length > 0) {
                        const citiesList = nearbyCities.slice(0, 5).map(c => 
                            `• ${c.city} (${c.distance.toFixed(1)}km)`
                        ).join('\n');
                        message += `Cidades próximas encontradas:\n${citiesList}\n\n`;
                        message += `Por favor, selecione manualmente a cidade correta.`;
                    } else {
                        message += 'Não foi possível encontrar nenhuma cidade próxima. Por favor, selecione sua cidade manualmente.';
                    }
                }
                
                // If we have the actual city, try to use it directly (even if not in list)
                if (identifiedCity && identifiedState) {
                    // Allow using the actual city even if not in our supported list
                    // The filter will work with the city name and state
                    const useActualCity = confirm(message);
                    
                    if (useActualCity) {
                        // Show city in the input field, but filter by distance only
                        setIsLocationActive(true);
                        setUserLocation({ lat: latitude, lng: longitude });
                        setCitySearch(identifiedCity); // Show city in the input field
                        // Don't set city in activeFilters - we filter by distance, not city
                        setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                        console.log(`Geolocation active: showing people within ${maxDistance}km of ${identifiedCity}`);
                        setIsLocating(false);
                        return;
                    } else {
                        // User wants to choose a nearby city instead
                        // Show list again with just nearby cities
                        const nearbyOnly = nearbyCities.filter(c => !c.isActualCity).slice(0, 5);
                        if (nearbyOnly.length > 0) {
                            const citiesList = nearbyOnly.map((c, idx) => 
                                `${idx + 1}. ${c.city} - ${c.state} (${c.distance.toFixed(1)}km)`
                            ).join('\n');
                            const choice = prompt(`Escolha uma das cidades próximas:\n\n${citiesList}\n\nDigite o número da cidade (1-${nearbyOnly.length}):`);
                            const choiceNum = parseInt(choice || '0');
                            
                            if (choiceNum > 0 && choiceNum <= nearbyOnly.length) {
                                const selectedCity = nearbyOnly[choiceNum - 1];
                                // Show city in the input field, but filter by distance only
                                setIsLocationActive(true);
                                setUserLocation({ lat: latitude, lng: longitude });
                                setCitySearch(selectedCity.city); // Show city in the input field
                                // Don't set city in activeFilters - we filter by distance, not city
                                setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                                console.log(`Geolocation active: showing people within ${maxDistance}km (near ${selectedCity.city})`);
                                setIsLocating(false);
                                return;
                            }
                        }
                    }
                } else {
                    // No identified city, just show nearby options
                    const confirmed = suggestedCity ? confirm(message) : false;
                    
                    if (confirmed && suggestedCity) {
                        // Show city in the input field, but filter by distance only
                        setIsLocationActive(true);
                        setUserLocation({ lat: latitude, lng: longitude });
                        setCitySearch(suggestedCity); // Show city in the input field
                        // Don't set city in activeFilters - we filter by distance, not city
                        setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                        console.log(`Geolocation active: showing people within ${maxDistance}km (near ${suggestedCity})`);
                    }
                }
                
                setIsLocating(false);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                setIsLocationActive(false);
            }
        );
    }, [isLocationActive]);

    // Legacy favorites state
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('spotgp_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // React Query for Infinite Scroll & Caching
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['profiles', 'advertiser'],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                // Fetch profiles with pagination
                // Filter by role='advertiser'
                const profiles = await directus.request(readItems('profiles', {
                    sort: ['-date_created'],
                    limit: 12,
                    page: pageParam
                }));

                // const totalItems = 100; // Directus doesn't return total in basic readItems unless customized or aggregated. Assuming infinite scroll, we can try to fetch until empty.
                // Assuming standard directus behaviour, if we get fewer items than limit, it's the last page.

                if (profiles.length === 0 && pageParam === 1) {
                    throw new Error("No data in DB, using mocks");
                }

                // Fetch Media for these profiles
                const profileIds = profiles.map((p: any) => p.id).filter(Boolean);
                const mediaMap: Record<string, any[]> = {};

                if (profileIds.length > 0) {
                    try {
                        const mediaList = await directus.request(readItems('media', {
                            filter: { profile_id: { _in: profileIds } }
                        }));

                        // Group by profile_id
                        mediaList.forEach((m: any) => {
                            if (!mediaMap[m.profile_id]) mediaMap[m.profile_id] = [];
                            mediaMap[m.profile_id].push({
                                type: m.type || 'image',
                                url: `${import.meta.env.VITE_DIRECTUS_URL}/assets/${m.file}`
                            });
                        });
                    } catch (e) {
                        console.warn("Failed to fetch media list", e);
                    }
                }

                // Attach media to profiles
                const profilesWithMedia = profiles.map((p: any) => {
                    let media = mediaMap[p.id] || [];

                    // Also merge with 'photos' field if available (New system)
                    if (p.photos && Array.isArray(p.photos)) {
                        const photoUrls = p.photos.map((url: string) => ({
                            type: 'image',
                            url: url.startsWith('http') ? url : `${import.meta.env.VITE_DIRECTUS_URL}/assets/${url}`
                        }));
                        // Add to beginning to prioritize new system
                        media = [...photoUrls, ...media];
                    } else if (typeof p.photos === 'string') {
                        try {
                            const parsed = JSON.parse(p.photos);
                            if (Array.isArray(parsed)) {
                                const photoUrls = parsed.map((url: string) => ({
                                    type: 'image',
                                    url: url.startsWith('http') ? url : `${import.meta.env.VITE_DIRECTUS_URL}/assets/${url}`
                                }));
                                media = [...photoUrls, ...media];
                            }
                        } catch (e) {
                            // Ignore parse error
                        }
                    }

                    return { ...p, media };
                });

                const hasMore = profiles.length === 12; // Approximation

                return {
                    items: profilesWithMedia,
                    page: pageParam,
                    totalPages: hasMore ? pageParam + 1 : pageParam // Just to keep React Query happy with basic logic
                };

            } catch (err: any) {
                // Silently fallback to mock data
                const isPlaceholderError = err?.message?.includes('Failed to fetch') ||
                    err?.code === 'ERR_NAME_NOT_RESOLVED';
                if (!isPlaceholderError && err.message !== "No data in DB, using mocks") {
                    console.log("Fetching error, using MOCK_PROFILES", err);
                }

                // FALLBACK: Simulate paginated mock data
                await new Promise(r => setTimeout(r, 800));

                if (pageParam > 5) return { items: [], page: pageParam, totalPages: 5 };

                // Return mocks with slightly randomized IDs for React keys
                const mockItems = MOCK_PROFILES.map(p => ({
                    ...p,
                    reactKey: `${p.id}-${pageParam}-${Math.random().toString(36).substr(2, 9)}`
                }));

                return {
                    items: mockItems,
                    page: pageParam,
                    totalPages: 5
                };
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            if (!lastPage || lastPage.items.length < 12) return undefined; // Stop if last page wasn't full
            return lastPage.page + 1;
        },
        staleTime: 1000 * 60 * 5,
    });

    const profiles = useMemo(() => data ? data.pages.flatMap((p: any) => p.items) : [], [data]);

    // Apply Advanced Filters locally (unchanged logic mostly)
    const filteredProfiles = useMemo(() => {
        let result = [...profiles];

        const isOnlineService = (p: any) => {
            return p.category === 'Atendimento Online';
        };

        // 0. Keyword Search (Global)
        if (activeFilters.keyword) {
            const lowerTerm = activeFilters.keyword.toLowerCase();
            result = result.filter(p => {
                const name = p.display_name?.toLowerCase() || '';
                const desc = p.bio?.toLowerCase() || '';
                const services = p.services?.join(' ').toLowerCase() || '';
                return name.includes(lowerTerm) || desc.includes(lowerTerm) || services.includes(lowerTerm);
            });
        }

        // 0. Category
        if (activeFilters.category) {
            result = result.filter(p => p.category === activeFilters.category);
        }

        // 1. Location
        // IMPORTANTE: Se geolocalização está ativa, NÃO filtrar por cidade/estado
        // Apenas usar distância para mostrar pessoas próximas
        if (!isLocationActive) {
            if (activeFilters.state) {
                const normalizedState = normalizeString(activeFilters.state);
                result = result.filter(p => {
                    if (isOnlineService(p)) return true;
                    const profileState = normalizeString((p as any).state || '');
                    return profileState === normalizedState;
                });
            }
            if (activeFilters.city) {
                const normalizedCity = normalizeString(activeFilters.city);
                result = result.filter(p => {
                    if (isOnlineService(p)) return true;
                    const profileCity = normalizeString((p as any).city || '');
                    return profileCity === normalizedCity || profileCity.includes(normalizedCity) || normalizedCity.includes(profileCity);
                });
            }
            if (activeFilters.neighborhood) {
                const normalizedNeighborhood = normalizeString(activeFilters.neighborhood);
                result = result.filter(p => {
                    if (isOnlineService(p)) return true;
                    const profileNeighborhood = normalizeString((p as any).neighborhood || '');
                    return profileNeighborhood === normalizedNeighborhood ||
                        profileNeighborhood.includes(normalizedNeighborhood) ||
                        normalizedNeighborhood.includes(profileNeighborhood);
                });
            }
        }

        // 1.5 Gender
        if (activeFilters.gender && activeFilters.gender.length > 0) {
            result = result.filter(p => activeFilters.gender?.includes(p.gender || ''));
        }

        // 1.6 Distance
        if (isLocationActive && userLocation && maxDistance) {
            result = result.filter(p => {
                if (isOnlineService(p)) return true;
                if (!p.city) return false;

                let distance: number | null = null;
                if (p.latitude && p.longitude) {
                    distance = getDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
                } else {
                    const cityCoords = BRAZILIAN_CITIES[p.city as keyof typeof BRAZILIAN_CITIES];
                    if (cityCoords) {
                        distance = getDistance(userLocation.lat, userLocation.lng, cityCoords.lat, cityCoords.lng);
                    }
                }
                return distance !== null && distance <= maxDistance;
            });
        }

        // 2. Age
        if (activeFilters.ageRange) {
            const [minAge, maxAge] = activeFilters.ageRange;
            result = result.filter(p => {
                const profileAge = p.age || 0;
                return profileAge >= minAge && profileAge <= maxAge;
            });
        }

        // 3. Price
        if (activeFilters.priceMin !== '' || activeFilters.priceMax !== '') {
            result = result.filter(p => {
                const price = p.price || 0;
                const minOk = activeFilters.priceMin === '' || price >= (activeFilters.priceMin as number);
                const maxOk = activeFilters.priceMax === '' || price <= (activeFilters.priceMax as number);
                return minOk && maxOk;
            });
        }

        // 4. Properties
        if (activeFilters.verifiedOnly) result = result.filter(p => p.verified);
        if (activeFilters.hasPlace === true) result = result.filter(p => p.hasPlace);
        if (activeFilters.videoCall === true) result = result.filter(p => p.videoCall);

        // 5. Arrays
        if (activeFilters.hairColor.length > 0) {
            result = result.filter(p => activeFilters.hairColor.includes(p.hairColor));
        }
        if (activeFilters.bodyType.length > 0) {
            result = result.filter(p => activeFilters.bodyType.includes(p.bodyType));
        }
        if (activeFilters.ethnicity.length > 0) {
            result = result.filter(p => activeFilters.ethnicity.includes(p.ethnicity));
        }
        if (activeFilters.paymentMethods.length > 0) {
            result = result.filter(p => p.paymentMethods?.some((pm: string) => activeFilters.paymentMethods.includes(pm)));
        }

        // 6. Services
        if (activeFilters.services.length > 0) {
            result = result.filter(p => p.services?.some((s: string) => activeFilters.services.includes(s)));
        }
        if (activeFilters.serviceTo.length > 0) {
            result = result.filter(p => {
                const profileServiceTo = (p as any).serviceTo || [];
                return activeFilters.serviceTo.some(filterServiceTo => profileServiceTo.includes(filterServiceTo));
            });
        }
        if (activeFilters.serviceLocations.length > 0) {
            result = result.filter(p => {
                const profileServiceLocations = (p as any).serviceLocations || [];
                return activeFilters.serviceLocations.some(filterLocation => profileServiceLocations.includes(filterLocation));
            });
        }

        return result;
    }, [profiles, activeFilters, isLocationActive, userLocation, maxDistance]);


    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [observerTarget, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Save favorites (unchanged)
    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        setFavorites(prev => {
            let newFavs;
            if (prev.includes(id)) {
                newFavs = prev.filter(fid => fid !== id);
            } else {
                newFavs = [...prev, id];
            }
            localStorage.setItem('spotgp_favorites', JSON.stringify(newFavs));
            return newFavs;
        });
    };

    // Helper: Get unique neighborhoods (unchanged)
    const getNeighborhoodsForSearch = (search: string) => {
        const normalizedSearch = normalizeString(search);
        const hoodsSet = new Set<string>();

        profiles
            .filter((p: any) => p.neighborhood && normalizeString(p.neighborhood).includes(normalizedSearch))
            .forEach((p: any) => {
                const key = `${p.neighborhood}|||${p.city}|||${p.state}`;
                hoodsSet.add(key);
            });

        Object.entries(NEIGHBORHOODS_BY_CITY).forEach(([city, neighborhoods]) => {
            neighborhoods
                .filter(hood => normalizeString(hood).includes(normalizedSearch))
                .forEach(hood => {
                    const cityData = BRAZILIAN_CITIES[city];
                    if (cityData) {
                        const key = `${hood}|||${city}|||${cityData.state}`;
                        hoodsSet.add(key);
                    }
                });
        });

        return Array.from(hoodsSet).map(key => {
            const [neighborhood, city, state] = key.split('|||');
            return { neighborhood, city, state };
        });
    };

    // Scroll Logic (unchanged)
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 10) {
                setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Spacer for Fixed Navbar + Filters */}
            <div className="h-[120px] md:h-[90px] w-full" />

            {/* Category/Filter Bar - Fixed & Smart */}
            <div
                className={`fixed left-0 right-0 z-40 bg-card border-b border-border py-4 shadow-md transition-transform duration-300 ${isHeaderVisible ? 'translate-y-[64px]' : '-translate-y-full'
                    }`}
                style={{ top: 0 }}
            >
                <div className="container px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left Side: Gender Filters + Categories */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {/* Gender Filters */}
                        <div className="flex space-x-2 text-xs md:text-sm font-medium whitespace-nowrap">
                            <button
                                onClick={() => {
                                    const isSelected = activeFilters.gender?.includes('mulher');
                                    setActiveFilters(prev => ({
                                        ...prev,
                                        gender: isSelected
                                            ? prev.gender?.filter((g: string) => g !== 'mulher') || []
                                            : [...(prev.gender || []), 'mulher']
                                    }));
                                }}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.gender?.includes('mulher') ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Mulheres
                            </button>
                            <button
                                onClick={() => {
                                    const isSelected = activeFilters.gender?.includes('homem');
                                    setActiveFilters(prev => ({
                                        ...prev,
                                        gender: isSelected
                                            ? prev.gender?.filter((g: string) => g !== 'homem') || []
                                            : [...(prev.gender || []), 'homem']
                                    }));
                                }}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.gender?.includes('homem') ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Homens
                            </button>
                            <button
                                onClick={() => {
                                    const isSelected = activeFilters.gender?.includes('trans');
                                    setActiveFilters(prev => ({
                                        ...prev,
                                        gender: isSelected
                                            ? prev.gender?.filter((g: string) => g !== 'trans') || []
                                            : [...(prev.gender || []), 'trans']
                                    }));
                                }}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.gender?.includes('trans') ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Trans
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-6 bg-border" />

                        {/* Categories */}
                        <div className="flex overflow-x-auto space-x-2 md:space-x-3 text-xs md:text-sm font-medium whitespace-nowrap scrollbar-hide">
                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, category: prev.category === 'Acompanhante' ? null : 'Acompanhante' }))}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.category === 'Acompanhante' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Acompanhantes
                            </button>
                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, category: prev.category === 'Massagista' ? null : 'Massagista' }))}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.category === 'Massagista' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Massagistas
                            </button>
                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, category: prev.category === 'Atendimento Online' ? null : 'Atendimento Online' }))}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-colors ${activeFilters.category === 'Atendimento Online' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Atendimento Online
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Controls */}
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto z-40">
                        {/* Toggle Sidebar */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-full transition-colors flex items-center gap-2 px-3 md:px-4 shadow-sm border border-border ${isSidebarOpen ? 'bg-primary text-white border-primary' : 'bg-card hover:bg-muted'}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-semibold hidden md:inline">Filtros</span>
                        </button>

                        {/* Keyword Search */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Termo (ex: massagem)..."
                                value={activeFilters.keyword || ''}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, keyword: e.target.value }))}
                                className="pl-9 pr-4 py-1.5 rounded-full border border-border bg-card text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all w-[140px] md:w-[180px] shadow-sm"
                            />
                        </div>

                        {/* Location Search & Geo */}
                        <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1 pl-3 shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cidade ou bairro..."
                                    value={citySearch}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setCitySearch(newValue);
                                        setIsCityListOpen(true);
                                        if (activeFilters.city && newValue !== activeFilters.city) {
                                            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' })); // Clear all location
                                            setIsLocationActive(false);
                                        }
                                        if (newValue === '') {
                                            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                                            setIsLocationActive(false);
                                        }
                                    }}
                                    onFocus={() => setIsCityListOpen(true)}
                                    onBlur={() => setTimeout(() => setIsCityListOpen(false), 200)}
                                    className="bg-transparent px-2 py-1.5 rounded-full border-none text-sm focus:ring-0 outline-none w-[130px] md:w-[180px] placeholder:text-muted-foreground/50"
                                />
                                {/* Suggestions List - copied from original */}
                                {isCityListOpen && citySearch.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {getNeighborhoodsForSearch(citySearch).map((hood: any) => (
                                            <button
                                                key={`${hood.city}-${hood.neighborhood}`}
                                                onClick={() => {
                                                    setCitySearch(`${hood.city} - ${hood.neighborhood}`);
                                                    setActiveFilters(prev => ({
                                                        ...prev,
                                                        city: hood.city,
                                                        state: hood.state,
                                                        neighborhood: hood.neighborhood
                                                    }));
                                                    setIsLocationActive(false);
                                                    setIsCityListOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between group"
                                            >
                                                <span>{hood.neighborhood}</span>
                                                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{hood.city} - {hood.state}</span>
                                            </button>
                                        ))}

                                        {SORTED_CITIES.filter(city =>
                                            normalizeString(city).includes(normalizeString(citySearch))
                                        ).map(city => (
                                            <button
                                                key={city}
                                                onClick={() => {
                                                    setCitySearch(city);
                                                    setActiveFilters(prev => ({ ...prev, city, state: BRAZILIAN_CITIES[city].state, neighborhood: '' }));
                                                    setIsLocationActive(false);
                                                    setIsCityListOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between group"
                                            >
                                                <span>{city}</span>
                                                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{BRAZILIAN_CITIES[city].state}</span>
                                            </button>
                                        ))}

                                        {SORTED_CITIES.filter(city => normalizeString(city).includes(normalizeString(citySearch))).length === 0 && getNeighborhoodsForSearch(citySearch).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                Nenhum resultado encontrado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleGeolocation}
                                title="Usar minha localização"
                                className={`p-1.5 rounded-full transition-all shadow-sm flex-shrink-0 ${isLocationActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                                <MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce' : ''}`} />
                            </button>

                            {isLocationActive && (
                                <div className="relative">
                                    <select
                                        value={maxDistance}
                                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                                        className="appearance-none bg-card border border-border rounded-full px-3 py-1.5 text-xs md:text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer pr-8 shadow-sm"
                                        title="Distância máxima"
                                    >
                                        <option value={0}>0 km</option>
                                        <option value={5}>5 km</option>
                                        <option value={10}>10 km</option>
                                        <option value={15}>15 km</option>
                                        <option value={20}>20 km</option>
                                        <option value={30}>30 km</option>
                                        <option value={40}>40 km</option>
                                        <option value={50}>50 km</option>
                                        <option value={60}>60 km</option>
                                    </select>
                                    <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Dropdown Panel */}
            {isSidebarOpen && (
                <div className="fixed inset-x-0 z-[60] bg-card border-b border-border shadow-xl" style={{ top: '154px' }}>
                    <div className="container mx-auto px-4 py-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                        <div className="max-w-2xl mx-auto">
                            <FilterSidebar
                                activeFilters={activeFilters}
                                onFilterChange={setActiveFilters}
                                onClose={() => setIsSidebarOpen(false)}
                                className="border-0 shadow-none rounded-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="w-full max-w-full px-4 py-6">
                <main className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Acompanhantes em Destaque</h1>
                        <span className="text-sm text-muted-foreground">{filteredProfiles.length} resultados</span>
                    </div>

                    {isLoading && profiles.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2 w-full">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-muted rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2 w-full">
                            {filteredProfiles.map((profile) => {
                                const mainImage = profile.media?.find((m: any) => m.type === 'image')?.url || 'https://via.placeholder.com/400x600?text=SpotGP';
                                // const isFavorite = favorites.includes(profile.id);

                                return (
                                    <Link to={`/profile/${profile.id}`} key={profile.reactKey || profile.id} className="group block bg-card rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border border-border">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-t-md">
                                            {/* Watermark Overlay */}
                                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-1 pointer-events-none transition-opacity duration-700">
                                                <span className="text-xl font-black uppercase text-white tracking-wider rotate-[-45deg] select-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                    SpotGP
                                                </span>
                                            </div>

                                            <LazyImage
                                                src={mainImage}
                                                alt={profile.display_name || 'Profile'}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />

                                            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
                                                {((getCurrentOnlineStatus(profile as ProfileData)) || profile.videoCall) && (
                                                    <span className="px-2 py-1 rounded-full bg-green-500/95 text-white text-[10px] font-bold uppercase tracking-wide shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                        Online
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => toggleFavorite(e, profile.id)}
                                                className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                                                title={favorites.includes(profile.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                                aria-label={favorites.includes(profile.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                            >
                                                <Heart className={cn("w-4 h-4", favorites.includes(profile.id) ? "fill-red-500 text-red-500" : "text-white")} />
                                            </button>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-white">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <h3 className="font-bold text-sm leading-none truncate pr-4">{sanitizeInput(profile.display_name || '')}</h3>
                                                    {profile.verified && <Check className="w-3 h-3 text-blue-400" />}
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] opacity-90">
                                                    <span>{sanitizeInput(profile.city || '')}</span>
                                                    {profile.price && <span className="font-bold">R$ {profile.price}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div ref={observerTarget} className="h-10 w-full" />
                </main>
            </div>
        </div>
    );
}
