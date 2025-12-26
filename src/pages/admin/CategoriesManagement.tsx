import { useState } from 'react';
import { Tag, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADVERTISER_CATEGORIES } from '@/lib/constants/categories';
import { GENERAL_SERVICES, SPECIAL_SERVICES } from '@/lib/constants/services';

export default function CategoriesManagement() {
    const [categories, setCategories] = useState<string[]>(ADVERTISER_CATEGORIES);
    const [generalServices, setGeneralServices] = useState<string[]>(GENERAL_SERVICES);
    const [specialServices, setSpecialServices] = useState<string[]>(SPECIAL_SERVICES);
    
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingGeneralService, setEditingGeneralService] = useState<string | null>(null);
    const [editingSpecialService, setEditingSpecialService] = useState<string | null>(null);
    
    const [newCategory, setNewCategory] = useState('');
    const [newGeneralService, setNewGeneralService] = useState('');
    const [newSpecialService, setNewSpecialService] = useState('');

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
            // TODO: Save to database
        }
    };

    const handleDeleteCategory = (category: string) => {
        if (confirm(`Tem certeza que deseja remover a categoria "${category}"?`)) {
            setCategories(categories.filter(c => c !== category));
            // TODO: Save to database
        }
    };

    const handleEditCategory = (oldCategory: string, newValue: string) => {
        if (newValue.trim() && !categories.includes(newValue.trim())) {
            setCategories(categories.map(c => c === oldCategory ? newValue.trim() : c));
            setEditingCategory(null);
            // TODO: Save to database
        }
    };

    const handleAddGeneralService = () => {
        if (newGeneralService.trim() && !generalServices.includes(newGeneralService.trim())) {
            setGeneralServices([...generalServices, newGeneralService.trim()]);
            setNewGeneralService('');
            // TODO: Save to database
        }
    };

    const handleDeleteGeneralService = (service: string) => {
        if (confirm(`Tem certeza que deseja remover o serviço "${service}"?`)) {
            setGeneralServices(generalServices.filter(s => s !== service));
            // TODO: Save to database
        }
    };

    const handleEditGeneralService = (oldService: string, newValue: string) => {
        if (newValue.trim() && !generalServices.includes(newValue.trim())) {
            setGeneralServices(generalServices.map(s => s === oldService ? newValue.trim() : s));
            setEditingGeneralService(null);
            // TODO: Save to database
        }
    };

    const handleAddSpecialService = () => {
        if (newSpecialService.trim() && !specialServices.includes(newSpecialService.trim())) {
            setSpecialServices([...specialServices, newSpecialService.trim()]);
            setNewSpecialService('');
            // TODO: Save to database
        }
    };

    const handleDeleteSpecialService = (service: string) => {
        if (confirm(`Tem certeza que deseja remover o serviço "${service}"?`)) {
            setSpecialServices(specialServices.filter(s => s !== service));
            // TODO: Save to database
        }
    };

    const handleEditSpecialService = (oldService: string, newValue: string) => {
        if (newValue.trim() && !specialServices.includes(newValue.trim())) {
            setSpecialServices(specialServices.map(s => s === oldService ? newValue.trim() : s));
            setEditingSpecialService(null);
            // TODO: Save to database
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gerenciamento de Categorias e Serviços</h1>
                <p className="text-muted-foreground mt-1">
                    Gerencie categorias de anúncios e serviços disponíveis
                </p>
            </div>

            {/* Categories Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Categorias de Anúncios
                    </h2>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="Nova categoria..."
                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => (
                        <div
                            key={category}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                        >
                            {editingCategory === category ? (
                                <input
                                    type="text"
                                    defaultValue={category}
                                    onBlur={(e) => {
                                        handleEditCategory(category, e.target.value);
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEditCategory(category, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            setEditingCategory(null);
                                        }
                                    }}
                                    autoFocus
                                    className="flex-1 px-2 py-1 bg-background border border-input rounded focus:ring-2 focus:ring-primary outline-none"
                                />
                            ) : (
                                <>
                                    <span className="font-medium">{category}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingCategory(category)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category)}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* General Services Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Serviços Gerais
                    </h2>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newGeneralService}
                        onChange={(e) => setNewGeneralService(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGeneralService()}
                        placeholder="Novo serviço geral..."
                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={handleAddGeneralService}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generalServices.map((service) => (
                        <div
                            key={service}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                        >
                            {editingGeneralService === service ? (
                                <input
                                    type="text"
                                    defaultValue={service}
                                    onBlur={(e) => {
                                        handleEditGeneralService(service, e.target.value);
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEditGeneralService(service, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            setEditingGeneralService(null);
                                        }
                                    }}
                                    autoFocus
                                    className="flex-1 px-2 py-1 bg-background border border-input rounded focus:ring-2 focus:ring-primary outline-none"
                                />
                            ) : (
                                <>
                                    <span className="font-medium">{service}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingGeneralService(service)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGeneralService(service)}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Special Services Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Serviços Especiais
                    </h2>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newSpecialService}
                        onChange={(e) => setNewSpecialService(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialService()}
                        placeholder="Novo serviço especial..."
                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={handleAddSpecialService}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {specialServices.map((service) => (
                        <div
                            key={service}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                        >
                            {editingSpecialService === service ? (
                                <input
                                    type="text"
                                    defaultValue={service}
                                    onBlur={(e) => {
                                        handleEditSpecialService(service, e.target.value);
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEditSpecialService(service, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            setEditingSpecialService(null);
                                        }
                                    }}
                                    autoFocus
                                    className="flex-1 px-2 py-1 bg-background border border-input rounded focus:ring-2 focus:ring-primary outline-none"
                                />
                            ) : (
                                <>
                                    <span className="font-medium">{service}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingSpecialService(service)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSpecialService(service)}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


