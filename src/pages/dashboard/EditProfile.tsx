import { useState, useEffect } from 'react';
import { GENDERS, SERVICE_LOCATIONS, HAIR_COLORS, BODY_TYPES, ETHNICITIES, STATURES, BREAST_TYPES, PUBIS_TYPES } from '@/lib/constants/profile-options';
import { BRAZILIAN_CITIES } from '@/lib/constants/brazilian-cities';
import { CITY_NEIGHBORHOODS } from '@/lib/constants/neighborhoods';
import { getStateAbbreviation } from '@/lib/constants/brazilian-states';
import { ADVERTISER_CATEGORIES } from '@/lib/constants/categories';
import { SERVICE_TO, MASSAGE_TYPES, HAPPY_ENDING, OTHER_SERVICES } from '@/lib/constants/massage-options';
import { ESCORT_SERVICES, ESCORT_SPECIAL_SERVICES, ORAL_SEX_OPTIONS } from '@/lib/constants/escort-options';
import { ONLINE_SERVICES, ONLINE_SERVICE_TO, VIRTUAL_FANTASIES, FOR_SALE } from '@/lib/constants/online-options';
import { geocodeAddress, geocodeWithNominatim } from '@/lib/services/geocoding';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { MapPin, DollarSign, Home, CheckCircle, XCircle, Loader2, Phone, FileText, Clock, Camera, Play, Volume2, AlertTriangle, Users, User, Heart, Sparkles, Award, Monitor, ShoppingCart, Gamepad2, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile, saveProfile, ProfileData } from '@/lib/api/profile';
import { PhotoGrid, PhotoItem } from '@/components/features/media/PhotoGrid';
import { VideoGrid, VideoItem } from '@/components/features/media/VideoGrid';
import { MediaRulesModal } from '@/components/features/media/MediaRulesModal';
import { PriceTable } from '@/components/features/media/PriceTable';
import { AudioUploader } from '@/components/features/media/AudioUploader';
import { compressProfilePhoto } from '@/lib/imageCompression';
import { uploadToR2 } from '@/lib/services/r2-storage';

export default function EditProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const [profile, setProfile] = useState<ProfileData>({
        category: '',
        display_name: '',
        title: '',
        bio: '',
        username: '',
        city: '',
        state: '',
        neighborhood: '',
        street_address: '',
        address_reference: '',
        latitude: undefined,
        longitude: undefined,
        phone: '',
        telegram: '',
        instagram: '',
        twitter: '',
        price: 0,
        prices: [{ description: '1 hora', price: 0 }],
        age: 0,
        gender: '',
        height: '',
        weight: '',
        hairColor: [],
        bodyType: [],
        ethnicity: '', // Changed to string for single select dropdown
        stature: [],
        breastType: [],
        pubisType: [],
        services: [],
        paymentMethods: [],
        hasPlace: undefined,
        videoCall: false,
        chat_enabled: true,
        schedule_24h: false,
        schedule_from: '09:00',
        schedule_to: '18:00',
        schedule_same_everyday: true,
        audio_url: '',
        weekly_schedule: {
            monday: { enabled: true, from: '09:00', to: '18:00' },
            tuesday: { enabled: true, from: '09:00', to: '18:00' },
            wednesday: { enabled: true, from: '09:00', to: '18:00' },
            thursday: { enabled: true, from: '09:00', to: '18:00' },
            friday: { enabled: true, from: '09:00', to: '18:00' },
            saturday: { enabled: true, from: '09:00', to: '18:00' },
            sunday: { enabled: true, from: '09:00', to: '18:00' },
        },
        // Campos específicos para massagistas
        massageTypes: [],
        otherServices: [],
        happyEnding: [],
        facilities: [],
        serviceTo: [],
        serviceLocations: [],
        certified_masseuse: false,

        // Campos específicos para acompanhantes
        escortServices: [],
        escortSpecialServices: [],
        oralSex: '',

        // Campos específicos para atendimento online
        onlineServices: [],
        onlineServiceTo: [],
        virtualFantasies: [],
        forSale: [],

        // Campos de Mapa
        map_address: '',
        map_coordinates: null,
        map_location_type: 'exact',
        map_region_string: '',
    });

    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedAge, setAcceptedAge] = useState(false);
    const [showMediaRules, setShowMediaRules] = useState(false);

    // Derived Data
    // Handlers

    // Load profile on mount
    useEffect(() => {
        const loadProfileData = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const data = await loadProfile(user.id);
                if (data) {
                    setProfile(prev => ({
                        ...prev,
                        ...data,
                        // Ensure arrays are initialized if missing in DB
                        hairColor: data.hairColor || [],
                        bodyType: data.bodyType || [],
                        stature: data.stature || [],
                        breastType: data.breastType || [],
                        pubisType: data.pubisType || [],
                        serviceTo: data.serviceTo || [],
                        escortServices: data.escortServices || [],
                        escortSpecialServices: data.escortSpecialServices || [],
                        massageTypes: data.massageTypes || [],
                        otherServices: data.otherServices || [],
                        happyEnding: data.happyEnding || [],
                        onlineServices: data.onlineServices || [],
                        onlineServiceTo: data.onlineServiceTo || [],
                        virtualFantasies: data.virtualFantasies || [],
                        forSale: data.forSale || [],
                        map_coordinates: data.map_coordinates || null,
                        map_location_type: data.map_location_type || 'exact',
                        map_region_string: data.map_region_string || '',
                    }));

                    // Initialize media from profile data (assuming URLs are stored in profile)
                    // We assume profile.photos and profile.videos are arrays of strings (URLs)
                    if (Array.isArray(data.photos)) {
                        setPhotos(data.photos.map((url: string) => ({ url })));
                    } else if (data.photos) {
                        try {
                            // Handle if it's JSON string
                            const parsed = typeof data.photos === 'string' ? JSON.parse(data.photos) : data.photos;
                            if (Array.isArray(parsed)) {
                                setPhotos(parsed.map((url: string) => ({ url })));
                            }
                        } catch (e) { console.warn("Error parsing photos", e); }
                    }

                    if (Array.isArray(data.videos)) {
                        setVideos(data.videos.map((url: string) => ({ url })));
                    } else if (data.videos) {
                        try {
                            const parsed = typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos;
                            if (Array.isArray(parsed)) {
                                setVideos(parsed.map((url: string) => ({ url })));
                            }
                        } catch (e) { console.warn("Error parsing videos", e); }
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadProfileData();
        }
    }, [user?.id]);




    const toggleArrayItem = (field: 'hairColor' | 'bodyType' | 'stature' | 'breastType' | 'pubisType' | 'paymentMethods' | 'massageTypes' | 'otherServices' | 'happyEnding' | 'facilities' | 'serviceTo' | 'serviceLocations' | 'escortServices' | 'escortSpecialServices' | 'onlineServices' | 'onlineServiceTo' | 'virtualFantasies' | 'forSale', value: string) => {
        setProfile(prev => {
            const current = (prev[field] as string[]) || []; // Assert as string array
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter((item: string) => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleLocationSearch = async (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        const query = (e.currentTarget as HTMLInputElement).value;
        if (!query || (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter')) return;

        // Prevent default only on Enter to avoid form submission if wrapped in form
        if (e.type === 'keydown') {
            e.preventDefault();
        }

        try {
            // Use geocoding to find the place
            const result = await geocodeWithNominatim(query);

            // Extract details manually from the result if possible, or infer from Nominatim response
            // Nominatim 'address' format: city, state, suburb, etc.
            // But geocodeWithNominatim currently returns { lat, lng, approximate_address }
            // We need a way to parse 'approximate_address' or modify geocodeWithNominatim to return address components.
            // For now, let's assume approximate_address has "Neighborhood, City, State"

            if (result.approximate_address) {
                const parts = result.approximate_address.split(',').map(p => p.trim());
                // Heuristic: Last part is State?, Second to last is City?
                // This is risky. Better to parse Nominatim raw data.
                // However, since I can't easily change the hook return type everywhere without checking,
                // I'll try to use the string or parse what I have.
                // Ideally, geocodeWithNominatim should return the raw address object.
                // Let's assume I can't change that now without breaking things.

                // Let's rely on simple string matching against our BRAZILIAN_CITIES list for the CITY.
                // And State from States list.

                let foundState = '';
                let foundCity = '';

                // Try to find state in parts
                for (const part of parts) {
                    const abbr = getStateAbbreviation(part);
                    if (abbr.length === 2 && BRAZILIAN_CITIES[Object.keys(BRAZILIAN_CITIES)[0]].state.length === 2) {
                        // Check if it matches any state in our list
                        // Logic: Check if 'abbr' is a valid state code.
                        // Simple check: Saphira has major states. 
                        foundState = abbr; // Assume valid if mapped
                    }
                }

                // If no state mapped, try to find known city
                if (!foundCity) {
                    for (const part of parts) {
                        if (BRAZILIAN_CITIES[part]) {
                            foundCity = part;
                            foundState = BRAZILIAN_CITIES[part].state;
                            break;
                        }
                    }
                }

                // Setup updates
                setProfile(prev => ({
                    ...prev,
                    state: foundState || prev.state,
                    city: foundCity || prev.city,
                    neighborhood: parts[0] !== foundCity && parts[0] !== foundState ? parts[0] : prev.neighborhood
                }));
            }

        } catch (error) {
            console.error("Location search failed", error);
        }
    };

    // ... (rest of the file until render)

    {/* ... (Previous sections) */ }



    const handleSave = async () => {
        if (!user?.id) {
            setSaveStatus({ type: 'error', message: 'Usuário não autenticado' });
            return;
        }

        // Validation
        if (!profile.display_name?.trim()) {
            setSaveStatus({ type: 'error', message: 'Nome de exibição é obrigatório' });
            return;
        }

        if (!profile.category) {
            setSaveStatus({ type: 'error', message: 'Categoria é obrigatória' });
            return;
        }

        if (profile.category !== 'Online') {
            const hasValidPrice = profile.prices && profile.prices.length > 0 && profile.prices.some((p: { description: string; price: number }) => p.price > 0);

            if (!hasValidPrice && (!profile.price || profile.price <= 0)) {
                setSaveStatus({ type: 'error', message: 'Informe pelo menos um valor na tabela de Cachês' });
                return;
            }
        }

        setSaving(true);
        setSaveStatus({ type: null, message: '' });

        try {
            // Geocode address logic
            const updatedProfile: ProfileData = { ...profile };

            // Priority 1: Use explicitly set map coordinates (from "Mostrar mapa")
            if (profile.map_coordinates && profile.map_coordinates.lat && profile.map_coordinates.lng) {
                updatedProfile.latitude = Number(profile.map_coordinates.lat);
                updatedProfile.longitude = Number(profile.map_coordinates.lng);
            }
            // Priority 2: Geocode based on City/State if no specific map set
            else if (profile.city && profile.state) {
                try {
                    const coords = await geocodeAddress(
                        profile.city,
                        profile.state,
                        profile.neighborhood || undefined,
                        profile.street_address || undefined,
                        profile.address_reference || undefined
                    );
                    updatedProfile.latitude = coords.lat;
                    updatedProfile.longitude = coords.lng;
                } catch (geocodeError) {
                    console.warn('Geocoding failed, will use city coordinates:', geocodeError);
                    // Continue without precise coordinates
                }
            }

            // --- Media Upload Logic ---
            let uploadedPhotos: string[] = [];
            let uploadedVideos: string[] = [];
            let uploadedAudioUrl = profile.audio_url || '';

            // Upload Photos
            try {
                const photoPromises = photos.map(async (p) => {
                    if (p.file) {
                        try {
                            const { file: compressedFile } = await compressProfilePhoto(p.file);
                            return await uploadToR2(compressedFile, 'photos');
                        } catch (err) {
                            console.error("Compression failed, uploading original", err);
                            return await uploadToR2(p.file, 'photos');
                        }
                    }
                    return p.url;
                });
                uploadedPhotos = await Promise.all(photoPromises);
            } catch (uploadError) {
                console.error("Photo Upload Error", uploadError);
                setSaveStatus({ type: 'error', message: `Erro fotos: ${(uploadError as Error).message}` });
                setSaving(false);
                return;
            }

            // Upload Videos
            try {
                const videoPromises = videos.map(async (v) => {
                    if (v.file) {
                        return await uploadToR2(v.file, 'videos');
                    }
                    return v.url;
                });
                uploadedVideos = await Promise.all(videoPromises);
            } catch (uploadError) {
                console.error("Video Upload Error", uploadError);
                setSaveStatus({ type: 'error', message: `Erro vídeos: ${(uploadError as Error).message}` });
                setSaving(false);
                return;
            }

            // Upload Audio
            if (audioFile) {
                try {
                    uploadedAudioUrl = await uploadToR2(audioFile, 'audio');
                } catch (uploadError) {
                    console.error("Audio upload failed", uploadError);
                    setSaveStatus({ type: 'error', message: 'Erro ao fazer upload do áudio.' });
                    setSaving(false);
                    return;
                }
            }

            updatedProfile.photos = uploadedPhotos;
            updatedProfile.videos = uploadedVideos;
            updatedProfile.audio_url = uploadedAudioUrl;

            // Set base price from first valid price in table if available
            if (profile.prices && profile.prices.length > 0) {
                const validPrice = profile.prices.find((p: { description: string; price: number }) => p.price > 0);
                if (validPrice) {
                    updatedProfile.price = validPrice.price;
                }
            }

            const result = await saveProfile(user.id, updatedProfile);
            if (result.success) {
                setProfile(updatedProfile);
                setAudioFile(null);
                setPhotos(uploadedPhotos.map(url => ({ url })));
                setVideos(uploadedVideos.map(url => ({ url })));

                setSaveStatus({ type: 'success', message: 'Perfil salvo com sucesso!' });
                setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
            } else {
                setSaveStatus({ type: 'error', message: result.error || 'Erro ao salvar perfil' });
            }

        } catch (error: unknown) {
            const err = error as Error;
            setSaveStatus({ type: 'error', message: err.message || 'Erro ao salvar perfil' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-32">
            {/* Header */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-primary text-white rounded-full p-2">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Publicar anúncio</h1>
                    <p className="text-sm text-muted-foreground">Formulário para publicar um novo anúncio</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Seção: Onde anunciar-se */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Onde anunciar-se</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Você é */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Você é</label>
                            <div className="flex gap-2">
                                {GENDERS.map((gender) => (
                                    <label
                                        key={gender}
                                        className={cn(
                                            "flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all text-center",
                                            profile.gender === gender
                                                ? "border-destructive bg-destructive/10 font-bold"
                                                : "border-border hover:border-destructive/50"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={gender}
                                            checked={profile.gender === gender}
                                            onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                                            className="sr-only"
                                        />
                                        <span>{gender}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Categoria</label>
                            <div className="flex flex-col gap-2">
                                {ADVERTISER_CATEGORIES.map((cat) => (
                                    <label
                                        key={cat}
                                        className={cn(
                                            "p-3 border-2 rounded-lg cursor-pointer transition-all",
                                            profile.category === cat
                                                ? "border-destructive bg-destructive/10 font-bold"
                                                : "border-border hover:border-destructive/50"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="category"
                                            value={cat}
                                            checked={profile.category === cat}
                                            onChange={(e) => setProfile(prev => ({ ...prev, category: e.target.value }))}
                                            className="sr-only"
                                        />
                                        <span>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Seção: Formas de Pagamento */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <label className="text-sm font-medium">Formas de Pagamento</label>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['PIX', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Paypal'].map(method => (
                                    <label key={method} className={cn(
                                        "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm",
                                        Array.isArray(profile.payment_methods) && profile.payment_methods.includes(method)
                                            ? "border-primary bg-primary/5 text-primary font-medium"
                                            : "border-border hover:border-gray-400"
                                    )}>
                                        <input
                                            type="checkbox"
                                            checked={Array.isArray(profile.payment_methods) && profile.payment_methods.includes(method)}
                                            onChange={(e) => {
                                                const current = Array.isArray(profile.payment_methods) ? [...profile.payment_methods] : [];
                                                if (e.target.checked) {
                                                    if (!current.includes(method)) current.push(method);
                                                } else {
                                                    const idx = current.indexOf(method);
                                                    if (idx > -1) current.splice(idx, 1);
                                                }
                                                setProfile(prev => ({ ...prev, payment_methods: current }));
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span>{method}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* Location Fields - Only for Acompanhantes and Massagistas */}
                    {
                        (profile.category === 'Acompanhante' || profile.category === 'Massagista') && (
                            <div className="pt-6 border-t border-border mt-6 space-y-6">
                                {/* Search Helper */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        Pesquisa facilmente a tua cidade ou bairro.
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="São Paulo, Rio de Janeiro, Copacabana, ..."
                                            maxLength={200}
                                            className="w-full p-3 pr-10 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            onKeyDown={handleLocationSearch}
                                            onBlur={handleLocationSearch}
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>

                                {/* State and City */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Estado</label>
                                        <select
                                            value={profile.state}
                                            onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value, city: '' }))}
                                            className="w-full p-3 border border-border rounded-lg bg-background text-foreground appearance-none cursor-pointer hover:border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            title="Estado"
                                        >
                                            <option value="">Selecionar um estado</option>
                                            {Array.from(new Set(Object.values(BRAZILIAN_CITIES).map(c => c.state))).sort().map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Cidade</label>
                                        <select
                                            value={profile.city}
                                            onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                                            disabled={!profile.state}
                                            className="w-full p-3 border border-border rounded-lg bg-background text-foreground appearance-none cursor-pointer hover:border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Cidade"
                                        >
                                            <option value="">Selecionar uma cidade</option>
                                            {profile.state && Object.entries(BRAZILIAN_CITIES)
                                                .filter(([_, data]) => data.state === profile.state)
                                                .map(([cityName]) => (
                                                    <option key={cityName} value={cityName}>{cityName}</option>
                                                ))
                                                .sort()
                                            }
                                        </select>
                                    </div>
                                </div>

                                {/* Area (Neighborhood) */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Área</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={profile.neighborhood || ''}
                                            onChange={(e) => setProfile(prev => ({ ...prev, neighborhood: e.target.value }))}
                                            placeholder="Selecionar uma cidade" // Placeholder matches screenshot
                                            maxLength={200}
                                            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">(Opcional)</span>
                                    </div>
                                </div>

                                {/* Locais que atendo (Neighborhoods) - Shows only if city has available neighborhoods */}
                                {profile.city && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-3">Locais que atendo</label>

                                        {/* Predefined Neighborhoods List */}
                                        {CITY_NEIGHBORHOODS[profile.city] && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {CITY_NEIGHBORHOODS[profile.city].map(neigh => (
                                                    <label key={neigh} className={cn(
                                                        "px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all select-none",
                                                        Array.isArray(profile.service_neighborhoods) && profile.service_neighborhoods.includes(neigh)
                                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                                            : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                                                    )}>
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={Array.isArray(profile.service_neighborhoods) && profile.service_neighborhoods.includes(neigh)}
                                                            onChange={(e) => {
                                                                const current = Array.isArray(profile.service_neighborhoods) ? [...profile.service_neighborhoods] : [];
                                                                if (e.target.checked) {
                                                                    if (!current.includes(neigh)) current.push(neigh);
                                                                } else {
                                                                    const idx = current.indexOf(neigh);
                                                                    if (idx > -1) current.splice(idx, 1);
                                                                }
                                                                setProfile(prev => ({ ...prev, service_neighborhoods: current }));
                                                            }}
                                                        />
                                                        {neigh}
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Manual Neighborhood Entry (Tag Input) */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    id="manual-neighborhood-input"
                                                    placeholder="Digite outro bairro (ex: Centro)"
                                                    className="flex-1 p-2 border border-border rounded-md text-sm bg-background"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                const current = Array.isArray(profile.service_neighborhoods) ? [...profile.service_neighborhoods] : [];
                                                                if (!current.includes(val)) {
                                                                    setProfile(prev => ({ ...prev, service_neighborhoods: [...current, val] }));
                                                                }
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors"
                                                    onClick={() => {
                                                        const input = document.getElementById('manual-neighborhood-input') as HTMLInputElement;
                                                        if (input && input.value.trim()) {
                                                            const val = input.value.trim();
                                                            const current = Array.isArray(profile.service_neighborhoods) ? [...profile.service_neighborhoods] : [];
                                                            if (!current.includes(val)) {
                                                                setProfile(prev => ({ ...prev, service_neighborhoods: [...current, val] }));
                                                            }
                                                            input.value = '';
                                                        }
                                                    }}
                                                >
                                                    Adicionar
                                                </button>
                                            </div>

                                            {/* Display manually added neighborhoods that are NOT in the predefined list (or all if no list) */}
                                            {Array.isArray(profile.service_neighborhoods) && profile.service_neighborhoods.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {profile.service_neighborhoods
                                                        .filter(n => !CITY_NEIGHBORHOODS[profile.city!]?.includes(n)) // Only show manually added ones here if list exists
                                                        .map(n => (
                                                            <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                                {n}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = [...(profile.service_neighborhoods || [])];
                                                                        const idx = current.indexOf(n);
                                                                        if (idx > -1) {
                                                                            current.splice(idx, 1);
                                                                            setProfile(prev => ({ ...prev, service_neighborhoods: current }));
                                                                        }
                                                                    }}
                                                                    className="hover:text-destructive transition-colors"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                            <p className="text-[10px] text-muted-foreground">
                                                * Pressione Enter ou clique em Adicionar para incluir bairros manualmente.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </section >

                {/* Seção: Contato */}
                < section className="bg-card border border-border rounded-lg p-6" >
                    <div className="flex items-center gap-2 mb-4">
                        <Phone className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Contato</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Telefone e Preferências */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Telefone (WhatsApp)</label>
                            <input
                                type="tel"
                                value={profile.phone || ''}
                                onChange={(e) => {
                                    // Mask (XX) XXXXX-XXXX
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 11) v = v.slice(0, 11);
                                    if (v.length > 7) {
                                        v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                                    } else if (v.length > 2) {
                                        v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                    }
                                    setProfile(prev => ({ ...prev, phone: v }));
                                }}
                                maxLength={15}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                placeholder="(11) 99999-9999"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Digite apenas números, a formatação é automática.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className={cn(
                                "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all",
                                profile.accepts_calls ? "border-green-500 bg-green-500/10" : "border-border hover:border-gray-400"
                            )}>
                                <span className="flex items-center gap-2 font-medium">
                                    <Phone className="w-4 h-4" /> Ligações
                                </span>
                                <input
                                    type="checkbox"
                                    checked={profile.accepts_calls !== false} // Default true
                                    onChange={(e) => setProfile(prev => ({ ...prev, accepts_calls: e.target.checked }))}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                            </label>

                            <label className={cn(
                                "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all",
                                profile.accepts_whatsapp !== false ? "border-green-500 bg-green-500/10" : "border-border hover:border-gray-400"
                            )}>
                                <span className="flex items-center gap-2 font-medium">
                                    <Users className="w-4 h-4" /> WhatsApp
                                </span>
                                <input
                                    type="checkbox"
                                    checked={profile.accepts_whatsapp !== false} // Default true
                                    onChange={(e) => setProfile(prev => ({ ...prev, accepts_whatsapp: e.target.checked }))}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                            </label>

                            <label className={cn(
                                "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all",
                                profile.accepts_telegram ? "border-green-500 bg-green-500/10" : "border-border hover:border-gray-400"
                            )}>
                                <span className="flex items-center gap-2 font-medium">
                                    <Send className="w-4 h-4" /> Telegram
                                </span>
                                <input
                                    type="checkbox"
                                    checked={profile.accepts_telegram || false} // Default false? Or true? Let's assume false if unchecked
                                    onChange={(e) => setProfile(prev => ({ ...prev, accepts_telegram: e.target.checked }))}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                            </label>
                        </div>

                        {/* Redes Sociais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div>
                                <label className="block text-sm font-medium mb-2">Telegram (Usuário)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <input
                                        type="text"
                                        value={profile.telegram || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, telegram: e.target.value.replace('@', '') }))}
                                        className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="seu.usuario"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Instagram</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <input
                                        type="text"
                                        value={profile.instagram || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                                        className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="seu.insta"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">X (Twitter)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <input
                                        type="text"
                                        value={profile.twitter || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value.replace('@', '') }))}
                                        className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="seu.twitter"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                {/* Seção: Apresentação */}
                < section className="bg-card border border-border rounded-lg p-6" >
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Apresentação</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nome</label>
                            <input
                                type="text"
                                value={profile.display_name || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                                maxLength={100}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Seu nome artístico"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Idade</label>
                            <select
                                value={profile.age || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                                <option value="">Selecione a sua idade</option>
                                {Array.from({ length: 50 }, (_, i) => i + 18).map(age => (
                                    <option key={age} value={age}>{age} anos</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Título</label>
                            <input
                                type="text"
                                value={profile.title || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                                maxLength={200}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Título do seu anúncio"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                você já escreveu {profile.title?.length || 0} caracteres. {Math.max(0, 40 - (profile.title?.length || 0))} mínimo de 40
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Texto</label>
                            <textarea
                                value={profile.bio || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                maxLength={5000}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm h-32 resize-none focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Descreva seus serviços..."
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                você já escreveu {profile.bio?.length || 0} caracteres. {Math.max(0, 70 - (profile.bio?.length || 0))} mínimo de 70
                            </p>
                        </div>
                    </div>
                </section >

                {/* Seção: Sobre você */}
                < section className="bg-card border border-border rounded-lg p-6" >
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Sobre você</h2>
                    </div>
                    <div className="space-y-6">


                        {/* Etnia */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Etnia</label>
                            <select
                                value={typeof profile.ethnicity === 'string' ? profile.ethnicity : ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, ethnicity: e.target.value }))}
                                className="w-full md:w-64 bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                                <option value="">Selecione</option>
                                {ETHNICITIES.map((ethnicity) => (
                                    <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                                ))}
                            </select>
                        </div>

                        {/* Altura e Peso */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Altura (m)</label>
                                <input
                                    type="text"
                                    placeholder="1.70"
                                    value={profile.height || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, height: e.target.value }))}
                                    maxLength={10}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Peso (kg)</label>
                                <input
                                    type="text"
                                    placeholder="65"
                                    value={profile.weight || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, weight: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Cabelo */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Cabelo</label>
                            <div className="flex flex-wrap gap-2">
                                {HAIR_COLORS.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                            profile.hairColor?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.hairColor?.includes(option) || false}
                                            onChange={() => toggleArrayItem('hairColor', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Estatura */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Estatura</label>
                            <div className="flex flex-wrap gap-2">
                                {STATURES.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                            profile.stature?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.stature?.includes(option) || false}
                                            onChange={() => toggleArrayItem('stature', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Corpo */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Corpo</label>
                            <div className="flex flex-wrap gap-2">
                                {BODY_TYPES.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                            profile.bodyType?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.bodyType?.includes(option) || false}
                                            onChange={() => toggleArrayItem('bodyType', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Seios */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Seios</label>
                            <div className="flex flex-wrap gap-2">
                                {BREAST_TYPES.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                            profile.breastType?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.breastType?.includes(option) || false}
                                            onChange={() => toggleArrayItem('breastType', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Púbis */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Púbis</label>
                            <div className="flex flex-wrap gap-2">
                                {PUBIS_TYPES.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                            profile.pubisType?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.pubisType?.includes(option) || false}
                                            onChange={() => toggleArrayItem('pubisType', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section >

                {/* Seção: Atendimento a (Genérico - Exceto Online) */}
                {
                    profile.category !== 'Atendimento Online' && (
                        <section className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-destructive" />
                                <h2 className="text-xl font-bold">Atendimento a</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {SERVICE_TO.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-sm",
                                            profile.serviceTo?.includes(option)
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.serviceTo?.includes(option) || false}
                                            onChange={() => toggleArrayItem('serviceTo', option)}
                                            className="sr-only"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    )
                }

                {/* Seção: Serviços - Apenas para Acompanhantes */}
                {
                    profile.category === 'Acompanhante' && (
                        <>
                            {/* Serviços */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Serviços</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ESCORT_SERVICES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.escortServices?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.escortServices?.includes(option) || false}
                                                onChange={() => toggleArrayItem('escortServices', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}

                                    {/* Sexo Oral - Dropdown */}
                                    <div className="flex-1 md:flex-none">
                                        <div className="relative">
                                            <select
                                                value={profile.oralSex || ''}
                                                onChange={(e) => setProfile(prev => ({ ...prev, oralSex: e.target.value }))}
                                                className={cn(
                                                    "w-full h-full min-w-[140px] px-4 py-2 border rounded-sm appearance-none bg-background cursor-pointer text-sm focus:outline-none focus:border-destructive/50",
                                                    profile.oralSex
                                                        ? "border-destructive/50 bg-destructive/5 text-destructive font-bold"
                                                        : "border-border hover:border-destructive/30"
                                                )}
                                            >
                                                <option value="">Sexo oral</option>
                                                {ORAL_SEX_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Serviços Especiais */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Serviços especiais</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ESCORT_SPECIAL_SERVICES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.escortSpecialServices?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.escortSpecialServices?.includes(option) || false}
                                                onChange={() => toggleArrayItem('escortSpecialServices', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </>
                    )
                }

                {/* Seção: Serviços - Apenas para Massagistas */}
                {
                    profile.category === 'Massagista' && (
                        <>
                            {/* Sobre você - Certificado */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Sobre você</h2>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Certificado</label>
                                    <label
                                        className={cn(
                                            "inline-flex px-4 py-2 border rounded-sm cursor-pointer transition-all items-center justify-center text-sm",
                                            profile.certified_masseuse
                                                ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                : "border-border hover:border-destructive/30 bg-background"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={profile.certified_masseuse || false}
                                            onChange={(e) => setProfile(prev => ({ ...prev, certified_masseuse: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <span>Massagista certificada</span>
                                    </label>
                                </div>
                            </section>

                            {/* Tipos de massagens */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Award className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Tipos de massagens</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {MASSAGE_TYPES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.massageTypes?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.massageTypes?.includes(option) || false}
                                                onChange={() => toggleArrayItem('massageTypes', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Final feliz */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Final feliz</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {HAPPY_ENDING.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.happyEnding?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.happyEnding?.includes(option) || false}
                                                onChange={() => toggleArrayItem('happyEnding', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Outros serviços */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Outros serviços</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {OTHER_SERVICES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.otherServices?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.otherServices?.includes(option) || false}
                                                onChange={() => toggleArrayItem('otherServices', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </>
                    )
                }

                {/* Seção: Serviços - Apenas para Atendimento Online */}
                {
                    profile.category === 'Atendimento Online' && (
                        <>
                            {/* Serviços */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Monitor className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Serviços</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ONLINE_SERVICES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.onlineServices?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.onlineServices?.includes(option) || false}
                                                onChange={() => toggleArrayItem('onlineServices', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Atendimento a */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Atendimento a</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ONLINE_SERVICE_TO.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.onlineServiceTo?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.onlineServiceTo?.includes(option) || false}
                                                onChange={() => toggleArrayItem('onlineServiceTo', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Fantasias virtuais */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Gamepad2 className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Fantasias virtuais</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {VIRTUAL_FANTASIES.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.virtualFantasies?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.virtualFantasies?.includes(option) || false}
                                                onChange={() => toggleArrayItem('virtualFantasies', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Para vender */}
                            <section className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShoppingCart className="w-5 h-5 text-destructive" />
                                    <h2 className="text-xl font-bold">Para vender</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {FOR_SALE.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 py-2 border rounded-sm cursor-pointer transition-all flex items-center justify-center text-sm",
                                                profile.forSale?.includes(option)
                                                    ? "border-destructive/50 bg-destructive/5 text-destructive font-medium shadow-sm"
                                                    : "border-border hover:border-destructive/30 bg-background"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={profile.forSale?.includes(option) || false}
                                                onChange={() => toggleArrayItem('forSale', option)}
                                                className="sr-only"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </>
                    )
                }

                {/* Seção: Local de Atendimento */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Home className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Local de Atendimento</h2>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                            Selecione onde você atende:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_LOCATIONS.map((location) => (
                                <label
                                    key={location}
                                    className={cn(
                                        "px-4 py-2 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-2",
                                        profile.serviceLocations?.includes(location)
                                            ? "border-destructive bg-destructive/10 font-semibold"
                                            : "border-border hover:border-destructive/50"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={profile.serviceLocations?.includes(location) || false}
                                        onChange={() => toggleArrayItem('serviceLocations', location)}
                                        className="sr-only"
                                    />
                                    {profile.serviceLocations?.includes(location) && <CheckCircle className="w-4 h-4 text-destructive" />}
                                    <span>{location}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Seção: Mapa - Apenas para Acompanhantes e Massagistas */}
                {
                    (profile.category === 'Acompanhante' || profile.category === 'Massagista') && (
                        <section className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-destructive" />
                                <h2 className="text-xl font-bold">Mapa</h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Para facilitar aos clientes na hora de encontrar o seu endereço, você poderá <span className="text-destructive font-bold">mostrar no seu anúncio um mapa</span> com a sua localização.<br />
                                <strong>Exemplos:</strong> Avenida 7 de setembro 2080 , Cruzamento da Rua Augusta com Avenida Paulista , Rua Evaristo da Veiga 5000
                            </p>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={profile.map_address || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, map_address: e.target.value }))}
                                    className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Selecionar uma cidade ou endereço completo"
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!profile.map_address) return;
                                        try {
                                            const coords = await geocodeWithNominatim(profile.map_address);
                                            setProfile(prev => ({
                                                ...prev,
                                                map_coordinates: coords,
                                                map_region_string: coords.approximate_address || ''
                                            }));
                                        } catch (error) {
                                            console.error('Erro ao buscar endereço:', error);
                                            // Could add a toast notification here
                                        }
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Mostrar mapa
                                </button>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="map_location_type"
                                        checked={profile.map_location_type === 'exact'}
                                        onChange={() => setProfile(prev => ({ ...prev, map_location_type: 'exact' }))}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Local exato</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="map_location_type"
                                        checked={profile.map_location_type === 'approximate'}
                                        onChange={() => setProfile(prev => ({ ...prev, map_location_type: 'approximate' }))}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Local aproximado</span>
                                        <span className="text-xs text-muted-foreground">O mapa mostrará apenas a região</span>
                                    </div>
                                </label>
                            </div>

                            <div className="w-full h-[300px] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                                {profile.map_coordinates ? (
                                    <LeafletMap
                                        lat={profile.map_coordinates.lat}
                                        lng={profile.map_coordinates.lng}
                                        mode={profile.map_location_type as 'exact' | 'approximate'}
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="relative w-full h-full max-w-md mx-auto aspect-video mb-2 opacity-50 bg-[url('https://maps.gstatic.com/mapfiles/api-3/images/map_error_1.png')] bg-center bg-cover"></div>
                                        <p className="text-muted-foreground font-medium">Introduza um endereço e clique em Mostrar mapa.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )
                }

                {/* Seção: R$ Cachês */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">R$ Cachês</h2>
                    </div>
                    <PriceTable
                        prices={profile.prices || [{ description: '1 hora', price: 0 }]}
                        onPricesChange={(prices) => setProfile(prev => ({ ...prev, prices }))}
                    />
                </section>

                {/* Seção: Horário */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Horário</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.schedule_24h || false}
                                onChange={(e) => setProfile(prev => ({ ...prev, schedule_24h: e.target.checked }))}
                                className="w-4 h-4 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium">24 horas</span>
                        </label>
                        {!profile.schedule_24h && (
                            <>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-2">Das</label>
                                        <input
                                            type="time"
                                            value={profile.schedule_from || '09:00'}
                                            onChange={(e) => setProfile(prev => ({ ...prev, schedule_from: e.target.value }))}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-2">Até as</label>
                                        <input
                                            type="time"
                                            value={profile.schedule_to || '18:00'}
                                            onChange={(e) => setProfile(prev => ({ ...prev, schedule_to: e.target.value }))}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Mesmo horário todos os dias?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="schedule_same"
                                                checked={profile.schedule_same_everyday === true}
                                                onChange={() => setProfile(prev => ({ ...prev, schedule_same_everyday: true }))}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <span>Sim</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="schedule_same"
                                                checked={profile.schedule_same_everyday === false}
                                                onChange={() => setProfile(prev => ({ ...prev, schedule_same_everyday: false }))}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <span>Não</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Weekly Schedule Grid */}
                                {profile.schedule_same_everyday === false && (
                                    <div className="mt-4 border border-border rounded-lg overflow-hidden">
                                        <div className="bg-muted/50 px-4 py-2 border-b border-border">
                                            <p className="text-sm font-semibold">Horários por dia da semana</p>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {[
                                                { key: 'monday', label: 'Segunda-feira' },
                                                { key: 'tuesday', label: 'Terça-feira' },
                                                { key: 'wednesday', label: 'Quarta-feira' },
                                                { key: 'thursday', label: 'Quinta-feira' },
                                                { key: 'friday', label: 'Sexta-feira' },
                                                { key: 'saturday', label: 'Sábado' },
                                                { key: 'sunday', label: 'Domingo' },
                                            ].map(({ key, label }) => (
                                                <div key={key} className="p-3 flex items-center gap-4">
                                                    <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={profile.weekly_schedule?.[key]?.enabled ?? true}
                                                            onChange={(e) => {
                                                                setProfile(prev => ({
                                                                    ...prev,
                                                                    weekly_schedule: {
                                                                        ...prev.weekly_schedule,
                                                                        [key]: {
                                                                            ...prev.weekly_schedule?.[key],
                                                                            enabled: e.target.checked,
                                                                            from: prev.weekly_schedule?.[key]?.from || '09:00',
                                                                            to: prev.weekly_schedule?.[key]?.to || '18:00',
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                            className="w-4 h-4 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-sm font-medium">{label}</span>
                                                    </label>

                                                    {profile.weekly_schedule?.[key]?.enabled && (
                                                        <div className="flex gap-3 items-center flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-xs text-muted-foreground">Das</label>
                                                                <input
                                                                    type="time"
                                                                    value={profile.weekly_schedule?.[key]?.from || '09:00'}
                                                                    onChange={(e) => {
                                                                        setProfile(prev => ({
                                                                            ...prev,
                                                                            weekly_schedule: {
                                                                                ...prev.weekly_schedule,
                                                                                [key]: {
                                                                                    ...prev.weekly_schedule?.[key],
                                                                                    enabled: prev.weekly_schedule?.[key]?.enabled ?? true,
                                                                                    from: e.target.value,
                                                                                    to: prev.weekly_schedule?.[key]?.to || '18:00',
                                                                                }
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="bg-background border border-input rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-xs text-muted-foreground">Até</label>
                                                                <input
                                                                    type="time"
                                                                    value={profile.weekly_schedule?.[key]?.to || '18:00'}
                                                                    onChange={(e) => {
                                                                        setProfile(prev => ({
                                                                            ...prev,
                                                                            weekly_schedule: {
                                                                                ...prev.weekly_schedule,
                                                                                [key]: {
                                                                                    ...prev.weekly_schedule?.[key],
                                                                                    enabled: prev.weekly_schedule?.[key]?.enabled ?? true,
                                                                                    from: prev.weekly_schedule?.[key]?.from || '09:00',
                                                                                    to: e.target.value,
                                                                                }
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="bg-background border border-input rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Seção: Fotos */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Fotos</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Você pode incluir até 12 fotos. As fotos devem cumprir as <button type="button" onClick={() => setShowMediaRules(true)} className="text-primary hover:underline font-medium">Regras de Estilo</button>.
                    </p>
                    <PhotoGrid
                        photos={photos}
                        onPhotosChange={setPhotos}
                        maxPhotos={12}
                        maxColumns={3}
                    />
                </section>

                {/* Seção: Videos */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Play className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Videos</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Cada vídeo pode durar até 1 minuto. Os vídeos são validados antes de serem publicados e devem cumprir as <button type="button" onClick={() => setShowMediaRules(true)} className="text-primary hover:underline font-medium">Regras de Estilo</button>.
                    </p>
                    <VideoGrid
                        videos={videos}
                        onVideosChange={setVideos}
                        maxVideos={3}
                    />
                </section>

                {/* Seção: Audio de apresentação */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Volume2 className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Audio de apresentação</h2>
                    </div>
                    <AudioUploader
                        audioUrl={profile.audio_url}
                        onAudioChange={(file) => {
                            if (file) {
                                // TODO: Upload file and get URL
                                setProfile(prev => ({ ...prev, audio_url: URL.createObjectURL(file) }));
                            } else {
                                setProfile(prev => ({ ...prev, audio_url: undefined }));
                            }
                        }}
                    />
                </section>

                {/* Seção: Advertência */}
                <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-bold">Advertência</h2>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                        <p className="text-sm text-muted-foreground">
                            Para publicar um anúncio você deve aceitar que o não cumprimento de determinadas Regras de Publicação — tais como fotos ou fotos falsas, usar fotos de terceiros sem autorização, usar seu anúncio para cometer um delito — implicará sua eliminação e que o valor pago seja retido em conceito de gastos de trâmite de cancelamento por não cumprimento.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Li e aceito os Termos e Condições</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptedAge}
                                onChange={(e) => setAcceptedAge(e.target.checked)}
                                className="w-4 h-4 mt-0.5 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">
                                Declaro que sou maior de idade e cumpro com as condições para publicar anúncios no Site. Neste sentido, reconheço que poderá ser realizado o processo de verificação de identidade previsto na seção 1.4.1. Maioridade do Usuário: Verificação da idade
                            </span>
                        </label>
                    </div>
                </section>
            </div >

            {/* Save Button */}
            < div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-40" >
                <div className="container mx-auto flex items-center justify-between gap-4">
                    {saveStatus.type && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                            saveStatus.type === 'success'
                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        )}>
                            {saveStatus.type === 'success' ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            {saveStatus.message}
                        </div>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !acceptedTerms || !acceptedAge}
                            className={cn(
                                "px-8 py-3 bg-destructive text-white font-bold rounded-lg hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20 flex items-center gap-2",
                                (saving || !acceptedTerms || !acceptedAge) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Publicar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div >
            <MediaRulesModal
                isOpen={showMediaRules}
                onClose={() => setShowMediaRules(false)}
            />
        </div >
    );
}
