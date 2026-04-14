import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Package, 
  Tag, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  X, 
  Save, 
  Check, 
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface InventoryPageProps {
  inventory: Product[];
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
}

export default function InventoryPage({ inventory, onAdd, onRemove, onUpdate }: InventoryPageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newMinStock, setNewMinStock] = useState('5');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newStock) return;

    onAdd({
      id: crypto.randomUUID(),
      name: newName,
      category: newCategory,
      price: parseFloat(newPrice),
      cost: parseFloat(newCost) || 0,
      stock: parseInt(newStock),
      minStock: parseInt(newMinStock) || 5
    });

    resetForm();
    setIsAdding(false);
    toast.success('Produto adicionado ao estoque!');
  };

  const resetForm = () => {
    setNewName('');
    setNewCategory('');
    setNewPrice('');
    setNewCost('');
    setNewStock('0');
    setNewMinStock('5');
  };

  const updateStock = (id: string, currentStock: number, delta: number) => {
    const newStockValue = Math.max(0, currentStock + delta);
    onUpdate(id, { stock: newStockValue });
    if (newStockValue <= (inventory.find(p => p.id === id)?.minStock || 0)) {
      toast.warning('Estoque baixo para este produto!');
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Estoque</h2>
          <p className="text-[var(--muted-foreground)] font-medium">Controle seus produtos e suprimentos.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInventory.map((product) => {
          const isLowStock = product.stock <= (product.minStock || 0);
          return (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-[var(--card)] rounded-[32px] p-8 border transition-all group relative overflow-hidden flex flex-col ${
                isLowStock ? 'border-amber-500/50 shadow-amber-500/5' : 'border-[var(--border)] shadow-sm hover:shadow-xl'
              }`}
            >
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1.5 rounded-bl-2xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Estoque Baixo
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center border-2 border-blue-500/10">
                  <Package className="w-7 h-7 text-blue-600" />
                </div>
                <button
                  onClick={() => setProductToDelete(product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 mb-6 flex-1">
                <h3 className="text-xl font-black truncate">{product.name}</h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{product.category || 'Sem Categoria'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[var(--muted)] rounded-2xl">
                  <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Preço</p>
                  <p className="text-lg font-black">R$ {product.price.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[var(--muted)] rounded-2xl">
                  <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Estoque</p>
                  <p className={`text-lg font-black ${isLowStock ? 'text-amber-600' : ''}`}>{product.stock}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStock(product.id, product.stock, -1)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Saída
                </button>
                <button
                  onClick={() => updateStock(product.id, product.stock, 1)}
                  className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  Entrada
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--card)] rounded-[40px] p-10 shadow-2xl border border-[var(--border)] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tight">Novo Produto</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Nome do Produto</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: Pomada Modeladora"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Categoria</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Ex: Cabelo"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Preço Venda</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <input
                          type="number"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Estoque Inicial</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Estoque Mínimo</label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                        <input
                          type="number"
                          value={newMinStock}
                          onChange={(e) => setNewMinStock(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  <Save className="w-6 h-6" />
                  Salvar no Estoque
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--card)] p-6 rounded-3xl shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Tem certeza?</h3>
              <p className="text-[var(--muted-foreground)]">Esta ação não pode ser desfeita. O produto será excluído permanentemente.</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 p-3 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onRemove(productToDelete);
                    setProductToDelete(null);
                  }}
                  className="flex-1 p-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
