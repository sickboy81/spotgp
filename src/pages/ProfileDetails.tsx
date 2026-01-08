import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { directus } from '@/lib/directus';
import { readItems, readItem } from '@directus/sdk';
import { Play, MapPin, Check, Instagram, Send, Twitter, Phone, Share2, Heart, Sparkles, Award, Monitor, Gamepad2, Users } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MOCK_PROFILES } from '@/lib/mock-data';
import { ReportModal } from '@/components/features/report/ReportModal';
import { recordProfileView } from '@/lib/api/views';
import { recordProfileClick } from '@/lib/api/analytics';
import { useAuth } from '@/hooks/useAuth';
import { SEOHead } from '@/components/features/seo/SEOHead';
import { ProfileData } from '@/lib/api/profile';
import { sanitizeInput } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Define a type that matches what we expect from Directus
type ProfileWithMedia = ProfileData & {
    id: string;
    verified?: boolean;
    media?: Array<{ url: string; type: string }>;
    map_lat?: number | string;
    map_lng?: number | string;
};

export default function ProfileDetails() {
    const params = useParams<{ id: string; username: string }>();
    const id = params.id;
    const username = params.username;
    const navigate = useNavigate();

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { user } = useAuth();

    // NEW: Coords state
    const [coords, setCoords] = useState<[number, number] | null>(null);

    // React Query for Caching
    const { data: profile, isLoading } = useQuery<ProfileWithMedia | null>({
        queryKey: ['profile', id || username],
        queryFn: async () => {
            const identifier = id || username;
            if (!identifier) return null;

            // Handle Mocks
            if (identifier.startsWith('mock-') || (username && username.startsWith('mock-'))) {
                const mockProfile = MOCK_PROFILES.find(p =>
                    p.id === identifier || p.username === identifier
                );
                if (mockProfile) return mockProfile as any;
                if (username) return null;
            }

            try {
                let profileData: any = null;

                // Fetch Profile
                if (username) {
                    const profiles = await directus.request(readItems('profiles', {
                        filter: { username: { _eq: username } },
                        limit: 1
                    }));
                    if (profiles.length > 0) {
                        profileData = profiles[0];
                    }
                } else if (id) {
                    profileData = await directus.request(readItem('profiles', id));
                }

                if (!profileData) return null; // Not found

                // Helper to parse JSON fields safely
                const parseJsonField = (field: any) => {
                    if (Array.isArray(field)) return field;
                    if (typeof field === 'string') {
                        try {
                            return JSON.parse(field);
                        } catch (e) {
                            return []; // or return [field] if it's a simple string?
                        }
                    }
                    return [];
                };

                // Parse attributes
                profileData.hairColor = parseJsonField(profileData.hairColor);
                profileData.bodyType = parseJsonField(profileData.bodyType);
                profileData.stature = parseJsonField(profileData.stature);
                profileData.breastType = parseJsonField(profileData.breastType);
                profileData.pubisType = parseJsonField(profileData.pubisType);

                // Aggregate Services
                const services: string[] = [
                    ...(parseJsonField(profileData.escortServices) || []),
                    ...(parseJsonField(profileData.massageTypes) || []),
                    ...(parseJsonField(profileData.onlineServices) || [])
                ];
                // Remove duplicates
                profileData.services = Array.from(new Set(services));

                // Add special services and other missing lists if they exist
                const extraServices: string[] = [
                    ...(parseJsonField(profileData.escortSpecialServices) || []),
                    ...(parseJsonField(profileData.otherServices) || [])
                ];
                if (extraServices.length > 0) {
                    profileData.services = Array.from(new Set([...profileData.services, ...extraServices]));
                }

                // Fetch Media associated with this profile
                let mediaList: any[] = [];
                try {
                    mediaList = await directus.request(readItems('media', {
                        filter: { profile_id: { _eq: profileData.id } },
                        sort: ['-date_created'], // Directus uses date_created
                    }));
                } catch (e) {
                    console.warn('Failed to fetch media for profile', profileData.id, e);
                }

                // Transform media to expected format
                let formattedMedia = mediaList.map((m: any) => ({
                    type: m.type || 'image',
                    url: `${import.meta.env.VITE_DIRECTUS_URL}/assets/${m.file}`
                }));

                // Merge with 'photos' field if available (New system)
                if (profileData.photos) {
                    let photoUrls: any[] = [];
                    if (Array.isArray(profileData.photos)) {
                        photoUrls = profileData.photos.map((url: string) => ({
                            type: 'image',
                            url: url.startsWith('http') ? url : `${import.meta.env.VITE_DIRECTUS_URL}/assets/${url}`
                        }));
                    } else if (typeof profileData.photos === 'string') {
                        try {
                            const parsed = JSON.parse(profileData.photos);
                            if (Array.isArray(parsed)) {
                                photoUrls = parsed.map((url: string) => ({
                                    type: 'image',
                                    url: url.startsWith('http') ? url : `${import.meta.env.VITE_DIRECTUS_URL}/assets/${url}`
                                }));
                            }
                        } catch (e) {
                            // Ignore
                        }
                    }
                    // Add to beginning
                    formattedMedia = [...photoUrls, ...formattedMedia];
                }

                return {
                    ...profileData,
                    media: formattedMedia
                } as ProfileWithMedia;

            } catch (err: unknown) {
                console.error("Error fetching profile", err);
                return null;
            }
        },
        enabled: !!(id || username),
        staleTime: 1000 * 60 * 5,
        retry: false
    });

    const mediaList = profile?.media;
    const activeMedia = profile?.media?.[0]?.url || null;

    // Scroll to top immediately when component mounts or route changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id, username]);

    // Geocoding Effect (Updated)
    useEffect(() => {
        // Priority 1: Explicit Coordinates from Profile (Saved from Map or Geocoded on Save)
        if (profile?.latitude && profile?.longitude) {
            setCoords([Number(profile.latitude), Number(profile.longitude)]);
            return;
        }

        // Priority 2: Legacy map fields
        if (profile?.map_lat && profile?.map_lng) {
            setCoords([Number(profile.map_lat), Number(profile.map_lng)]);
            return;
        }

        // Priority 3: Geocode City
        if (profile?.city) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.city + ', ' + (profile.state || 'Brasil'))}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    } else {
                        // Default to Sao Paulo if not found
                        setCoords([-23.5505, -46.6333]);
                    }
                })
                .catch(err => {
                    console.error("Geocoding error:", err);
                    setCoords([-23.5505, -46.6333]);
                });
        }
    }, [profile?.city, profile?.state, profile?.latitude, profile?.longitude, profile?.map_lat, profile?.map_lng]);

    // Record profile view when profile loads
    useEffect(() => {
        if (profile?.id && !String(profile.id).startsWith('mock-')) {
            recordProfileView(String(profile.id), user?.id || null).catch(err => {
                console.warn('Failed to record profile view:', err);
            });
        }
    }, [profile?.id, user?.id]);


    // Lightbox Handlers
    const openLightbox = (mediaUrl: string) => {
        setLightboxMedia(mediaUrl);
        setIsLightboxOpen(true);
    };
    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setLightboxMedia(null);
    };

    const nextMedia = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!mediaList || !lightboxMedia) return;
        const currentIndex = mediaList.findIndex(m => m.url === lightboxMedia);
        const nextIndex = (currentIndex + 1) % mediaList.length;
        setLightboxMedia(mediaList[nextIndex].url);
    }, [mediaList, lightboxMedia]);

    const prevMedia = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!mediaList || !lightboxMedia) return;
        const currentIndex = mediaList.findIndex(m => m.url === lightboxMedia);
        const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
        setLightboxMedia(mediaList[prevIndex].url);
    }, [mediaList, lightboxMedia]);
    // Share Handler
    const handleShare = async () => {
        const shareData = {
            title: `${profile?.display_name || 'Perfil'} - SpotGP`,
            text: `Confira o perfil de ${profile?.display_name || 'acompanhante'} no SpotGP!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            // Optionally add a toast/alert here if we had a toast system ready
            alert('Link copiado para a área de transferência!');
        }
    };

    // Helper functions
    const getWhatsAppLink = (phoneNumber: string | null | undefined, displayName: string | null | undefined): string | null => {
        if (!phoneNumber) return null;
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        let formattedPhone = cleanPhone;
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }
        const advertiserName = displayName || 'você';
        const message = `Olá ${advertiserName}, eu vi o seu anúncio no SpotGP, e gostaria de conhecer você.`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextMedia();
            if (e.key === 'ArrowLeft') prevMedia();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, nextMedia, prevMedia]);

    if (isLoading) {
        return (
            <>
                <SEOHead
                    title="Carregando..."
                    description="Carregando informações do perfil"
                />
                <div className="min-h-screen flex items-center justify-center">Loading...</div>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <SEOHead
                    title="Perfil não encontrado - SpotGP"
                    description="O perfil solicitado não foi encontrado"
                />
                <div className="min-h-screen flex items-center justify-center">Profile not found</div>
            </>
        );
    }

    const mainImage = profile.media?.find(m => m.type === 'image')?.url || '';
    const seoImage = mainImage || (typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg');

    const isVideo = lightboxMedia ? mediaList?.find((m) => m.url === lightboxMedia)?.type === 'video' : false;

    return (
        <>
            <SEOHead
                title={`${profile.display_name || 'Perfil'} - SpotGP`}
                description={profile.bio || `Perfil de ${profile.display_name || 'acompanhante'}. ${profile.city ? `Localizada em ${profile.city}` : ''}`}
                image={seoImage}
                url={typeof window !== 'undefined' ? `${window.location.origin}/profile/${profile.id}` : `/profile/${profile.id}`}
                type="profile"
                profileName={profile.display_name || undefined}
                profilePrice={profile.price}
                profileCity={profile.city}
            />
            <div className="min-h-screen bg-background pb-20 pt-16 md:pt-0">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="fixed top-4 md:top-6 left-4 z-50 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors shadow-lg border border-white/10"
                >
                    <div className="flex items-center gap-1 pr-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        <span className="text-sm font-medium font-serif">Voltar</span>
                    </div>
                </button>

                {/* Mobile Share Button */}
                <button
                    onClick={handleShare}
                    className="fixed top-4 md:hidden right-4 z-50 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors shadow-lg border border-white/10"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                {/* LIGHTBOX OVERLAY */}
                {isLightboxOpen && lightboxMedia && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={closeLightbox}>
                        <button onClick={closeLightbox} className="absolute top-4 right-4 p-4 text-white hover:text-primary transition-colors z-50">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>

                        {mediaList && mediaList.length > 1 && (
                            <>
                                <button onClick={prevMedia} className="absolute left-4 p-4 text-white hover:text-primary transition-colors hidden md:block z-50">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                <button onClick={nextMedia} className="absolute right-4 p-4 text-white hover:text-primary transition-colors hidden md:block z-50">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </>
                        )}

                        <div className="w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center relative">
                            {isVideo ? (
                                <div className="relative max-w-full max-h-full">
                                    <video src={lightboxMedia} controls autoPlay className="max-w-full max-h-full object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
                                    {/* Watermark Overlay */}
                                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-30 pointer-events-none select-none">
                                        <div className="relative transform -rotate-12">
                                            <span className="text-white font-black uppercase text-[8vw] md:text-[4vw] tracking-wider opacity-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                SpotGP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative max-w-full max-h-full">
                                    <img src={lightboxMedia} alt="Full view" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
                                    {/* Watermark Overlay */}
                                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-30 pointer-events-none select-none">
                                        <div className="relative transform -rotate-12">
                                            <span className="text-white font-black uppercase text-[8vw] md:text-[4vw] tracking-wider opacity-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                SpotGP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="container max-w-7xl mx-auto px-0 md:px-6 md:py-8">
                    <div className="grid md:grid-cols-[1.4fr_1fr] gap-0 md:gap-10 lg:gap-16 items-start">

                        {/* LEFT COLUMN - MEDIA */}
                        <div className="relative md:sticky md:top-6 self-start">
                            <div
                                className="relative aspect-[3/4] md:aspect-auto md:h-[85vh] md:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5 cursor-zoom-in group"
                                onClick={() => {
                                    if (mediaList && mediaList[0]) {
                                        openLightbox(mediaList[0].url);
                                    }
                                }}
                            >
                                {/* Hover hint */}
                                <div className="absolute inset-0 z-30 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                    <span className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 15 6 6m-11-4a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM8 8l4 4m0-4-4 4" /></svg>
                                        Expandir
                                    </span>
                                </div>

                                {/* Media Viewer */}
                                <div className="relative h-full bg-black flex items-center justify-center overflow-hidden">
                                    {isVideo ? (
                                        <video
                                            src={activeMedia!}
                                            className="h-full w-full object-cover"
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={activeMedia || 'https://via.placeholder.com/800x600'}
                                            alt={profile.display_name || 'Profile'}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    {/* Watermark */}
                                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-30 pointer-events-none select-none">
                                        <div className="relative transform -rotate-12">
                                            <span className="text-white font-black uppercase text-[8vw] md:text-[4vw] tracking-wider opacity-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                SpotGP
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Info Overlay (Gradient) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 md:hidden pointer-events-none" />
                                <div className="absolute bottom-6 left-6 right-6 md:hidden text-white z-20 pointer-events-none">
                                    <h1 className="text-4xl font-serif font-bold mb-1 leading-none">{profile.display_name}</h1>
                                    {profile.ad_id && (
                                        <p className="text-xs text-white/70 mb-1 font-mono">ID: {profile.ad_id}</p>
                                    )}
                                    <p className="text-lg opacity-90 font-medium">{profile.age} anos • {sanitizeInput(profile.city || '')}</p>
                                </div>
                            </div>

                            {/* Thumbs Mobile */}
                            <div className="flex md:hidden mt-4 px-4 space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                                {mediaList?.slice(1).map((media, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => openLightbox(media.url)}
                                        className="relative flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 border-border opacity-70 hover:opacity-100 transition-all"
                                    >
                                        <img src={media.type === 'video' ? '/video-placeholder.png' : media.url} alt="" className="h-full w-full object-cover" />
                                        {media.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play className="w-6 h-6 text-white fill-white opacity-80" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Thumbs Desktop */}
                            <div className="hidden md:flex mt-6 space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                                {mediaList?.slice(1).map((media, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => openLightbox(media.url)}
                                        className="relative flex-shrink-0 h-24 w-24 rounded-xl overflow-hidden border-2 border-transparent opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all transform hover:scale-105"
                                    >
                                        <img src={media.type === 'video' ? '/video-placeholder.png' : media.url} alt="" className="h-full w-full object-cover" />
                                        {media.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play className="w-8 h-8 text-white fill-white opacity-80" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN - INFO */}
                        <div className="px-6 py-8 md:p-0 md:pt-4 space-y-10">
                            {/* Header (Desktop) */}
                            <div className="hidden md:block pb-8 border-b border-border/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-6xl font-serif font-bold text-foreground tracking-tight">{sanitizeInput(profile.display_name || '')}</h1>
                                            {profile.verified && <Check className="w-8 h-8 text-blue-500" />}
                                        </div>
                                        {profile.ad_id && (
                                            <p className="text-sm text-muted-foreground font-mono mb-2">ID: {profile.ad_id}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-muted-foreground text-xl">
                                            <div className="flex items-center gap-1 text-primary">
                                                <MapPin className="w-5 h-5 fill-current" />
                                                <span className="font-semibold">{sanitizeInput(profile.city || 'São Paulo')}</span>
                                            </div>
                                            {/* <span className="text-border">•</span>
                                            <span className="text-green-500 flex items-center gap-1.5 font-medium text-sm bg-green-500/10 px-3 py-1 rounded-full">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                Online Agora
                                            </span> */}
                                        </div>
                                    </div>
                                    {/* Desktop Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="p-3 bg-secondary/50 hover:bg-secondary text-foreground rounded-full transition-all hover:scale-105"
                                        title="Compartilhar Perfil"
                                    >
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                    <div className="text-center bg-gradient-to-br from-card to-background border border-border p-5 rounded-2xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <span className="block text-5xl font-bold font-serif text-primary mb-1">{profile.age || 23}</span>
                                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Anos</span>
                                    </div>
                                </div>
                            </div>

                            {/* About Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-foreground">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/20 rounded-full" />
                                    Sobre Mim
                                </h3>
                                <div className="prose prose-invert prose-lg text-muted-foreground/90 leading-relaxed font-light">
                                    <p>{sanitizeInput(profile.bio || 'Olá! Sou uma pessoa carinhosa e divertida, pronta para realizar seus desejos...')}</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Atributos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Altura</span>
                                        <span className="font-serif text-xl text-foreground">{profile.height || '1.70m'}</span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Peso</span>
                                        <span className="font-serif text-xl text-foreground">{profile.weight || '60kg'}</span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Cabelo</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {(Array.isArray(profile.hairColor) && profile.hairColor.length > 0 ? profile.hairColor.join(', ') : (profile.hairColor || 'Não informado'))}
                                        </span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Estatura</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {(Array.isArray(profile.stature) && profile.stature.length > 0 ? profile.stature.join(', ') : (profile.stature || 'Não informado'))}
                                        </span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Etnia</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {Array.isArray(profile.ethnicity) ? profile.ethnicity.join(', ') : (profile.ethnicity || 'Não informado')}
                                        </span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Corpo</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {(Array.isArray(profile.bodyType) && profile.bodyType.length > 0 ? profile.bodyType.join(', ') : (profile.bodyType || 'Não informado'))}
                                        </span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Seios</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {(Array.isArray(profile.breastType) && profile.breastType.length > 0 ? profile.breastType.join(', ') : (profile.breastType || 'Não informado'))}
                                        </span>
                                    </div>
                                    <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Púbis</span>
                                        <span className="font-serif text-xl text-foreground">
                                            {(Array.isArray(profile.pubisType) && profile.pubisType.length > 0 ? profile.pubisType.join(', ') : (profile.pubisType || 'Não informado'))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Neighborhoods (Locais que atendo) */}
                            {profile.service_neighborhoods && profile.service_neighborhoods.length > 0 && (
                                <div className="space-y-6 pt-4 border-t border-border/30">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <h3 className="text-xl font-serif font-bold text-foreground">Locais que Atendo</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.service_neighborhoods.map((neigh: string) => (
                                            <span key={neigh} className="px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-sm border border-border">
                                                {neigh}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category Specific Services */}
                            <div className="space-y-8">

                                {/* Generic 'Atende a' for all */}
                                {profile.category !== 'Atendimento Online' && profile.serviceTo && profile.serviceTo.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary" />
                                            <h3 className="text-2xl font-serif font-bold text-foreground">Atende a</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.serviceTo.map((s: string) => (
                                                <span key={s} className="px-5 py-2.5 rounded-xl bg-card text-foreground border border-border transition-all cursor-default font-medium shadow-sm">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Acompanhante Services */}
                                {(!profile.category || profile.category === 'Acompanhante') && (
                                    <>
                                        {profile.escortServices && profile.escortServices.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Serviços</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.escortServices.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {profile.oralSex && (
                                                        <span className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-bold shadow-sm">
                                                            {profile.oralSex}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {profile.escortSpecialServices && profile.escortSpecialServices.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Serviços Especiais</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.escortSpecialServices.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Massagista Services */}
                                {profile.category === 'Massagista' && (
                                    <>
                                        {/* Certificate Badge */}
                                        {profile.certified_masseuse && (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 mb-4">
                                                <Award className="w-4 h-4" />
                                                <span className="font-bold text-sm">Massagista Certificada</span>
                                            </div>
                                        )}

                                        {profile.massageTypes && profile.massageTypes.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Award className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Tipos de Massagem</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.massageTypes.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.happyEnding && profile.happyEnding.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Final Feliz</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.happyEnding.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.otherServices && profile.otherServices.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Outros Serviços</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.otherServices.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Online Services */}
                                {profile.category === 'Atendimento Online' && (
                                    <>
                                        {profile.onlineServices && profile.onlineServices.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Serviços Online</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.onlineServices.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.virtualFantasies && profile.virtualFantasies.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Gamepad2 className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Fantasias Virtuais</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.virtualFantasies.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.onlineServiceTo && profile.onlineServiceTo.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-primary" />
                                                    <h3 className="text-2xl font-serif font-bold text-foreground">Atende a</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {profile.onlineServiceTo.map((s: string) => (
                                                        <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Location & Map Section - LEAFLET */}
                            <div className="space-y-6 pt-8 border-t border-border/50">
                                <h3 className="text-2xl font-serif font-bold text-foreground">Atendimento</h3>
                                <div className="flex gap-4 mb-6">
                                    {profile.hasPlace !== false && (
                                        <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                            <span>Com local</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>Viagens</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>Hotéis/Motéis</span>
                                    </div>
                                </div>

                                <div className="rounded-2xl overflow-hidden border border-border/50 shadow-md h-72 w-full bg-muted relative group z-0">
                                    {coords ? (
                                        <MapContainer
                                            center={coords}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={coords}>
                                                <Popup>
                                                    {profile.city || 'Localização aproximada'}
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                                            Carregando mapa...
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-sm px-4 py-2 rounded-lg shadow-lg font-medium z-[400]">
                                        <MapPin className="w-4 h-4 inline-block mr-1 text-primary" />
                                        {profile.city || 'São Paulo'}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods Section */}
                            {profile.payment_methods && profile.payment_methods.length > 0 && (
                                <div className="space-y-6 pt-8 border-t border-border/50">
                                    <h3 className="text-2xl font-serif font-bold text-foreground">Formas de Pagamento</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {profile.payment_methods.map((method: string) => (
                                            <div key={method} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="font-medium">{method}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Desktop Contact CTA - Side by Side WhatsApp & Telegram */}
                            <div className="hidden md:flex flex-col gap-4 pt-8">
                                <div className={cn(
                                    "grid gap-3",
                                    (profile.accepts_whatsapp !== false && profile.accepts_telegram !== false && profile.telegram) ? "grid-cols-2" : "grid-cols-1"
                                )}>
                                    {/* WhatsApp Button */}
                                    {getWhatsAppLink(profile.phone, profile.display_name) && profile.accepts_whatsapp !== false && (
                                        <a
                                            href={getWhatsAppLink(profile.phone, profile.display_name) || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                if (profile?.id && !String(profile.id).startsWith('mock-')) {
                                                    recordProfileClick(String(profile.id), 'whatsapp', user?.id || null).catch(console.warn);
                                                }
                                            }}
                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                            WhatsApp
                                        </a>
                                    )}

                                    {/* Telegram Button */}
                                    {profile.telegram && profile.accepts_telegram !== false && (
                                        <a
                                            href={`https://t.me/${profile.telegram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                if (profile?.id && !String(profile.id).startsWith('mock-')) {
                                                    recordProfileClick(String(profile.id), 'telegram', user?.id || null).catch(console.warn);
                                                }
                                            }}
                                            className="bg-[#0088cc] text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0077b5] transition-colors shadow-md hover:shadow-lg font-bold text-lg"
                                        >
                                            <Send className="w-5 h-5" />
                                            Telegram
                                        </a>
                                    )}

                                    {/* Instagram Button */}
                                    {profile.instagram && (
                                        <a
                                            href={`https://instagram.com/${profile.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                if (profile?.id && !String(profile.id).startsWith('mock-')) {
                                                    recordProfileClick(String(profile.id), 'instagram', user?.id || null).catch(console.warn);
                                                }
                                            }}
                                            className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white py-3 rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Instagram className="w-5 h-5" />
                                            Instagram
                                        </a>
                                    )}

                                    {/* Twitter Button */}
                                    {profile.twitter && (
                                        <a
                                            href={`https://twitter.com/${profile.twitter}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                                        >
                                            <Twitter className="w-5 h-5" />
                                            Twitter
                                        </a>
                                    )}

                                    {/* Call Button */}
                                    {profile.phone && profile.accepts_calls !== false && (
                                        <a
                                            href={`tel:${profile.phone}`}
                                            className="bg-card border border-border text-foreground hover:bg-muted py-3 rounded-xl flex items-center justify-center font-bold gap-2 transition-colors"
                                        >
                                            <Phone className="w-5 h-5" />
                                            Ligar
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Report Modal */}
                            {profile && (
                                <ReportModal
                                    isOpen={isReportModalOpen}
                                    onClose={() => setIsReportModalOpen(false)}
                                    profileId={profile.id}
                                    profileName={profile.display_name || 'Perfil'}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
