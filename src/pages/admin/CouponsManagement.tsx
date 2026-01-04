import { useState, useEffect } from 'react';
import { Ticket, Plus, Edit, Trash2, Copy, CheckCircle, XCircle, Percent, DollarSign, Gift, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'free_trial';
    value: number; // Percentage (0-100) or fixed amount in R$
    description: string;
    max_uses: number | null; // null = unlimited
    used_count: number;
    valid_from: string;
    valid_until: string | null; // null = no expiration
    is_active: boolean;
    applicable_plans: string[]; // Empty = all plans
    min_purchase_amount?: number | null;
    created_at: string;
}

export default function CouponsManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [couponForm, setCouponForm] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed' | 'free_trial',
        value: 10,
        description: '',
        max_uses: null as number | null,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: null as string | null,
        is_active: true,
        applicable_plans: [] as string[],
        min_purchase_amount: null as number | null,
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const result = await directus.request(readItems('coupons', {
                sort: ['-date_created'],
                limit: 50
            }));
            const mappedCoupons = result.map((c: any) => ({
                ...c,
                created_at: c.date_created // Map Directus date_created to created_at
            }));
            setCoupons(mappedCoupons as Coupon[]);
        } catch (err) {
            console.warn('Error loading coupons:', err);
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCouponForm({ ...couponForm, code });
    };

    const handleSaveCoupon = async () => {
        if (!couponForm.code.trim()) {
            alert('Código do cupom é obrigatório');
            return;
        }

        try {
            const data = {
                ...couponForm,
                // Ensure dates are ISO strings if needed, though PocketBase accepts strings usually
                valid_from: new Date(couponForm.valid_from).toISOString(),
                valid_until: couponForm.valid_until ? new Date(couponForm.valid_until).toISOString() : null,
            };

            if (editingCoupon) {
                // Update existing coupon
                await directus.request(updateItem('coupons', editingCoupon.id, data));
                setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...editingCoupon, ...data } as Coupon : c));
                alert('Cupom atualizado com sucesso!');
            } else {
                // Create new coupon
                // Check local duplicate mainly for UX, DB will constraints too
                if (coupons.some(c => c.code.toLowerCase() === couponForm.code.toLowerCase())) {
                    alert('Este código de cupom já existe');
                    return;
                }

                const newCoupon = await directus.request(createItem('coupons', {
                    ...data,
                    used_count: 0,
                }));
                // Try to map back, but usually we just reload or optimistically add
                const mappedNewCoupon = {
                    ...newCoupon,
                    created_at: newCoupon.date_created
                };
                setCoupons([mappedNewCoupon as unknown as Coupon, ...coupons]);
                alert('Cupom criado com sucesso!');
            }

            setShowForm(false);
            setEditingCoupon(null);
            resetForm();
        } catch (err: any) {
            console.error('Error saving coupon:', err);
            alert(`Erro ao salvar cupom: ${err.message || err}`);
        }
    };

    const resetForm = () => {
        setCouponForm({
            code: '',
            type: 'percentage',
            value: 10,
            description: '',
            max_uses: null,
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: null,
            is_active: true,
            applicable_plans: [],
            min_purchase_amount: null,
        });
    };

    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setCouponForm({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            description: coupon.description,
            max_uses: coupon.max_uses,
            valid_from: coupon.valid_from.split('T')[0],
            valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : null,
            is_active: coupon.is_active,
            applicable_plans: coupon.applicable_plans,
            min_purchase_amount: coupon.min_purchase_amount || null,
        });
        setShowForm(true);
    };

    const handleDeleteCoupon = async (couponId: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (confirm('Tem certeza que deseja deletar este cupom?')) {
            try {
                await directus.request(deleteItem('coupons', couponId));
                setCoupons(coupons.filter(c => c.id !== couponId));
            } catch (err: any) {
                console.error('Error deleting coupon:', err);
                alert(`Erro ao deletar cupom: ${err.message}`);
            }
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert('Código copiado para a área de transferência!');
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const newState = !coupon.is_active;
            await directus.request(updateItem('coupons', coupon.id, { is_active: newState }));
            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: newState } : c));
        } catch (err: any) {
            console.error('Error updating coupon:', err);
            alert(`Erro ao atualizar status: ${err.message}`);
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isCouponValid = (coupon: Coupon) => {
        if (!coupon.is_active) return false;
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        if (now < validFrom) return false;
        if (coupon.valid_until) {
            const validUntil = new Date(coupon.valid_until);
            if (now > validUntil) return false;
        }
        if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return false;
        return true;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Cupons</h1>
                    <p className="text-muted-foreground mt-1">
                        Criar e gerenciar cupons de desconto e períodos grátis
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingCoupon(null);
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Cupom
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Cupons</p>
                            <p className="text-2xl font-bold mt-1">{coupons.length}</p>
                        </div>
                        <Ticket className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Ativos</p>
                            <p className="text-2xl font-bold mt-1">{coupons.filter(c => c.is_active).length}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Válidos</p>
                            <p className="text-2xl font-bold mt-1">{coupons.filter(isCouponValid).length}</p>
                        </div>
                        <Gift className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Usado</p>
                            <p className="text-2xl font-bold mt-1">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
                        </div>
                        <Ticket className="w-8 h-8 text-orange-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                    type="text"
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    aria-label="Buscar cupons"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">
                        {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Código do Cupom *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponForm.code}
                                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Ex: DESCONTO10"
                                        aria-label="Código do cupom"
                                    />
                                    <button
                                        onClick={generateCouponCode}
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                        title="Gerar código aleatório"
                                        aria-label="Gerar código aleatório"
                                    >
                                        <Ticket className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    value={couponForm.type}
                                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as 'percentage' | 'fixed' | 'free_trial' })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    aria-label="Tipo de cupom"
                                >
                                    <option value="percentage">Percentual (%)</option>
                                    <option value="fixed">Valor Fixo (R$)</option>
                                    <option value="free_trial">Período Grátis (dias)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {couponForm.type === 'percentage' && 'Desconto (%)'}
                                    {couponForm.type === 'fixed' && 'Desconto (R$)'}
                                    {couponForm.type === 'free_trial' && 'Dias Grátis'}
                                </label>
                                <input
                                    type="number"
                                    step={couponForm.type === 'percentage' ? '1' : '0.01'}
                                    value={couponForm.value}
                                    onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    max={couponForm.type === 'percentage' ? 100 : undefined}
                                    aria-label="Valor do desconto"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Máximo de Usos</label>
                                <input
                                    type="number"
                                    value={couponForm.max_uses || ''}
                                    onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Deixe vazio para ilimitado"
                                    aria-label="Máximo de usos"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Válido a partir de</label>
                                <input
                                    type="date"
                                    value={couponForm.valid_from}
                                    onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    aria-label="Válido a partir de"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Válido até (opcional)</label>
                                <input
                                    type="date"
                                    value={couponForm.valid_until || ''}
                                    onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value || null })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    aria-label="Válido até"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Descrição</label>
                            <textarea
                                value={couponForm.description}
                                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none h-24"
                                placeholder="Descrição do cupom"
                                aria-label="Descrição do cupom"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={couponForm.is_active}
                                onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                                className="w-4 h-4"
                                aria-label="Cupom ativo"
                            />
                            <label className="text-sm">Cupom ativo</label>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingCoupon(null);
                                }}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveCoupon}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoupons.map((coupon) => {
                    const isValid = isCouponValid(coupon);
                    return (
                        <div key={coupon.id} className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono font-bold text-lg">{coupon.code}</span>
                                        <button
                                            onClick={() => handleCopyCode(coupon.code)}
                                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                            title="Copiar código"
                                            aria-label="Copiar código"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleActive(coupon)}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            coupon.is_active
                                                ? "text-green-600 hover:bg-green-500/10"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                        title={coupon.is_active ? "Desativar" : "Ativar"}
                                        aria-label={coupon.is_active ? "Desativar cupom" : "Ativar cupom"}
                                    >
                                        {coupon.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleEditCoupon(coupon)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                        title="Editar Cupom"
                                        aria-label="Editar Cupom"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCoupon(coupon.id)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        title="Excluir Cupom"
                                        aria-label="Excluir Cupom"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {coupon.type === 'percentage' && <Percent className="w-4 h-4 text-primary" />}
                                    {coupon.type === 'fixed' && <DollarSign className="w-4 h-4 text-primary" />}
                                    {coupon.type === 'free_trial' && <Gift className="w-4 h-4 text-primary" />}
                                    <span className="font-bold text-lg">
                                        {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                                        {coupon.type === 'fixed' && `R$ ${coupon.value.toFixed(2)} OFF`}
                                        {coupon.type === 'free_trial' && `${coupon.value} dias grátis`}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div>Usado: {coupon.used_count} / {coupon.max_uses || '∞'}</div>
                                    <div>Válido de: {new Date(coupon.valid_from).toLocaleDateString('pt-BR')}</div>
                                    {coupon.valid_until && (
                                        <div>Até: {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</div>
                                    )}
                                </div>
                                <div className={cn(
                                    "px-2 py-1 text-xs font-medium rounded text-center",
                                    isValid ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                                )}>
                                    {isValid ? 'Válido' : 'Inválido'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCoupons.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhum cupom encontrado. Clique em "Novo Cupom" para criar um.
                </div>
            )}
        </div>
    );
}





