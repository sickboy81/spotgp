import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Play, MapPin, Check, Instagram, Send, Flag, MessageSquare } from 'lucide-react';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { ReportModal } from '@/components/features/report/ReportModal';
import { recordProfileView } from '@/lib/api/views';
import { recordProfileClick } from '@/lib/api/analytics';
import { useAuth } from '@/hooks/useAuth';
import { getRecommendedProfiles, RecommendedProfile } from '@/lib/api/recommendations';
import { SEOHead } from '@/components/features/seo/SEOHead';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
    media?: Database['public']['Tables']['media']['Row'][];
    telegram?: string;
    instagram?: string;
    chat_enabled?: boolean | null;
};

export default function ProfileDetails() {
    const params = useParams<{ id: string; username: string }>();
    const id = params.id;
    const username = params.username;
    const navigate = useNavigate();

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activeMedia, setActiveMedia] = useState<string | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [recommendedProfiles, setRecommendedProfiles] = useState<RecommendedProfile[]>([]);
    const { user } = useAuth();

    // React Query for Caching
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', id || username],
        queryFn: async () => {
            const identifier = id || username;
            if (!identifier) return null;

            // Handle Mocks
            if (identifier.startsWith('mock-') || username) {
                const mockProfile = MOCK_PROFILES.find(p =>
                    p.id === identifier || p.username === identifier
                );
                if (mockProfile) return mockProfile;
                if (username) return null;
            }

            // Handle Supabase
            let query = supabase
                .from('profiles')
                .select(`
                  *,
                  media (
                    type,
                    url
                  )
                `);

            if (username) {
                query = query.eq('username', username);
            } else if (id) {
                query = query.eq('id', id);
            }

            const { data, error } = await query.single();
            if (error) throw error;
            return data;
        },
        enabled: !!(id || username),
        staleTime: 1000 * 60 * 5,
    });

    const mediaList = profile?.media;

    // Scroll to top immediately when component mounts or route changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id, username]);

    // Record profile view when profile loads
    useEffect(() => {
        if (profile?.id && !profile.id.startsWith('mock-')) {
            recordProfileView(profile.id, user?.id || null).catch(err => {
                console.warn('Failed to record profile view:', err);
            });
        }
    }, [profile?.id, user?.id]);

    // Load recommended profiles
    useEffect(() => {
        if (profile?.id) {
            getRecommendedProfiles(profile.id, 4).then(profiles => {
                setRecommendedProfiles(profiles);
            }).catch(err => {
                console.warn('Failed to load recommendations:', err);
            });
        }
    }, [profile?.id]);

    useEffect(() => {
        if (profile?.media && profile.media.length > 0 && !activeMedia) {
            setActiveMedia(profile.media[0].url);
        }
    }, [profile, activeMedia]);

    // Lightbox Handlers
    const openLightbox = (mediaUrl: string) => {
        setLightboxMedia(mediaUrl);
        setIsLightboxOpen(true);
    };
    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setLightboxMedia(null);
    };

    const nextMedia = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!mediaList || !lightboxMedia) return;
        const currentIndex = mediaList.findIndex(m => m.url === lightboxMedia);
        const nextIndex = (currentIndex + 1) % mediaList.length;
        setLightboxMedia(mediaList[nextIndex].url);
    };

    const prevMedia = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!mediaList || !lightboxMedia) return;
        const currentIndex = mediaList.findIndex(m => m.url === lightboxMedia);
        const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
        setLightboxMedia(mediaList[prevIndex].url);
    };

    // Function to generate WhatsApp link with pre-filled message
    const getWhatsAppLink = (phoneNumber: string | null | undefined, displayName: string | null | undefined): string | null => {
        if (!phoneNumber) return null;
        
        // Remove all non-numeric characters
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Add country code if not present (Brazil = 55)
        let formattedPhone = cleanPhone;
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }
        
        // Create pre-filled message
        const advertiserName = displayName || 'você';
        const message = `Olá ${advertiserName}, eu vi o seu anúncio no site acompanhantesgora, e gostaria de conhecer você.`;
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Return WhatsApp link
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
    }, [isLightboxOpen, lightboxMedia, mediaList]);

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
                    title="Perfil não encontrado - ACOMPANHANTES AGORA"
                    description="O perfil solicitado não foi encontrado"
                />
                <div className="min-h-screen flex items-center justify-center">Profile not found</div>
            </>
        );
    }

    const mainImage = profile.media?.find((m: any) => m.type === 'image')?.url || '';
    const seoImage = mainImage || (typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg');

    const isVideo = lightboxMedia ? mediaList?.find((m) => m.url === lightboxMedia)?.type === 'video' : false;

    return (
        <>
            <SEOHead
                title={`${profile.display_name || 'Perfil'} - ACOMPANHANTES AGORA`}
                description={profile.description || `Perfil de ${profile.display_name || 'acompanhante'}. ${(profile as any).city ? `Localizada em ${(profile as any).city}` : ''}`}
                image={seoImage}
                url={typeof window !== 'undefined' ? `${window.location.origin}/profile/${profile.id}` : `/profile/${profile.id}`}
                type="profile"
                profileName={profile.display_name || undefined}
                profilePrice={(profile as any).price}
                profileCity={(profile as any).city}
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
                                            ACOMPANHANTES AGORA
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
                                            ACOMPANHANTES AGORA
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
                            {/* Desktop Hover Hint */}
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

                                {/* Watermark Overlay */}
                                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-30 pointer-events-none select-none">
                                    <div className="relative transform -rotate-12">
                                        <span className="text-white font-black uppercase text-[8vw] md:text-[4vw] tracking-wider opacity-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                            ACOMPANHANTES AGORA
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Info Overlay (Gradient) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 md:hidden pointer-events-none" />
                            <div className="absolute bottom-6 left-6 right-6 md:hidden text-white z-20 pointer-events-none">
                                <h1 className="text-4xl font-serif font-bold mb-1 leading-none">{profile.display_name}</h1>
                                {(profile as any).ad_id && (
                                    <p className="text-xs text-white/70 mb-1 font-mono">ID: {(profile as any).ad_id}</p>
                                )}
                                <p className="text-lg opacity-90 font-medium">{(profile as any).age} anos • {(profile as any).city}</p>
                            </div>
                        </div>

                        {/* Thumbs - Below Main Image (Mobile) */}
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

                        {/* Thumbs - Below Main Image (Desktop) */}
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
                                        <h1 className="text-6xl font-serif font-bold text-foreground tracking-tight">{profile.display_name}</h1>
                                        {profile.verified && <Check className="w-8 h-8 text-blue-500" />}
                                    </div>
                                    {(profile as any).ad_id && (
                                        <p className="text-sm text-muted-foreground font-mono mb-2">ID: {(profile as any).ad_id}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-muted-foreground text-xl">
                                        <div className="flex items-center gap-1 text-primary">
                                            <MapPin className="w-5 h-5 fill-current" />
                                            <span className="font-semibold">{(profile as any).city || 'São Paulo'}</span>
                                        </div>
                                        <span className="text-border">•</span>
                                        <span className="text-green-500 flex items-center gap-1.5 font-medium text-sm bg-green-500/10 px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            Online Agora
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center bg-gradient-to-br from-card to-background border border-border p-5 rounded-2xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                    <span className="block text-5xl font-bold font-serif text-primary mb-1">{(profile as any).age || 23}</span>
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
                                <p>{(profile as any).description || 'Olá! Sou uma pessoa carinhosa e divertida, pronta para realizar seus desejos...'}</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Atributos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Altura</span>
                                    <span className="font-serif text-xl text-foreground">{(profile as any).height || '1.70m'}</span>
                                </div>
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Peso</span>
                                    <span className="font-serif text-xl text-foreground">{(profile as any).weight || '60kg'}</span>
                                </div>
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Cabelo</span>
                                    <span className="font-serif text-xl text-foreground">Morena</span>
                                </div>
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Olhos</span>
                                    <span className="font-serif text-xl text-foreground">Castanhos</span>
                                </div>
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Etnia</span>
                                    <span className="font-serif text-xl text-foreground">Latina</span>
                                </div>
                                <div className="bg-card/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                                    <span className="block text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Pés</span>
                                    <span className="font-serif text-xl text-foreground">37</span>
                                </div>
                            </div>
                        </div>

                        {/* Services Tags */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-serif font-bold text-foreground">Meus Serviços</h3>
                            <div className="flex flex-wrap gap-3">
                                {((profile as any).services || ['Jantar', 'Viagens', 'Massagem', 'Namoradinha']).map((s: string) => (
                                    <span key={s} className="px-5 py-2.5 rounded-xl bg-card hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary transition-all cursor-default font-medium shadow-sm">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Location & Map Section */}
                        <div className="space-y-6 pt-8 border-t border-border/50">
                            <h3 className="text-2xl font-serif font-bold text-foreground">Atendimento</h3>
                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span>Com local</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span>Viagens</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground bg-card/50 px-4 py-2 rounded-lg border border-border/50">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span>Hotéis/Motéis</span>
                                </div>
                            </div>

                            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-md h-72 w-full bg-muted relative group">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    id="gmap_canvas"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent((profile as any).city || 'São Paulo')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    className="grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                                ></iframe>
                                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-sm px-4 py-2 rounded-lg shadow-lg font-medium">
                                    <MapPin className="w-4 h-4 inline-block mr-1 text-primary" />
                                    {(profile as any).city || 'São Paulo'}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Contact CTA */}
                        <div className="hidden md:flex flex-col gap-4 pt-8">
                            {getWhatsAppLink((profile as any).phone, profile.display_name) ? (
                                <a 
                                    href={getWhatsAppLink((profile as any).phone, profile.display_name) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        if (profile?.id && !profile.id.startsWith('mock-')) {
                                            recordProfileClick(profile.id, 'whatsapp', user?.id || null).catch(console.warn);
                                        }
                                    }}
                                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-5 rounded-2xl font-bold text-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    WhatsApp
                                </a>
                            ) : (
                                <button 
                                    disabled
                                    className="w-full bg-gray-400 text-white py-5 rounded-2xl font-bold text-xl cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    WhatsApp
                                </button>
                            )}

                            <button 
                                onClick={() => {
                                    if (profile?.id && !profile.id.startsWith('mock-')) {
                                        recordProfileClick(profile.id, 'phone', user?.id || null).catch(console.warn);
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-card border border-primary/50 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/10 transition-colors"
                            >
                                <span className="flex items-center gap-2 text-sm text-gray-400 font-normal">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Disponível
                                </span>
                                Ver Telefone
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                {(profile as any).telegram && (
                                    <a
                                        href={`https://t.me/${(profile as any).telegram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => {
                                            if (profile?.id && !profile.id.startsWith('mock-')) {
                                                recordProfileClick(profile.id, 'telegram', user?.id || null).catch(console.warn);
                                            }
                                        }}
                                        className="bg-[#0088cc] hover:bg-[#007ebd] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                    >
                                        <Send className="w-6 h-6" />
                                        Telegram
                                    </a>
                                )}
                                {(profile as any).instagram && (
                                    <a
                                        href={`https://instagram.com/${(profile as any).instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => {
                                            if (profile?.id && !profile.id.startsWith('mock-')) {
                                                recordProfileClick(profile.id, 'instagram', user?.id || null).catch(console.warn);
                                            }
                                        }}
                                        className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                    >
                                        <Instagram className="w-6 h-6" />
                                        Instagram
                                    </a>
                                )}
                                {profile?.id && !profile.id.startsWith('mock-') && (profile as any).chat_enabled !== false && (
                                    <Link
                                        to={`/messages/${profile.id}`}
                                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3 col-span-2"
                                    >
                                        <MessageSquare className="w-6 h-6" />
                                        Enviar Mensagem
                                    </Link>
                                )}
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3 col-span-2"
                                >
                                    <Flag className="w-6 h-6" />
                                    Denunciar Perfil
                                </button>
                            </div>

                            <p className="text-center text-xs text-muted-foreground mt-1">
                                Ao clicar você concorda com nossos termos de uso
                            </p>
                        </div>
                    </div>
                </div>

                {/* RELATED PROFILES */}
                {recommendedProfiles.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-border/30 px-4 md:px-0">
                        <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
                            <span className="text-primary">✦</span> Você também pode gostar
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {recommendedProfiles.map((recProfile) => {
                                const mainImage = recProfile.media?.find(m => m.type === 'image')?.url || 'https://via.placeholder.com/400x600?text=Profile';
                                return (
                                    <Link
                                        key={recProfile.id}
                                        to={`/profile/${recProfile.id}`}
                                        className="aspect-[3/4] bg-card rounded-2xl border border-border/50 overflow-hidden relative group cursor-pointer hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <img
                                            src={mainImage}
                                            alt={recProfile.display_name || 'Profile'}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="font-bold text-white text-sm mb-1">{recProfile.display_name}</h3>
                                            <div className="flex items-center justify-between text-xs text-white/90">
                                                <span>{recProfile.city}</span>
                                                {recProfile.price && (
                                                    <span className="font-bold">R$ {recProfile.price}</span>
                                                )}
                                            </div>
                                        </div>
                                        {recProfile.verified && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-primary rounded-full p-1.5">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border z-40 md:hidden grid grid-cols-4 gap-3">
                {getWhatsAppLink((profile as any).phone, profile.display_name) ? (
                    <a 
                        href={getWhatsAppLink((profile as any).phone, profile.display_name) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            if (profile?.id && !profile.id.startsWith('mock-')) {
                                recordProfileClick(profile.id, 'whatsapp', user?.id || null).catch(console.warn);
                            }
                        }}
                        className="col-span-2 bg-[#25D366] text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        WhatsApp
                    </a>
                ) : (
                    <button 
                        disabled
                        className="col-span-2 bg-gray-400 text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg cursor-not-allowed"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        WhatsApp
                    </button>
                )}
                {/* Mobile Extra Buttons */}
                {(profile as any).telegram && (
                    <a 
                        href={`https://t.me/${(profile as any).telegram}`}
                        onClick={() => {
                            if (profile?.id && !profile.id.startsWith('mock-')) {
                                recordProfileClick(profile.id, 'telegram', user?.id || null).catch(console.warn);
                            }
                        }}
                        className="bg-[#0088cc] text-white rounded-xl flex items-center justify-center"
                    >
                        <Send className="w-6 h-6" />
                    </a>
                )}
                {(profile as any).instagram && (
                    <a 
                        href={`https://instagram.com/${(profile as any).instagram}`}
                        onClick={() => {
                            if (profile?.id && !profile.id.startsWith('mock-')) {
                                recordProfileClick(profile.id, 'instagram', user?.id || null).catch(console.warn);
                            }
                        }}
                        className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-xl flex items-center justify-center"
                    >
                        <Instagram className="w-6 h-6" />
                    </a>
                )}
                <button className="bg-card border border-border text-foreground rounded-xl flex items-center justify-center font-bold">
                    Ligar
                </button>
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
        </>
    );
}
