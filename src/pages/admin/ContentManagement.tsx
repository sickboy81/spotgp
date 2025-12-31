import { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Trash2, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { RecordModel } from 'pocketbase';

interface MediaItem {
    type: 'image' | 'video';
    url: string;
}

interface Profile extends RecordModel {
    display_name?: string;
    city?: string;
    ad_id?: string;
    role?: string;
    is_banned?: boolean;
    media?: MediaItem[];
    // Include other fields as needed
}

export default function ContentManagement() {
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden'>('all');

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const records = await pb.collection('profiles').getFullList<Profile>({
                sort: '-created',
                filter: 'role = "advertiser"',
                expand: 'media_via_profile_id', // Assuming reverse relation exists
            });

            // Map and normalize data if needed. 
            // For now assuming the structure from previous code which seemed to rely on a 'media' property 
            // potentially populated by a manual fetch or hook in other components.
            // Since we are not using the hook here, we might not get media if it's not in the record.
            // Let's assume for now we might need to fetch media or rely on expand.
            // If strictly following Home.tsx optimization, we should fetch media.
            // But let's verify if `media` field exists on profile (it doesn't in standard PB relation usually).
            // It's likely we need to fetch media separatedly.

            // To be safe and clean, let's fetch media for these profiles.
            const profilesWithMedia = await Promise.all(records.map(async (profile) => {
                try {
                    const mediaRecords = await pb.collection('media').getFullList({
                        filter: `profile_id="${profile.id}"`,
                        sort: '-created'
                    });

                    const mediaItems: MediaItem[] = mediaRecords.map(m => ({
                        type: m.type as 'image' | 'video', // Adjust as per your media collection schema
                        url: pb.files.getUrl(m, m.file)
                    }));

                    return { ...profile, media: mediaItems };
                } catch {
                    return profile;
                }
            }));

            setProfiles(profilesWithMedia);
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (profileId: string, currentHidden: boolean | undefined) => {
        try {
            // Assuming 'is_banned' is used for visibility hiding as per previous code context
            await pb.collection('profiles').update(profileId, {
                is_banned: !currentHidden
            });

            await loadProfiles();
        } catch (error) {
            console.error('Error toggling visibility:', error);
            alert('Erro ao alterar visibilidade do perfil');
        }
    };

    const handleDeleteContent = async (profileId: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('Tem certeza que deseja deletar este conteúdo? Esta ação não pode ser desfeita!')) return;

        try {
            // First delete media
            try {
                const mediaItems = await pb.collection('media').getFullList({
                    filter: `profile_id="${profileId}"`
                });
                for (const item of mediaItems) {
                    await pb.collection('media').delete(item.id);
                }
            } catch (e) {
                console.warn("Error deleting media", e);
            }

            // Then delete profile
            await pb.collection('profiles').delete(profileId);

            await loadProfiles();
            alert('Conteúdo deletado com sucesso.');
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Erro ao deletar conteúdo');
        }
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = (profile.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (profile.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (profile.ad_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'visible' && !profile.is_banned) ||
            (filterStatus === 'hidden' && profile.is_banned);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Gerenciamento de Conteúdo</h1>
                <p className="text-muted-foreground">Gerencie anúncios e conteúdo da plataforma</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar anúncios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                        aria-label="Buscar anúncios"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'visible' | 'hidden')}
                    className="bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    aria-label="Filtrar visibilidade"
                >
                    <option value="all">Todos</option>
                    <option value="visible">Visíveis</option>
                    <option value="hidden">Ocultos</option>
                </select>
            </div>

            {/* Profiles List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <p className="text-muted-foreground">Nenhum anúncio encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.map((profile) => {
                        const mainImage = profile.media?.find((m) => m.type === 'image')?.url ||
                            'https://via.placeholder.com/400x600';
                        const hasVideo = profile.media?.some((m) => m.type === 'video');
                        const imageCount = profile.media?.filter((m) => m.type === 'image').length || 0;
                        const videoCount = profile.media?.filter((m) => m.type === 'video').length || 0;

                        return (
                            <div key={profile.id} className="bg-card border border-border rounded-xl overflow-hidden">
                                <div className="relative aspect-[3/4] bg-muted">
                                    <img
                                        src={mainImage}
                                        alt={profile.display_name || 'Perfil'}
                                        className="w-full h-full object-cover"
                                    />
                                    {profile.is_banned && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                                                OCULTO
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {imageCount > 0 && (
                                            <span className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" />
                                                {imageCount}
                                            </span>
                                        )}
                                        {hasVideo && (
                                            <span className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                                <Video className="w-3 h-3" />
                                                {videoCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">{profile.display_name || 'Sem nome'}</h3>
                                        {profile.ad_id && (
                                            <p className="text-xs text-muted-foreground font-mono">ID: {profile.ad_id}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {profile.city || 'Cidade não informada'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                                        <Link
                                            to={`/profile/${profile.id}`}
                                            target="_blank"
                                            className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                            aria-label={`Ver perfil de ${profile.display_name}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            Ver
                                        </Link>
                                        <button
                                            onClick={() => handleToggleVisibility(profile.id, profile.is_banned)}
                                            className={cn(
                                                "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                                profile.is_banned
                                                    ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                                    : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                                            )}
                                            aria-label={profile.is_banned ? "Exibir perfil" : "Ocultar perfil"}
                                            title={profile.is_banned ? "Exibir perfil" : "Ocultar perfil"}
                                        >
                                            {profile.is_banned ? (
                                                <>
                                                    <Eye className="w-4 h-4" />
                                                    Exibir
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="w-4 h-4" />
                                                    Ocultar
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteContent(profile.id)}
                                            className="px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
                                            aria-label="Deletar perfil"
                                            title="Deletar perfil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
