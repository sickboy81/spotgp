import { useState } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAZILIAN_CITIES } from '@/lib/constants/brazilian-cities';
import { NEIGHBORHOODS_BY_CITY } from '@/lib/constants/neighborhoods';

export default function LocationsManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [showAddCity, setShowAddCity] = useState(false);
    const [showAddNeighborhood, setShowAddNeighborhood] = useState(false);

    const [newCity, setNewCity] = useState({
        name: '',
        state: '',
        latitude: '',
        longitude: '',
    });

    const [newNeighborhood, setNewNeighborhood] = useState({
        name: '',
        city: '',
    });

    const states = Array.from(new Set(Object.values(BRAZILIAN_CITIES).map(c => c.state))).sort();

    const citiesByState = selectedState
        ? Object.entries(BRAZILIAN_CITIES)
            .filter(([, city]) => city.state === selectedState)
            .map(([name]) => name)
            .sort()
        : [];

    const neighborhoods = selectedCity && NEIGHBORHOODS_BY_CITY[selectedCity]
        ? NEIGHBORHOODS_BY_CITY[selectedCity]
        : [];

    const filteredCities = Object.entries(BRAZILIAN_CITIES)
        .filter(([name, city]) => {
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                city.state.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesState = !selectedState || city.state === selectedState;
            return matchesSearch && matchesState;
        })
        .slice(0, 50); // Limit results for performance

    const handleAddCity = () => {
        if (newCity.name && newCity.state) {
            // TODO: Add to database
            alert(`Cidade ${newCity.name} adicionada com sucesso`);
            setNewCity({ name: '', state: '', latitude: '', longitude: '' });
            setShowAddCity(false);
        }
    };

    const handleAddNeighborhood = () => {
        if (newNeighborhood.name && newNeighborhood.city) {
            // TODO: Add to database
            alert(`Bairro ${newNeighborhood.name} adicionado a ${newNeighborhood.city}`);
            setNewNeighborhood({ name: '', city: '' });
            setShowAddNeighborhood(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gerenciamento de Localizações</h1>
                <p className="text-muted-foreground mt-1">
                    Gerencie cidades, estados e bairros disponíveis
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Cidades</p>
                            <p className="text-2xl font-bold mt-1">{Object.keys(BRAZILIAN_CITIES).length}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Estados</p>
                            <p className="text-2xl font-bold mt-1">{states.length}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Bairros</p>
                            <p className="text-2xl font-bold mt-1">
                                {Object.values(NEIGHBORHOODS_BY_CITY).reduce((sum, neighborhoods) => sum + neighborhoods.length, 0)}
                            </p>
                        </div>
                        <MapPin className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Cities Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Cidades
                    </h2>
                    <button
                        onClick={() => setShowAddCity(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Cidade
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            aria-label="Buscar cidade"
                        />
                    </div>
                    <select
                        value={selectedState}
                        onChange={(e) => {
                            setSelectedState(e.target.value);
                            setSelectedCity('');
                        }}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        aria-label="Filtrar por estado"
                    >
                        <option value="">Todos os estados</option>
                        {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>

                {/* Add City Form */}
                {showAddCity && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                        <h3 className="font-bold mb-3">Adicionar Nova Cidade</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome da Cidade</label>
                                <input
                                    type="text"
                                    value={newCity.name}
                                    onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    aria-label="Nome da cidade"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado</label>
                                <select
                                    value={newCity.state}
                                    onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    aria-label="Estado da cidade"
                                >
                                    <option value="">Selecione...</option>
                                    {states.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={newCity.latitude}
                                    onChange={(e) => setNewCity({ ...newCity, latitude: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: -23.5505"
                                    aria-label="Latitude"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={newCity.longitude}
                                    onChange={(e) => setNewCity({ ...newCity, longitude: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: -46.6333"
                                    aria-label="Longitude"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleAddCity}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddCity(false);
                                    setNewCity({ name: '', state: '', latitude: '', longitude: '' });
                                }}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Cities List */}
                <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredCities.map(([cityName, cityData]) => (
                            <div
                                key={cityName}
                                className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                                <div className="font-medium">{cityName}</div>
                                <div className="text-sm text-muted-foreground">{cityData.state}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {cityData.lat}, {cityData.lng}
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredCities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma cidade encontrada
                        </div>
                    )}
                </div>
            </div>

            {/* Neighborhoods Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Bairros
                    </h2>
                    <button
                        onClick={() => setShowAddNeighborhood(true)}
                        disabled={!selectedCity}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                            selectedCity
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Bairro
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Selecione uma Cidade</label>
                    <select
                        value={selectedCity}
                        onChange={(e) => {
                            setSelectedCity(e.target.value);
                            setNewNeighborhood({ ...newNeighborhood, city: e.target.value });
                        }}
                        className="w-full md:w-auto px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        disabled={!selectedState}
                        aria-label="Selecionar cidade para ver bairros"
                    >
                        <option value="">Selecione uma cidade...</option>
                        {citiesByState.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                    {!selectedState && (
                        <p className="text-xs text-muted-foreground mt-1">Selecione um estado primeiro</p>
                    )}
                </div>

                {/* Add Neighborhood Form */}
                {showAddNeighborhood && selectedCity && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                        <h3 className="font-bold mb-3">Adicionar Bairro a {selectedCity}</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newNeighborhood.name}
                                onChange={(e) => setNewNeighborhood({ ...newNeighborhood, name: e.target.value })}
                                placeholder="Nome do bairro..."
                                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                            <button
                                onClick={handleAddNeighborhood}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddNeighborhood(false);
                                    setNewNeighborhood({ name: '', city: '' });
                                }}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Neighborhoods List */}
                {selectedCity && neighborhoods.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {neighborhoods.map((neighborhood) => (
                            <div
                                key={neighborhood}
                                className="p-3 bg-muted/50 rounded-lg border border-border text-sm"
                            >
                                {neighborhood}
                            </div>
                        ))}
                    </div>
                )}
                {selectedCity && neighborhoods.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum bairro cadastrado para {selectedCity}
                    </div>
                )}
                {!selectedCity && (
                    <div className="text-center py-8 text-muted-foreground">
                        Selecione uma cidade para ver os bairros
                    </div>
                )}
            </div>
        </div>
    );
}








