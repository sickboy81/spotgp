import { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, FileText, Search, Trash2, Download, Loader2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { directus } from '@/lib/directus';
import { readFiles, deleteFile, readItems, updateItem } from '@directus/sdk';
import { cn } from '@/lib/utils';

interface MediaItem {
    id: string; // File ID or Composite ID for profile photos
    url: string;
    type: 'image' | 'video';
    size: number;
    owner_id?: string;
    owner_name?: string;
    created_at?: string;
    origin: 'directus' | 'profile';
    profile_id?: string; // For profile photos
    original_url?: string; // For exact matching when deleting from profile
}

export default function MediaManagement() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const [files, profiles] = await Promise.all([
                directus.request(readFiles({
                    sort: ['-uploaded_on'],
                    limit: 50,
                    fields: ['*', 'uploaded_by.first_name', 'uploaded_by.last_name']
                })),
                directus.request(readItems('profiles', {
                    fields: ['id', 'display_name', 'photos', 'user.first_name', 'user.last_name'],
                    limit: 50, // Consider pagination in future
                    filter: { photos: { _nnull: true } }
                }))
            ]);

            const directusMedia: MediaItem[] = files.map((file: any) => {
                const isImage = file.type?.startsWith('image/') || file.filename_download?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const isVideo = file.type?.startsWith('video/') || file.filename_download?.match(/\.(mp4|webm|mov)$/i);

                return {
                    id: file.id,
                    url: `${import.meta.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com'}/assets/${file.id}`,
                    type: (isImage ? 'image' : (isVideo ? 'video' : 'image')) as 'image' | 'video',
                    size: parseInt(file.filesize) || 0,
                    owner_id: file.uploaded_by?.id,
                    owner_name: file.uploaded_by ? (file.uploaded_by.first_name || 'Usuário') : 'Sistema',
                    created_at: file.uploaded_on,
                    origin: 'directus' as const
                };
            }).filter((m: MediaItem) => m.type === 'image' || m.type === 'video');

            const profileMedia: MediaItem[] = [];
            profiles.forEach((profile: any) => {
                let photos: string[] = [];
                if (Array.isArray(profile.photos)) {
                    photos = profile.photos;
                } else if (typeof profile.photos === 'string') {
                    try {
                        photos = JSON.parse(profile.photos);
                    } catch (e) { /* ignore */ }
                }

                if (Array.isArray(photos)) {
                    photos.forEach((photoUrl: string, index: number) => {
                        // Check if URL is internal or external
                        const isInternal = !photoUrl.startsWith('http');
                        const url = isInternal
                            ? `${import.meta.env.VITE_DIRECTUS_URL || 'https://base.spotgp.com'}/assets/${photoUrl}`
                            : photoUrl;

                        profileMedia.push({
                            id: `profile_${profile.id}_${index}`,
                            url: url,
                            original_url: photoUrl,
                            type: 'image', // Profile photos are typically images
                            size: 0, // Unknown size for external
                            owner_id: profile.user?.id || profile.id,
                            owner_name: profile.display_name || profile.user?.first_name || 'Perfil',
                            created_at: undefined,
                            origin: 'profile',
                            profile_id: profile.id
                        });
                    });
                }
            });

            setMedia([...directusMedia, ...profileMedia]);
        } catch (err) {
            console.error('Error loading media:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} itens?`)) return;

        try {
            for (const id of selectedItems) {
                const item = media.find(m => m.id === id);
                if (!item) continue;

                if (item.origin === 'directus') {
                    await directus.request(deleteFile(id));
                } else if (item.origin === 'profile' && item.profile_id && item.original_url) {
                    // Remove from profile photos array
                    const profile = await directus.request(readItems('profiles', {
                        filter: { id: { _eq: item.profile_id } },
                        limit: 1,
                        fields: ['id', 'photos']
                    }));

                    if (profile && profile[0]) {
                        let currentPhotos = profile[0].photos;
                        if (typeof currentPhotos === 'string') {
                            try { currentPhotos = JSON.parse(currentPhotos); } catch (e) { }
                        }
                        if (Array.isArray(currentPhotos)) {
                            const newPhotos = currentPhotos.filter((p: string) => p !== item.original_url);
                            await directus.request(updateItem('profiles', item.profile_id, {
                                photos: newPhotos
                            }));
                        }
                    }
                }
            }

            setSelectedItems([]);
            loadMedia();
            alert('Itens excluídos com sucesso!');
        } catch (err) {
            console.error('Error deleting items:', err);
            alert('Erro ao excluir alguns itens.');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const filteredMedia = media.filter(item => {
        const matchesSearch =
            item.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.url.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const toggleSelect = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(i => i !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const totalSize = media.reduce((sum, item) => sum + item.size, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Mídia</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerenciar todas as imagens e vídeos do sistema
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Arquivos</p>
                            <p className="text-2xl font-bold mt-1">{media.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Imagens</p>
                            <p className="text-2xl font-bold mt-1">{media.filter(m => m.type === 'image').length}</p>
                        </div>
                        <ImageIcon className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Vídeos</p>
                            <p className="text-2xl font-bold mt-1">{media.filter(m => m.type === 'video').length}</p>
                        </div>
                        <Video className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Espaço Total</p>
                            <p className="text-2xl font-bold mt-1">{formatFileSize(totalSize)}</p>
                        </div>
                        <Download className="w-8 h-8 text-orange-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário ou URL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        aria-label="Buscar mídia"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'image' | 'video')}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        aria-label="Filtrar por tipo"
                    >
                        <option value="all">Todos</option>
                        <option value="image">Imagens</option>
                        <option value="video">Vídeos</option>
                    </select>
                    {selectedItems.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Deletar ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "bg-card border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                                selectedItems.includes(item.id) ? "border-primary" : "border-border"
                            )}
                            onClick={() => toggleSelect(item.id)}
                        >
                            <div className="aspect-square bg-muted relative">
                                {item.type === 'image' ? (
                                    <img
                                        src={item.url}
                                        alt="Media"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Video className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}
                                {selectedItems.includes(item.id) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                            <div className="p-2">
                                <div className="text-xs font-medium truncate">{formatFileSize(item.size)}</div>
                                {item.owner_name && (
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                        <User className="w-3 h-3" />
                                        {item.owner_name}
                                    </div>
                                )}
                                {item.profile_id && (
                                    <Link
                                        to={`/profile/${item.profile_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-primary hover:underline mt-1 block"
                                    >
                                        Ver perfil
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredMedia.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhum arquivo encontrado
                </div>
            )}

            {/* Preview Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div className="max-w-4xl w-full">
                        <img
                            src={selectedMedia}
                            alt="Preview"
                            className="w-full h-auto rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}








