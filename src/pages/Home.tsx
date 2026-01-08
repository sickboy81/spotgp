import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Play, MapPin, Filter, Search, Heart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { FilterSidebar, FilterState } from '@/components/features/filters/FilterSidebar';
import { BRAZILIAN_CITIES } from '@/lib/constants/brazilian-cities';

export default function Home() {
    const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
    const observerTarget = useRef(null);

    // Filters State
    const [isLocating, setIsLocating] = useState(false);
    const [isLocationActive, setIsLocationActive] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Autocomplete State
    const [citySearch, setCitySearch] = useState('');
    const [isCityListOpen, setIsCityListOpen] = useState(false);

    // Advanced Filters State
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        city: '',
        state: '',
        priceMax: '',
        ageRange: [18, 60],
        hairColor: [],
        bodyType: [],
        ethnicity: [], // Added
        services: [],
        paymentMethods: [],
        hasPlace: null,
        videoCall: null,
        verifiedOnly: false,
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
            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' })); // Clear all location
            return;
        }

        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                let closestCity = '';
                let minDistance = Infinity;

                // Find nearest supported city
                Object.entries(BRAZILIAN_CITIES).forEach(([city, coords]) => {
                    const rawDistance = getDistance(latitude, longitude, coords.lat, coords.lng);

                    // Priority bias: If it's a capital, subtract 20km from accurate distance to favor it
                    // This helps when a user is in a large metropolitan area (e.g. Rio) but geometrically closer to a suburb (e.g. Nova Iguaçu)
                    const effectiveDistance = coords.capital ? Math.max(0, rawDistance - 20) : rawDistance;

                    if (effectiveDistance < minDistance) {
                        minDistance = effectiveDistance;
                        closestCity = city;
                    }
                });

                // If within 100km (using effective distance), auto-select
                if (minDistance < 100 && closestCity) {
                    const cityState = BRAZILIAN_CITIES[closestCity].state;
                    // Set both City and State, CLEAR neighborhood to avoid conflicts
                    setActiveFilters(prev => ({ ...prev, city: closestCity, state: cityState, neighborhood: '' }));
                    setIsLocationActive(true);
                    // Optional: informative alert/toast could go here
                    console.log(`Located: ${closestCity} (${minDistance.toFixed(1)}km away)`);
                } else {
                    alert('Você não está próximo de nenhuma cidade atendida no momento.');
                    setIsLocationActive(false);
                }
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                setIsLocationActive(false);
            }
        );
    }, [isLocationActive]);

    // Trigger on mount removed to prevent infinite loops and stick to user-gesture policies
    // User must click the button to locate.

    // Legacy favorites state (kept same)
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('saphira_favorites');
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
        queryFn: async ({ pageParam = 0 }) => {
            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select(`*, media(type, url)`)
                    .eq('role', 'advertiser')
                    .range(pageParam * 12, (pageParam + 1) * 12 - 1);

                if (error) throw error;

                if (data && data.length > 0) return data;

                // If Supabase returns empty on first page, throw to trigger fallback (or return empty)
                if (pageParam === 0 && (!data || data.length === 0)) {
                    throw new Error("No data in DB, using mocks");
                }

                return [];
            } catch (err) {
                console.log("Fetching error or empty DB, using MOCK_PROFILES", err);

                // FALLBACK: Simulate paginated mock data
                await new Promise(r => setTimeout(r, 800));

                if (pageParam > 5) return []; // Limit mock pages to 5

                // Return mocks with slightly randomized IDs for React keys
                return MOCK_PROFILES.map(p => ({
                    ...p,
                    reactKey: `${p.id}-${pageParam}-${Math.random().toString(36).substr(2, 9)}`
                }));
            }
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 12) return undefined;
            return allPages.length;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes resistant cache
    });

    const profiles = useMemo(() => data ? data.pages.flat() : [], [data]);

    // Apply Advanced Filters locally
    useEffect(() => {
        let result = [...profiles];

        // 0. Keyword Search (Global)
        if (activeFilters.keyword) {
            const lowerTerm = activeFilters.keyword.toLowerCase();
            result = result.filter(p => {
                const name = p.display_name?.toLowerCase() || '';
                const desc = p.description?.toLowerCase() || '';
                const services = p.services?.join(' ').toLowerCase() || '';
                // Check match
                return name.includes(lowerTerm) || desc.includes(lowerTerm) || services.includes(lowerTerm);
            });
        }

        // 0. Category (Top Bar)
        if (activeFilters.category) {
            if (activeFilters.category === 'Atendimento Online') {
                result = result.filter(p => p.videoCall);
            } else {
                result = result.filter(p => p.category === activeFilters.category);
            }
        }

        // 1. Location (State -> City -> Neighborhood)
        if (activeFilters.state) result = result.filter(p => p.state === activeFilters.state);
        if (activeFilters.city) result = result.filter(p => p.city === activeFilters.city);
        if (activeFilters.neighborhood) result = result.filter(p => p.neighborhood === activeFilters.neighborhood);

        // 1.5 Gender (Sidebar)
        if (activeFilters.gender && activeFilters.gender.length > 0) {
            result = result.filter(p => activeFilters.gender.includes(p.gender));
        }

        // 2. Price
        if (activeFilters.priceMax) result = result.filter(p => (p.price || 0) <= (activeFilters.priceMax as number));

        // 3. Properties/Booleans
        if (activeFilters.verifiedOnly) result = result.filter(p => p.verified);
        if (activeFilters.hasPlace === true) result = result.filter(p => p.hasPlace);
        if (activeFilters.videoCall === true) result = result.filter(p => p.videoCall);

        // 4. Arrays (Hair, Body, Ethnicity, Payment)
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

        // 5. Services
        if (activeFilters.services.length > 0) {
            result = result.filter(p => p.services?.some((s: string) => activeFilters.services.includes(s)));
        }

        setFilteredProfiles(result);
    }, [profiles, activeFilters]);


    // Intersection Observer for Load More
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

    // Save favorites
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
            localStorage.setItem('saphira_favorites', JSON.stringify(newFavs));
            return newFavs;
        });
    };

    // Helper: Get unique neighborhoods for autocomplete
    const getNeighborhoodsForSearch = (search: string) => {
        const term = search.toLowerCase();
        // Collect all distinct neighborhoods from profiles that match key
        const hoods = Array.from(new Set(
            profiles
                .filter(p => p.neighborhood?.toLowerCase().includes(term))
                .map(p => ({ neighborhood: p.neighborhood, city: p.city, state: p.state }))
        ));
        return hoods;
    };

    // Scroll Logic for Smart Header (Filters)
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            // Sync triggers with Navbar logic roughly
            if (currentScrollY < 10) {
                setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY) {
                setIsHeaderVisible(false); // Hide
            } else {
                setIsHeaderVisible(true); // Show
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Spacer for Fixed Navbar + Filters */}
            {/* Navbar (h-16 = 64px) + FilterBar (approx 72px) = ~136px */}
            <div className="h-[140px] md:h-[90px] w-full" />

            {/* Category/Filter Bar - Fixed & Smart */}
            <div
                className={`fixed left-0 right-0 z-40 bg-card border-b border-border py-4 shadow-md transition-transform duration-300 ${isHeaderVisible ? 'translate-y-[64px]' : '-translate-y-full'
                    }`}
                style={{ top: 0 }} // Base top is 0, but translated down by Navbar height (64px) or hidden
            >
                <div className="container px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Row 1: Categories */}
                    <div className="flex overflow-x-auto space-x-4 text-xs md:text-sm font-medium whitespace-nowrap scrollbar-hide pb-1">
                        <button
                            onClick={() => setActiveFilters(prev => ({ ...prev, category: 'Acompanhante' }))}
                            className={`px-6 py-2 rounded-full transition-colors ${activeFilters.category === 'Acompanhante' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            Acompanhantes
                        </button>
                        <button
                            onClick={() => setActiveFilters(prev => ({ ...prev, category: 'Massagista' }))}
                            className={`px-6 py-2 rounded-full transition-colors ${activeFilters.category === 'Massagista' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            Massagistas
                        </button>
                        <button
                            onClick={() => setActiveFilters(prev => ({ ...prev, category: 'Atendimento Online' }))}
                            className={`px-6 py-2 rounded-full transition-colors ${activeFilters.category === 'Atendimento Online' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            Atendimento Online
                        </button>
                    </div>

                    {/* Row 2: Controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto z-40">
                        {/* Toggle Sidebar */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 shadow-sm border border-border ${isSidebarOpen ? 'bg-primary text-white border-primary' : 'bg-card hover:bg-muted'}`}
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

                                        // If user is typing something different from current filter, clear the filter to show national results/search
                                        if (activeFilters.city && newValue !== activeFilters.city) {
                                            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' })); // Clear all location
                                            setIsLocationActive(false);
                                        }

                                        // Also clear if empty (redundant but safe)
                                        if (newValue === '') {
                                            setActiveFilters(prev => ({ ...prev, city: '', state: '', neighborhood: '' }));
                                            setIsLocationActive(false);
                                        }
                                    }}
                                    onFocus={() => setIsCityListOpen(true)}
                                    // Delayed blur to allow clicking on items
                                    onBlur={() => setTimeout(() => setIsCityListOpen(false), 200)}
                                    // Adjusted width slightly to fit both inputs
                                    className="bg-transparent px-2 py-1.5 rounded-full border-none text-sm focus:ring-0 outline-none w-[130px] md:w-[180px] placeholder:text-muted-foreground/50"
                                />
                                {/* Suggestions List */}
                                {isCityListOpen && citySearch.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {/* 1. Neighborhood Matches First (Prioritize Specificity) */}
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

                                        {/* 2. City Matches */}
                                        {SORTED_CITIES.filter(city =>
                                            city.toLowerCase().includes(citySearch.toLowerCase())
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

                                        {SORTED_CITIES.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && getNeighborhoodsForSearch(citySearch).length === 0 && (
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
                        </div>
                    </div>
                </div>
            </div>

            <div className={`container px-4 py-6 grid gap-8 ${isSidebarOpen ? 'md:grid-cols-[280px_1fr]' : 'grid-cols-1'}`}>
                {/* Sidebar Filters (Desktop) */}
                {isSidebarOpen && (
                    <aside className="hidden md:block animate-in slide-in-from-left duration-300">
                        <div className="sticky top-48">
                            <FilterSidebar
                                activeFilters={activeFilters}
                                onFilterChange={setActiveFilters}
                            />
                        </div>
                    </aside>
                )}

                {/* Main Grid */}
                <main>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Acompanhantes em Destaque</h1>
                        <span className="text-sm text-muted-foreground">{filteredProfiles.length} resultados</span>
                    </div>

                    {isLoading && profiles.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProfiles.map((profile) => {
                                const mainImage = profile.media?.find((m: any) => m.type === 'image')?.url || 'https://via.placeholder.com/400x600?text=Saphira';
                                const hasVideo = profile.media?.some((m: any) => m.type === 'video');
                                const isFavorite = favorites.includes(profile.id);

                                return (
                                    <Link to={`/profile/${profile.id}`} key={profile.reactKey || profile.id} className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-white/10 hover:ring-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        {/* Watermark Overlay */}
                                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-700">
                                            <span className="text-4xl font-serif font-bold text-white tracking-widest rotate-[-45deg] select-none">
                                                Luxuria
                                            </span>
                                        </div>

                                        <img
                                            src={mainImage}
                                            alt={profile.display_name || 'Profile'}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Tags */}
                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
                                            {profile.videoCall && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-500/90 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    Online
                                                </span>
                                            )}
                                            {profile.verified && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500/90 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    Verificada
                                                </span>
                                            )}
                                        </div>

                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleFavorite(profile.id);
                                            }}
                                            className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-white/20 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                                            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        >
                                            <Heart className={cn("w-5 h-5", isFavorite && "fill-primary text-primary")} />
                                        </button>

                                        {/* Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                            <h3 className="text-xl font-bold text-white mb-0.5 font-display drop-shadow-md">{profile.display_name}</h3>
                                            <div className="flex items-center justify-between text-white/90 text-xs font-medium">
                                                <span>{profile.neighborhood || profile.city}</span>
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                                                    {hasVideo && <Play className="w-3 h-3 text-red-500 fill-current" />}
                                                    R$ {profile.price}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div >

            {/* Infinite Scroll Trigger */}
            < div ref={observerTarget} className="h-20 flex items-center justify-center w-full py-8" >
                {hasNextPage && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground text-sm animate-pulse">Carregando mais...</span>
                    </div>
                )
                }
                {!hasNextPage && profiles.length > 0 && <span className="text-muted-foreground">Você chegou ao fim!</span>}
            </div >
        </div >
    );
}
