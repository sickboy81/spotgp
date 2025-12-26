import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { MapPin, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LazyImage } from '@/components/features/media/LazyImage';
import { getCurrentOnlineStatus, ProfileData } from '@/lib/api/profile';

export default function Favorites() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load favorites from local storage
        const saved = localStorage.getItem('saphira_favorites');
        const favIds = saved ? JSON.parse(saved) : [];
        setFavorites(favIds);

        if (favIds.length === 0) {
            setIsLoading(false);
            return;
        }

        fetchFavoriteProfiles(favIds);
    }, []);

    async function fetchFavoriteProfiles(ids: string[]) {
        try {
            // 1. Try fetching from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select(`*, media(type, url)`)
                .in('id', ids);

            if (!error && data && data.length > 0) {
                // Merge with any mock profiles if some IDs are mocks
                const mockIds = ids.filter(id => id.startsWith('mock-'));
                const mockProfiles = MOCK_PROFILES.filter(p => mockIds.includes(p.id));

                // Combine and remove duplicates
                const combined = [...data, ...mockProfiles];
                // Deduplicate by ID just in case
                const uniqueProfiles = Array.from(new Map(combined.map(item => [item.id, item])).values());

                setProfiles(uniqueProfiles);
            } else {
                // Fallback to mocks entirely if Supabase fails or returns nothing (and we have mock IDs)
                const mockProfiles = MOCK_PROFILES.filter(p => ids.includes(p.id));
                setProfiles(mockProfiles);
            }

        } catch (err) {
            console.error("Error fetching favorites", err);
            // Fallback to mocks
            const mockProfiles = MOCK_PROFILES.filter(p => ids.includes(p.id));
            setProfiles(mockProfiles);
        } finally {
            setIsLoading(false);
        }
    }

    const removeFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const newFavs = favorites.filter(fid => fid !== id);
        setFavorites(newFavs);
        localStorage.setItem('saphira_favorites', JSON.stringify(newFavs));

        // Remove from current view
        setProfiles(prev => prev.filter(p => p.id !== id));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background container px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Meus Favoritos</h1>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background container px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">Meus Favoritos</h1>
            <p className="text-muted-foreground mb-8">Seus perfis salvos ficam guardados aqui neste dispositivo.</p>

            {profiles.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Nenhum favorito ainda</h2>
                    <p className="text-muted-foreground mb-6">Explore a página inicial e clique no coração para salvar perfis.</p>
                    <Link to="/" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors">
                        Explorar Perfis
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
                    {profiles.map((profile) => {
                        const mainImage = profile.media?.find((m: any) => m.type === 'image')?.url || 'https://via.placeholder.com/400x600?text=Saphira';

                        return (
                            <Link to={`/profile/${profile.id}`} key={profile.id} className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-card shadow-lg ring-1 ring-white/10 hover:ring-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                                <LazyImage
                                    src={mainImage}
                                    alt={profile.display_name || 'Profile'}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Status Badges (Top Left) */}
                                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-20">
                                    {getCurrentOnlineStatus(profile as ProfileData) && (
                                        <div className="flex items-center gap-0.5 bg-green-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> ONLINE
                                        </div>
                                    )}
                                </div>

                                {/* Remove Button (Top Right) */}
                                <button
                                    onClick={(e) => removeFavorite(e, profile.id)}
                                    title="Remover dos favoritos"
                                    className="absolute top-1.5 right-1.5 z-20 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors backdrop-blur-sm shadow-md"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                </button>

                                {/* Gradient and Watermark */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                <div className="absolute bottom-0 left-0 right-0 p-2.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="mb-0.5">
                                        <h3 className="text-sm font-bold font-serif text-white leading-none truncate">{profile.display_name}</h3>
                                    </div>
                                    <div className="flex items-stretch justify-between text-[10px] text-gray-300">
                                        <div className="flex items-center gap-0.5 truncate mr-1">
                                            <MapPin className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                            <span className="truncate">{profile.city}</span>
                                        </div>
                                        <span className="font-bold text-white flex-shrink-0">R$ {profile.price}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
