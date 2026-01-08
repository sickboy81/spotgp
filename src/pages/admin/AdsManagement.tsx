import { useState, useEffect } from 'react';
import { Star, TrendingUp, Eye, Search, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { directus } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';

interface Ad {
    id: string;
    profile_id: string;
    display_name?: string;
    ad_id?: string;
    is_featured: boolean;
    is_sponsored: boolean;
    featured_until?: string;
    sponsored_until?: string;
    priority: number;
    views: number;
    clicks: number;
}

export default function AdsManagement() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'featured' | 'sponsored' | 'normal'>('all');

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        setLoading(true);
        try {
            // Fetch profiles with role 'advertiser'
            // Fetch profiles with ad_id (Advertisers)
            const profiles = await directus.request(readItems('profiles', {
                filter: { ad_id: { _null: false } },
                sort: ['-date_created'],
                fields: ['id', 'display_name', 'ad_id', 'date_created', 'is_featured', 'is_sponsored', 'views', 'clicks', 'priority']
            }));

            // Map profiles to ads (in a real app, you'd have an ads table)
            const adsData: Ad[] = profiles.map((profile: any) => ({
                id: profile.id,
                profile_id: profile.id,
                display_name: profile.display_name || 'Sem nome',
                ad_id: profile.ad_id || '',
                is_featured: profile.is_featured || false,
                is_sponsored: profile.is_sponsored || false,
                priority: profile.priority || 0,
                views: profile.views || 0,
                clicks: profile.clicks || 0,
            }));

            setAds(adsData);
        } catch (err) {
            console.error('Error loading ads:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeatured = async (adId: string, currentFeatured: boolean) => {
        try {
            // Update in profiles table (since adId is profile.id here)
            await directus.request(updateItem('profiles', adId, {
                is_featured: !currentFeatured
            }));

            alert(`Anúncio ${currentFeatured ? 'removido dos' : 'adicionado aos'} destaques`);
            loadAds(); // Reload locally or optimistically update
        } catch (err) {
            console.error('Error updating featured status:', err);
            alert('Erro ao atualizar status');
        }
    };

    const handleToggleSponsored = async (adId: string, currentSponsored: boolean) => {
        try {
            // Update in profiles table
            await directus.request(updateItem('profiles', adId, {
                is_sponsored: !currentSponsored
            }));

            alert(`Anúncio ${currentSponsored ? 'removido dos' : 'adicionado aos'} patrocinados`);
            loadAds();
        } catch (err) {
            console.error('Error updating sponsored status:', err);
            alert('Erro ao atualizar status');
        }
    };

    const filteredAds = ads.filter(ad => {
        const matchesSearch =
            (ad.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ad.ad_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'featured' && ad.is_featured) ||
            (filterType === 'sponsored' && ad.is_sponsored) ||
            (filterType === 'normal' && !ad.is_featured && !ad.is_sponsored);

        return matchesSearch && matchesFilter;
    });

    const featuredCount = ads.filter(a => a.is_featured).length;
    const sponsoredCount = ads.filter(a => a.is_sponsored).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Anúncios</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie anúncios em destaque, patrocinados e prioridades
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Anúncios</p>
                            <p className="text-2xl font-bold mt-1">{ads.length}</p>
                        </div>
                        <Sparkles className="w-8 h-8 text-primary opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Em Destaque</p>
                            <p className="text-2xl font-bold mt-1">{featuredCount}</p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Patrocinados</p>
                            <p className="text-2xl font-bold mt-1">{sponsoredCount}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                            <p className="text-2xl font-bold mt-1">
                                {ads.reduce((sum, ad) => sum + (ad.views || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <Eye className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou ID do anúncio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filterType === 'all'
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('featured')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filterType === 'featured'
                                ? "bg-yellow-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Destaque
                    </button>
                    <button
                        onClick={() => setFilterType('sponsored')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filterType === 'sponsored'
                                ? "bg-green-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Patrocinado
                    </button>
                    <button
                        onClick={() => setFilterType('normal')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filterType === 'normal'
                                ? "bg-blue-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Normal
                    </button>
                </div>
            </div>

            {/* Ads Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Anúncio</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Visualizações</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Cliques</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAds.map((ad) => (
                                    <tr key={ad.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/profile/${ad.profile_id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {ad.display_name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {ad.ad_id || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {ad.views?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {ad.clicks?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {ad.is_featured && (
                                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded">
                                                        Destaque
                                                    </span>
                                                )}
                                                {ad.is_sponsored && (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded">
                                                        Patrocinado
                                                    </span>
                                                )}
                                                {!ad.is_featured && !ad.is_sponsored && (
                                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
                                                        Normal
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleFeatured(ad.id, ad.is_featured)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        ad.is_featured
                                                            ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                    )}
                                                    title={ad.is_featured ? "Remover dos destaques" : "Adicionar aos destaques"}
                                                >
                                                    <Star className={cn("w-4 h-4", ad.is_featured && "fill-current")} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleSponsored(ad.id, ad.is_sponsored)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        ad.is_sponsored
                                                            ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                    )}
                                                    title={ad.is_sponsored ? "Remover dos patrocinados" : "Adicionar aos patrocinados"}
                                                >
                                                    <TrendingUp className={cn("w-4 h-4", ad.is_sponsored && "fill-current")} />
                                                </button>
                                                <Link
                                                    to={`/profile/${ad.profile_id}`}
                                                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                                    title="Ver perfil"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAds.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum anúncio encontrado
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}





