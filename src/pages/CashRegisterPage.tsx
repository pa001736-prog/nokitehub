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
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Caixa</h2>
        <p className="text-[var(--muted-foreground)]">Controle suas entradas financeiras diárias.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form and Totals */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Total Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl shadow-2xl shadow-blue-500/20 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 opacity-80">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Faturamento de Hoje</span>
              </div>
              <h3 className="text-4xl font-black tracking-tight">{formatCurrency(totalToday)}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-100/80">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Caixa aberto e sincronizado
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </motion.div>

          {/* Quick Add Form */}
          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xl shadow-black/5 space-y-6">
            <h4 className="font-bold text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              Lançar Venda
            </h4>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] px-1">Valor do Recebimento</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-blue-600 text-xl">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full p-5 pl-14 bg-[var(--muted)] rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-2xl tracking-tight"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] px-1">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Pix', 'Dinheiro', 'Cartão'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all border-2 ${
                        method === m 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105' 
                          : 'bg-[var(--muted)] border-transparent text-[var(--muted-foreground)] hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full p-5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Confirmar Recebimento
              </button>
            </form>
          </div>

          {/* Subtotals */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Pix', icon: Wallet, color: 'text-blue-500' },
              { label: 'Dinheiro', icon: Banknote, color: 'text-blue-500' },
              { label: 'Cartão', icon: CreditCard, color: 'text-blue-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-bold">{item.label}</span>
                </div>
                <span className="font-bold">{formatCurrency(totalsByMethod[item.label as PaymentMethod] || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-3xl h-full">
            <h4 className="font-bold text-lg flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-blue-500" />
              Histórico Recente
            </h4>
            
            {todaySales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <CircleDollarSign className="w-16 h-16 mb-4" />
                <p className="font-bold">Nenhuma venda hoje.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-[var(--border)]">
                      <th className="pb-4 font-bold text-[var(--muted-foreground)] uppercase text-xs tracking-widest">Hora</th>
                      <th className="pb-4 font-bold text-[var(--muted-foreground)] uppercase text-xs tracking-widest">Método</th>
                      <th className="pb-4 font-bold text-[var(--muted-foreground)] uppercase text-xs tracking-widest text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {todaySales.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((sale) => (
                      <tr key={sale.id} className="group">
                        <td className="py-4 font-medium text-[var(--muted-foreground)]">
                          {new Date(sale.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            sale.method === 'Pix' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                            sale.method === 'Dinheiro' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          }`}>
                            {sale.method}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold text-lg">
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
