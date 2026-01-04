import { useState, useEffect } from 'react';
import { Eye, MousePointerClick, Star, Edit, ExternalLink, Megaphone, Loader2, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { directus } from '@/lib/directus';
import { readItems, updateItem, deleteItem } from '@directus/sdk';
import { motion } from 'framer-motion';

interface AdStats {
    id: string;
    display_name: string;
    ad_id: string;
    is_featured: boolean;
    is_sponsored: boolean;
    views: number;
    clicks: number;
    main_photo?: string;
    status: 'active' | 'hidden' | 'deleted';
}

export default function MyAds() {
    const { user } = useAuth();
    const [ads, setAds] = useState<AdStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Store ID of ad being acted upon
    const [adToDelete, setAdToDelete] = useState<AdStats | null>(null); // For delete modal

    useEffect(() => {
        const loadMyAds = async () => {
            if (!user) return;

            try {
                // Fetch user's profiles
                const profiles = await directus.request(readItems('profiles', {
                    filter: { user: { _eq: user.id } },
                    fields: ['id', 'display_name', 'ad_id', 'is_featured', 'is_sponsored', 'views', 'clicks', 'photos', 'status']
                }));

                if (profiles && profiles.length > 0) {
                    const loadedAds = profiles.map((profile: any) => {
                        let mainPhoto = null;
                        // Parse photos to get main one
                        if (profile.photos) {
                            try {
                                const parsed = typeof profile.photos === 'string'
                                    ? JSON.parse(profile.photos)
                                    : profile.photos;
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    mainPhoto = parsed[0];
                                }
                            } catch (e) {
                                console.error("Error parsing photos", e);
                            }
                        }

                        return {
                            id: profile.id,
                            display_name: profile.display_name,
                            ad_id: profile.ad_id,
                            is_featured: profile.is_featured,
                            is_sponsored: profile.is_sponsored,
                            views: profile.views || 0,
                            clicks: profile.clicks || 0,
                            main_photo: mainPhoto,
                            status: profile.status || 'active'
                        };
                    });

                    setAds(loadedAds);
                }
            } catch (err) {
                console.error("Error loading my ads:", err);
            } finally {
                setLoading(false);
            }
        };

        loadMyAds();
    }, [user]);

    const handleToggleVisibility = async (ad: AdStats) => {
        setActionLoading(ad.id);
        try {
            const newStatus = ad.status === 'active' ? 'hidden' : 'active';
            await directus.request(updateItem('profiles', ad.id, {
                status: newStatus
            }));

            setAds(prev => prev.map(item =>
                item.id === ad.id ? { ...item, status: newStatus } : item
            ));
        } catch (error) {
            console.error('Error toggling visibility:', error);
            alert('Erro ao alterar visibilidade. Tente novamente.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!adToDelete) return;

        setActionLoading(adToDelete.id);
        try {
            await directus.request(deleteItem('profiles', adToDelete.id));
            setAds(prev => prev.filter(item => item.id !== adToDelete.id));
            setAdToDelete(null);
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('Erro ao apagar anúncio. Tente novamente.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (ads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <Megaphone className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Você ainda não tem um anúncio</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Complete seu perfil para que ele apareça aqui e nas buscas do site.
                </p>
                <Link
                    to="/dashboard/profile"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                    Criar Perfil
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Meus Anúncios</h1>
                <p className="text-muted-foreground mt-1">
                    Gerencie a visibilidade e desempenho dos seus anúncios ({ads.length})
                </p>
            </div>

            <div className="space-y-6">
                {ads.map((ad, index) => (
                    <motion.div
                        key={ad.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                    >
                        <div className="flex flex-col md:flex-row">
                            {/* Image / Preview Section */}
                            <div className="w-full md:w-64 bg-muted h-48 md:h-auto flex items-center justify-center relative overflow-hidden">
                                {ad.main_photo ? (
                                    <img
                                        src={ad.main_photo?.startsWith('http')
                                            ? ad.main_photo
                                            : `${import.meta.env.VITE_DIRECTUS_URL}/assets/${ad.main_photo}?key=card-small`}
                                        alt={ad.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <span className="text-xs text-muted-foreground">Sem foto</span>
                                    </div>
                                )}

                                {(ad.is_featured || ad.is_sponsored) && (
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {ad.is_featured && (
                                            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Destaque
                                            </span>
                                        )}
                                        {ad.is_sponsored && (
                                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                Patrocinado
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="flex-1 p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-bold">{ad.display_name}</h2>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${ad.status === 'active'
                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                }`}>
                                                {ad.status === 'active' ? 'Ativo' : 'Oculto'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">ID: {ad.ad_id || 'Não definido'}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            to={`/profile/${ad.id}`}
                                            className="flex items-center gap-2 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground rounded-lg transition-colors text-sm font-medium"
                                            title="Ver como aparece no site"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Ver Anúncio
                                        </Link>
                                        <Link
                                            to="/dashboard/profile"
                                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleToggleVisibility(ad)}
                                            disabled={actionLoading === ad.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                            title={ad.status === 'active' ? 'Ocultar anúncio' : 'Tornar visível'}
                                        >
                                            {ad.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            {ad.status === 'active' ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                        <button
                                            onClick={() => setAdToDelete(ad)}
                                            disabled={actionLoading === ad.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                            title="Apagar anúncio permanentemente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Apagar
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Eye className="w-4 h-4" />
                                            <span className="text-xs font-medium">Visualizações</span>
                                        </div>
                                        <p className="text-2xl font-bold">{ad.views.toLocaleString()}</p>
                                    </div>

                                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <MousePointerClick className="w-4 h-4" />
                                            <span className="text-xs font-medium">Cliques (WhatsApp)</span>
                                        </div>
                                        <p className="text-2xl font-bold">{ad.clicks.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {adToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Apagar Anúncio?</h3>
                                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Tem certeza que deseja apagar permanentemente o anúncio <strong>{adToDelete.display_name}</strong>?
                            Todos os dados, fotos e estatísticas serão perdidos.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setAdToDelete(null)}
                                disabled={actionLoading === adToDelete.id}
                                className="flex-1 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground rounded-lg transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading === adToDelete.id}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading === adToDelete.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Apagando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Apagar
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
