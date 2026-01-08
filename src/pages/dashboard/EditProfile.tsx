import { useState, useMemo, useEffect, useRef } from 'react';
import { VideoUploader } from '@/components/features/media/VideoUploader';
import { BRAZILIAN_CITIES } from '@/lib/constants/brazilian-cities';
import { MapPin, ChevronDown } from 'lucide-react';

export default function EditProfile() {
    // Placeholder state - normally would come from data fetching
    const [profile, setProfile] = useState({
        display_name: '',
        bio: '',
        city: '',
        state: '',
        neighborhood: '',
        telegram: '',
        instagram: '',
        twitter: ''
    });

    // City Autocomplete State
    const [citySearch, setCitySearch] = useState('');
    const [isCityListOpen, setIsCityListOpen] = useState(false);

    // Derived Data
    const cities = useMemo(() => Object.keys(BRAZILIAN_CITIES).sort(), []);
    const states = useMemo(() => Array.from(new Set(Object.values(BRAZILIAN_CITIES).map(c => c.state))).sort(), []);

    // Filter cities for autocomplete
    const filteredCities = useMemo(() => {
        if (!citySearch) return [];
        return cities.filter(city => city.toLowerCase().includes(citySearch.toLowerCase()));
    }, [cities, citySearch]);

    // Handlers
    const handleCitySelect = (city: string) => {
        setCitySearch(city);
        setProfile(prev => ({
            ...prev,
            city,
            state: BRAZILIAN_CITIES[city].state // Auto-set state if known city
        }));
        setIsCityListOpen(false);
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCitySearch(val);
        setProfile(prev => ({ ...prev, city: val }));
        setIsCityListOpen(true);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold mb-2">Editar Perfil</h1>
                <p className="text-muted-foreground">Atualize suas informações e localização.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <section className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Informações Básicas</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome de Exibição</label>
                                <input
                                    type="text"
                                    value={profile.display_name}
                                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Seu nome artístico"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Sobre Mim</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm h-32 resize-none focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Conte um pouco sobre você..."
                                />
                            </div>

                            {/* CUSTOM SLUG INPUT */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Link Exclusivo (Nome de Usuário)</label>
                                <div className="flex items-center">
                                    <span className="bg-muted px-3 py-2 border border-r-0 border-input rounded-l-md text-sm text-muted-foreground select-none">
                                        saphira.com/@
                                    </span>
                                    <input
                                        type="text"
                                        value={profile.username || ''} // Handle undefined
                                        onChange={(e) => {
                                            // Allow only alphanumeric and lowercase
                                            const val = e.target.value.replace(/[^a-z0-9]/g, '');
                                            setProfile(prev => ({ ...prev, username: val }));
                                        }}
                                        className="w-full bg-background border border-input rounded-r-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="seu-nome"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Use apenas letras minúsculas e números. Ex: @juliana23</p>
                            </div>
                        </div>
                    </section>

                    {/* Location Section */}
                    <section className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <MapPin className="w-5 h-5" />
                            <h2 className="text-xl font-bold text-foreground">Localização</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado</label>
                                <div className="relative">
                                    <select
                                        value={profile.state}
                                        onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="">Selecione...</option>
                                        {states.map(uf => (
                                            <option key={uf} value={uf}>{uf}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* City (Autocomplete + Custom) */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1">Cidade</label>
                                <input
                                    type="text"
                                    value={citySearch}
                                    onChange={handleCityChange}
                                    onFocus={() => setIsCityListOpen(true)}
                                    // Delay blur to allow clicking suggestion
                                    onBlur={() => setTimeout(() => setIsCityListOpen(false), 200)}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Digite sua cidade..."
                                />
                                {/* Suggestions - Only show if matches exist and list is open */}
                                {isCityListOpen && filteredCities.length > 0 && (
                                    <div className="absolute z-10 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {filteredCities.map(city => (
                                            <button
                                                key={city}
                                                onClick={() => handleCitySelect(city)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between"
                                            >
                                                <span>{city}</span>
                                                <span className="text-xs text-muted-foreground">{BRAZILIAN_CITIES[city].state}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    * Se sua cidade não aparecer na lista, apenas digite o nome completo.
                                </p>
                            </div>

                            {/* Neighborhood */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Bairro</label>
                                <input
                                    type="text"
                                    value={profile.neighborhood}
                                    onChange={(e) => setProfile(prev => ({ ...prev, neighborhood: e.target.value }))}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Ex: Copacabana, Centro..."
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Fotos e Vídeos</h2>
                        <VideoUploader />
                    </section>
                </div>
            </div>

            {/* Save Button (Placeholder) */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 flex justify-end container mx-auto z-40">
                <button className="px-8 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}
