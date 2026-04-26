import React from 'react';
import { Calendar, CircleDollarSign, Settings, ArrowRight, ExternalLink, Users, TrendingUp, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Subscription, Appointment } from '../types';

interface HomePageProps {
  shopName: string;
  shopLogo?: string;
  onNavigate: (page: 'home' | 'schedule' | 'cash' | 'settings' | 'clients') => void;
  subscription?: Subscription;
  appointments: Appointment[];
}

export default function HomePage({ shopName, shopLogo, onNavigate, subscription, appointments }: HomePageProps) {
  const isBasic = subscription?.plan === 'Básico' || subscription?.plan === 'Trial Básico';

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today && !a.isBlocked);
  const completedToday = todayAppointments.filter(a => a.status === 'Concluído').length;
  const pendingToday = todayAppointments.filter(a => a.status !== 'Concluído' && a.status !== 'Cancelado').length;

  const cards = [
    {
      id: 'schedule',
      title: 'Agenda Inteligente',
      description: 'Gerencie seus horários e clientes de forma simples.',
      icon: Calendar,
      color: 'bg-blue-600',
      page: 'schedule' as const,
      show: true
    },
    {
      id: 'clients',
      title: 'Meus Clientes',
      description: 'Cadastro e histórico completo de quem frequenta sua barbearia.',
      icon: Users,
      color: 'bg-indigo-600',
      page: 'clients' as const,
      show: true
    },
    {
      id: 'cash',
      title: 'Gestão de Caixa',
      description: 'Controle suas vendas e fluxo financeiro diário.',
      icon: CircleDollarSign,
      color: 'bg-slate-900',
      page: 'cash' as const,
      show: !isBasic
    },
    {
      id: 'reports',
      title: 'Relatórios Master',
      description: 'Análise detalhada de faturamento e desempenho.',
      icon: TrendingUp,
      color: 'bg-purple-600',
      page: 'cash' as const,
      show: subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Personalize o sistema com sua marca e preferências.',
      icon: Settings,
      color: 'bg-blue-900',
      page: 'settings' as const,
      show: true
    }
  ].filter(c => c.show);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Olá, <span className="text-blue-600">{shopName}</span>
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 font-medium">
            Bem-vindo ao seu painel administrativo.
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-white/5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Sistema Online</span>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{todayAppointments.length}</p>
          <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mt-1">Total Hoje</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{completedToday}</p>
          <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mt-1">Concluídos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{pendingToday}</p>
          <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mt-1">Pendentes</p>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.3 }}
            onClick={() => onNavigate(card.page)}
            className="group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl text-left transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-2xl ${card.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-black/5`}>
              <card.icon className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">{card.title}</h3>
              <p className="text-[var(--muted-foreground)] text-sm font-medium leading-relaxed">
                {card.description}
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              Acessar
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
