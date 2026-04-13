import React from 'react';
import { Calendar, CircleDollarSign, Settings, ArrowRight, ExternalLink, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center p-2 border border-[var(--border)] overflow-hidden"
          >
            <img 
              src={shopLogo || '/logoo.png'} 
              alt="Logo" 
              className="w-full h-full object-contain" 
              onError={(e) => (e.currentTarget.src = '/logoo.png')}
            />
          </motion.div>
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 dark:border-blue-800 w-fit"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Plano {subscription?.plan || 'Trial Básico'}
            </motion.div>
          </div>
        </div>
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-6xl font-black tracking-tighter leading-tight text-[var(--foreground)]"
        >
          Bem-vindo, <span className="text-[var(--primary)]">{shopName}</span>
        </motion.h2>
      </header>

      {/* Daily Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-4xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[var(--foreground)]">Agendados Hoje</h3>
            </div>
            <p className="text-4xl font-black text-blue-600">{todayAppointments.length}</p>
          </div>

          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-4xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[var(--foreground)]">Cortes Concluídos</h3>
            </div>
            <p className="text-4xl font-black text-green-600">{completedToday}</p>
          </div>

          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-4xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[var(--foreground)]">Aguardando</h3>
            </div>
            <p className="text-4xl font-black text-amber-600">{pendingToday}</p>
          </div>
        </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onNavigate(card.page)}
            className="group relative flex flex-col items-start p-8 bg-[var(--card)] border border-[var(--border)] rounded-4xl text-left transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5"
          >
            <div className={`p-4 rounded-2xl ${card.color} text-white mb-8 shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform duration-500`}>
              <card.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">{card.title}</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-10 leading-relaxed font-medium">
              {card.description}
            </p>
            <div className="mt-auto flex items-center gap-2 text-[var(--accent)] font-bold text-sm group-hover:gap-3 transition-all">
              Acessar Módulo
              <ArrowRight className="w-5 h-5" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
