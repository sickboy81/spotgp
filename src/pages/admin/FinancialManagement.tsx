import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Search, Filter, Loader2, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Transaction {
    id: string;
    user_id: string;
    user_name?: string;
    type: 'payment' | 'refund' | 'fee' | 'commission';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    description: string;
    created_at: string;
    payment_method?: string;
}

export default function FinancialManagement() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadTransactions();
    }, [dateRange, filterStatus]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual transactions table query
            // For now, using mock data structure
            const mockTransactions: Transaction[] = [];
            
            setTransactions(mockTransactions);
        } catch (err) {
            console.error('Error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDateFilter = () => {
        const now = new Date();
        switch (dateRange) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return weekAgo;
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            default:
                return null;
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = 
            transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

        const dateFilter = getDateFilter();
        const matchesDate = !dateFilter || new Date(transaction.created_at) >= dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalRevenue = transactions
        .filter(t => t.status === 'completed' && (t.type === 'payment' || t.type === 'commission'))
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunds = transactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0);

    const exportTransactions = () => {
        const csv = [
            ['ID', 'Usuário', 'Tipo', 'Valor', 'Status', 'Descrição', 'Data'].join(','),
            ...filteredTransactions.map(t => [
                t.id,
                t.user_name || '',
                t.type,
                t.amount.toFixed(2),
                t.status,
                `"${t.description}"`,
                new Date(t.created_at).toLocaleString('pt-BR')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestão Financeira</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie pagamentos, receitas e transações
                    </p>
                </div>
                <button
                    onClick={exportTransactions}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Receita Total</p>
                            <p className="text-2xl font-bold mt-1 text-green-600">
                                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Pendentes</p>
                            <p className="text-2xl font-bold mt-1 text-yellow-600">
                                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Reembolsos</p>
                            <p className="text-2xl font-bold mt-1 text-red-600">
                                R$ {totalRefunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Transações</p>
                            <p className="text-2xl font-bold mt-1">{transactions.length}</p>
                        </div>
                        <CreditCard className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, ID ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="today">Hoje</option>
                        <option value="week">Última semana</option>
                        <option value="month">Este mês</option>
                        <option value="all">Todos</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="all">Todos os status</option>
                        <option value="pending">Pendente</option>
                        <option value="completed">Completo</option>
                        <option value="failed">Falhou</option>
                        <option value="refunded">Reembolsado</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Usuário</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Descrição</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                            {transaction.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-4 py-3">
                                            {transaction.user_name || 'Usuário desconhecido'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-1 text-xs font-medium rounded",
                                                transaction.type === 'payment' && "bg-green-500/20 text-green-600",
                                                transaction.type === 'refund' && "bg-red-500/20 text-red-600",
                                                transaction.type === 'fee' && "bg-yellow-500/20 text-yellow-600",
                                                transaction.type === 'commission' && "bg-blue-500/20 text-blue-600"
                                            )}>
                                                {transaction.type === 'payment' && 'Pagamento'}
                                                {transaction.type === 'refund' && 'Reembolso'}
                                                {transaction.type === 'fee' && 'Taxa'}
                                                {transaction.type === 'commission' && 'Comissão'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            {transaction.type === 'refund' || transaction.type === 'fee' ? '-' : '+'}
                                            R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-1 text-xs font-medium rounded",
                                                transaction.status === 'completed' && "bg-green-500/20 text-green-600",
                                                transaction.status === 'pending' && "bg-yellow-500/20 text-yellow-600",
                                                transaction.status === 'failed' && "bg-red-500/20 text-red-600",
                                                transaction.status === 'refunded' && "bg-blue-500/20 text-blue-600"
                                            )}>
                                                {transaction.status === 'completed' && 'Completo'}
                                                {transaction.status === 'pending' && 'Pendente'}
                                                {transaction.status === 'failed' && 'Falhou'}
                                                {transaction.status === 'refunded' && 'Reembolsado'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {transaction.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(transaction.created_at).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhuma transação encontrada
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


