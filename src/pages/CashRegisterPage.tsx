import React, { useState } from 'react';
import { CircleDollarSign, Plus, History, Wallet, CreditCard, Banknote, TrendingUp, Check } from 'lucide-react';
import { Sale, PaymentMethod } from '../types';
import { motion } from 'motion/react';

interface CashRegisterPageProps {
  sales: Sale[];
  onAddSale: (sale: Sale) => void;
}

export default function CashRegisterPage({ sales, onAddSale }: CashRegisterPageProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Pix');

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.timestamp.startsWith(today));

  const totalToday = todaySales.reduce((acc, s) => acc + s.amount, 0);
  
  const totalsByMethod = todaySales.reduce((acc, s) => {
    acc[s.method] = (acc[s.method] || 0) + s.amount;
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    onAddSale({
      id: crypto.randomUUID(),
      amount: val,
      method,
      timestamp: new Date().toISOString()
    });

    setAmount('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <CircleDollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="small-caps">Módulo Financeiro</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-display leading-none">
            Gestão de <br />
            <span className="text-blue-600 italic">Caixa</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form and Totals */}
        <div className="lg:col-span-4 space-y-8">
          {/* Main Total Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 bg-slate-900 text-white rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5"
          >
            <div className="relative z-10">
              <p className="small-caps mb-4 text-blue-400">Faturamento Hoje</p>
              <h3 className="text-5xl font-black tracking-tighter font-display">{formatCurrency(totalToday)}</h3>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ativo & Sincronizado</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-blue-600/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
          </motion.div>

          {/* Quick Add Form */}
          <div className="bento-card !p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xl font-display tracking-tight uppercase tracking-widest text-xs">Lançar Venda</h4>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-8">
              <div className="space-y-3">
                <label className="small-caps px-1">Valor do Recebimento</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600 text-2xl font-display">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full p-6 pl-16 bg-[var(--muted)] rounded-3xl border border-transparent focus:border-blue-500/30 focus:bg-[var(--card)] focus:ring-4 focus:ring-blue-500/5 transition-all font-black text-4xl tracking-tighter font-display"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="small-caps px-1">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Pix', 'Dinheiro', 'Cartão'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
                        method === m 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/40 scale-105' 
                          : 'bg-[var(--muted)] border-transparent text-[var(--muted-foreground)] hover:border-blue-500/30 hover:text-blue-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-3"
              >
                <Check className="w-5 h-5" />
                Registrar Venda
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History & Subtotals */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Pix', icon: Wallet },
              { label: 'Dinheiro', icon: Banknote },
              { label: 'Cartão', icon: CreditCard }
            ].map((item) => (
              <div key={item.label} className="bento-card !p-6 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-[var(--muted)] rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="small-caps">{item.label}</span>
                </div>
                <p className="text-2xl font-black font-display tracking-tight">
                  {formatCurrency(totalsByMethod[item.label as PaymentMethod] || 0)}
                </p>
              </div>
            ))}
          </div>

          <div className="bento-card !p-10 h-full">
            <div className="flex items-center justify-between mb-10">
              <h4 className="font-black text-2xl font-display tracking-tight">Histórico de Hoje</h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                <History className="w-5 h-5" />
              </div>
            </div>
            
            {todaySales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[var(--muted)] rounded-[40px] border border-dashed border-[var(--border)]">
                <CircleDollarSign className="w-16 h-16 mb-4 opacity-10" />
                <p className="small-caps">Vendas em branco</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-[var(--border)]">
                      <th className="pb-6 small-caps">Momento</th>
                      <th className="pb-6 small-caps">Método</th>
                      <th className="pb-6 small-caps text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {todaySales.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((sale) => (
                      <tr key={sale.id} className="group transition-colors hover:bg-[var(--muted)]/50">
                        <td className="py-6 font-bold text-sm text-[var(--muted-foreground)]">
                          {new Date(sale.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-6">
                          <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {sale.method}
                          </span>
                        </td>
                        <td className="py-6 text-right font-black text-xl font-display tracking-tight">
                          {formatCurrency(sale.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
