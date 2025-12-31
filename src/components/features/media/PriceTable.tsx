import { Plus, Minus } from 'lucide-react';

interface PriceRow {
    description: string;
    price: number;
}

interface PriceTableProps {
    prices: PriceRow[];
    onPricesChange: (prices: PriceRow[]) => void;
}

export function PriceTable({ prices, onPricesChange }: PriceTableProps) {
    const handleAddRow = () => {
        onPricesChange([...prices, { description: '', price: 0 }]);
    };

    const handleRemoveRow = (index: number) => {
        if (prices.length > 1) {
            onPricesChange(prices.filter((_, i) => i !== index));
        }
    };

    const handleUpdate = (index: number, field: 'description' | 'price', value: string | number) => {
        const newPrices = [...prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        onPricesChange(newPrices);
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">
                            Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">
                            Preço reais
                        </th>
                        <th className="w-12 border-b border-border"></th>
                    </tr>
                </thead>
                <tbody>
                    {prices.map((row, index) => (
                        <tr key={index} className="border-b border-border last:border-b-0">
                            <td className="px-4 py-2">
                                <input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                                    className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Ex: 1 hora, 2 horas..."
                                />
                            </td>
                            <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">R$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.price || ''}
                                        onChange={(e) => handleUpdate(index, 'price', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="0,00"
                                    />
                                </div>
                            </td>
                            <td className="px-2 py-2">
                                {prices.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveRow(index)}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        type="button"
                                        aria-label="Remover linha"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-3 border-t border-border bg-muted/30">
                <button
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    type="button"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar linha
                </button>
            </div>
        </div>
    );
}


