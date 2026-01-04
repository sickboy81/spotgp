import { useState, useMemo } from 'react';
import { Search as SearchIcon, Filter, ArrowUpDown, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { FilterSidebar, FilterState } from '@/components/features/filters/FilterSidebar';
import { cn, normalizeString } from '@/lib/utils';
import { SEOHead } from '@/components/features/seo/SEOHead';
import { LazyImage } from '@/components/features/media/LazyImage';
import { sanitizeInput } from '@/lib/utils/validation';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popularity' | 'distance';

interface SearchProfile {
    id: string;
    display_name: string;
    description?: string;
    city: string;
    state: string;
    neighborhood?: string;
    price: number;
    views: number;
    services: string[];
    verified: boolean;
    gender: string;
    category?: string;
    media: Array<{ type: string; url: string }>;
    created_at: string;
}

export default function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [savedSearches, setSavedSearches] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('spotgp_saved_searches');
        return saved ? JSON.parse(saved) : [];
    });

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
        ethnicity: [],
        services: [],
        serviceTo: [],
        serviceLocations: [],
        paymentMethods: [],
        hasPlace: null,
        videoCall: null,
        verifiedOnly: false,
        category: null,
        keyword: '',
    });

    // Filter profiles based on search and filters
    const filteredProfiles = useMemo(() => {
        let result = MOCK_PROFILES as unknown as SearchProfile[];

        // Search query filter (using normalizeString for accent-insensitive search)
        if (searchQuery.trim()) {
            const normalizedQuery = normalizeString(searchQuery);
            result = result.filter(p => {
                const name = normalizeString(p.display_name || '');
                const desc = normalizeString(p.description || '');
                const city = normalizeString(p.city || '');
                const services = (p.services || []).map((s: string) => normalizeString(s)).join(' ');
                return name.includes(normalizedQuery) ||
                    desc.includes(normalizedQuery) ||
                    city.includes(normalizedQuery) ||
                    services.includes(normalizedQuery);
            });
        }

        // Helper function to check if profile is "Atendimento Online"
        // IMPORTANTE: Usa apenas a categoria, não videoCall, para garantir que cada anúncio aparece em apenas uma categoria
        const isOnlineService = (p: SearchProfile) => {
            return p.category === 'Atendimento Online';
        };

        // Apply location filters - usando normalizeString para busca sem acentos
        // IMPORTANTE: Não aplicar filtros de localização para "Atendimento Online" (atendem todo Brasil)
        if (activeFilters.state) {
            const normalizedState = normalizeString(activeFilters.state);
            result = result.filter(p => {
                // Pula filtro de localização se for atendimento online
                if (isOnlineService(p)) return true;
                const profileState = normalizeString(p.state || '');
                return profileState === normalizedState;
            });
        }

        if (activeFilters.city) {
            const normalizedCity = normalizeString(activeFilters.city);
            result = result.filter(p => {
                // Pula filtro de localização se for atendimento online
                if (isOnlineService(p)) return true;
                const profileCity = normalizeString(p.city || '');
                // Aceita correspondência exata ou parcial
                return profileCity === normalizedCity ||
                    profileCity.includes(normalizedCity) ||
                    normalizedCity.includes(profileCity);
            });
        }

        if (activeFilters.neighborhood) {
            const normalizedNeighborhood = normalizeString(activeFilters.neighborhood);
            result = result.filter(p => {
                // Pula filtro de localização se for atendimento online
                if (isOnlineService(p)) return true;
                const profileNeighborhood = normalizeString(p.neighborhood || '');
                // Aceita correspondência exata ou parcial
                return profileNeighborhood === normalizedNeighborhood ||
                    profileNeighborhood.includes(normalizedNeighborhood) ||
                    normalizedNeighborhood.includes(profileNeighborhood);
            });
        }

        if (activeFilters.priceMax) {
            const maxPrice = parseFloat(activeFilters.priceMax.toString());
            result = result.filter(p => (p.price || 0) <= maxPrice);
        }

        if (activeFilters.services.length > 0) {
            result = result.filter(p => {
                const services = p.services || [];
                return activeFilters.services.some(filterService =>
                    services.some((s: string) => normalizeString(s).includes(normalizeString(filterService)))
                );
            });
        }

        if (activeFilters.verifiedOnly) {
            result = result.filter(p => p.verified === true);
        }

        if (activeFilters.gender && activeFilters.gender.length > 0) {
            result = result.filter(p => activeFilters.gender.includes(p.gender));
        }

        // IMPORTANTE: Cada anúncio aparece em APENAS UMA categoria
        if (activeFilters.category) {
            result = result.filter(p => p.category === activeFilters.category);
        }

        // Sort profiles
        const sorted = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'price_asc':
                    return (a.price || 0) - (b.price || 0);
                case 'price_desc':
                    return (b.price || 0) - (a.price || 0);
                case 'newest':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'popularity':
                    return (b.views || 0) - (a.views || 0);
                case 'relevance':
                default:
                    // Relevance: verified first, then by views
                    if (a.verified && !b.verified) return -1;
                    if (!a.verified && b.verified) return 1;
                    return (b.views || 0) - (a.views || 0);
            }
        });

        return sorted;
    }, [searchQuery, activeFilters, sortBy]);

    const saveCurrentSearch = () => {
        const searchKey = `${searchQuery}|${JSON.stringify(activeFilters)}|${sortBy}`;
        if (!savedSearches.includes(searchKey)) {
            const newSearches = [searchKey, ...savedSearches.slice(0, 4)]; // Keep only 5 saved searches
            setSavedSearches(newSearches);
            localStorage.setItem('spotgp_saved_searches', JSON.stringify(newSearches));
        }
    };

    return (
        <>
            <SEOHead
                title="Buscar Perfis - SpotGP"
                description="Busque acompanhantes e massagistas com filtros avançados. Encontre exatamente o que você procura."
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/search`}
                type="website"
            />
            <div className="min-h-screen bg-background">
                <div className="container px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Buscar Perfis</h1>
                        <p className="text-muted-foreground">Encontre exatamente o que você está procurando</p>
                    </div>

                    {/* Search Bar with Suggestions */}
                    <div className="mb-6 space-y-3">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, descrição, cidade ou serviços..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-card border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>

                        {/* Search Suggestions */}
                        {searchQuery.length > 0 && searchQuery.length < 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                                Digite pelo menos 3 caracteres para ver sugestões
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "grid gap-6",
                        isSidebarOpen ? "md:grid-cols-[280px_1fr]" : "grid-cols-1"
                    )}>
                        {/* Sidebar Filters */}
                        {isSidebarOpen && (
                            <aside className="hidden md:block">
                                <div className="sticky top-24">
                                    <FilterSidebar
                                        activeFilters={activeFilters}
                                        onFilterChange={setActiveFilters}
                                    />
                                </div>
                            </aside>
                        )}

                        {/* Main Content */}
                        <main>
                            {/* Toggle Sidebar Button and Sort */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <span className="text-sm text-muted-foreground">
                                    {filteredProfiles.length} resultado(s) encontrado(s)
                                </span>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {/* Sort Dropdown */}
                                    <div className="relative flex-1 sm:flex-none">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="w-full sm:w-auto appearance-none bg-card border border-input rounded-lg px-4 py-2 pr-8 text-sm focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                                            aria-label="Ordenar por"
                                        >
                                            <option value="relevance">Relevância</option>
                                            <option value="popularity">Mais Popular</option>
                                            <option value="price_asc">Preço: Menor para Maior</option>
                                            <option value="price_desc">Preço: Maior para Menor</option>
                                            <option value="newest">Mais Recente</option>
                                        </select>
                                        <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>

                                    {/* Save Search Button */}
                                    {filteredProfiles.length > 0 && (
                                        <button
                                            onClick={saveCurrentSearch}
                                            className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                            title="Salvar esta busca"
                                        >
                                            <Heart className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                                            isSidebarOpen
                                                ? "bg-primary text-white"
                                                : "bg-card border border-border hover:bg-muted"
                                        )}
                                    >
                                        <Filter className="w-4 h-4" />
                                        {isSidebarOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                                    </button>
                                </div>
                            </div>

                            {/* Results Grid */}
                            {filteredProfiles.length === 0 ? (
                                <div className="bg-card border border-border rounded-xl p-12 text-center">
                                    <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                                    <p className="text-muted-foreground">
                                        Tente ajustar seus filtros ou termos de busca.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
                                    {filteredProfiles.map((profile) => {
                                        const mainImage = (profile as any).media?.find((m: any) => m.type === 'image')?.url ||
                                            'https://via.placeholder.com/400x600?text=SpotGP';

                                        return (
                                            <Link
                                                to={`/profile/${profile.id}`}
                                                key={profile.id}
                                                className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-card shadow-lg ring-1 ring-white/10 hover:ring-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                                            >
                                                <LazyImage
                                                    src={mainImage}
                                                    alt={profile.display_name || 'Profile'}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                {/* Info */}
                                                <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                                                    <h3 className="text-sm font-bold text-white mb-0.5 font-display drop-shadow-md truncate">
                                                        {sanitizeInput(profile.display_name || '')}
                                                    </h3>
                                                    <div className="flex items-center justify-between text-white/90 text-[10px] font-medium">
                                                        <span className="truncate mr-1">{sanitizeInput(profile.city || '')}</span>
                                                        <span className="flex-shrink-0">R$ {profile.price}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}

