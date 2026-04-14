import React, { useState } from 'react';
import { Search, User, Phone, Calendar, ArrowRight, UserPlus, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment } from '../types';

interface ClientsPageProps {
  appointments: Appointment[];
}

export default function ClientsPage({ appointments }: ClientsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique clients from appointments
  const clientsMap = appointments.reduce((acc, app) => {
    if (!app.clientName) return acc;
    
    const key = app.clientName.toLowerCase().trim();
    if (!acc[key]) {
      acc[key] = {
        name: app.clientName,
        phone: app.phone,
        lastVisit: app.date,
        totalVisits: 1,
        appointments: [app]
      };
    } else {
      acc[key].totalVisits += 1;
      acc[key].appointments.push(app);
      if (new Date(app.date) > new Date(acc[key].lastVisit)) {
        acc[key].lastVisit = app.date;
      }
    }
    return acc;
  }, {} as Record<string, { name: string; phone?: string; lastVisit: string; totalVisits: number; appointments: Appointment[] }>);

  const clients = Object.values(clientsMap).sort((a, b) => b.totalVisits - a.totalVisits);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Meus Clientes</h2>
          <p className="text-[var(--muted-foreground)] font-medium">Gerencie sua base de clientes e histórico de atendimentos.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full md:w-80 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-4xl hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{client.name}</h3>
                    {client.phone && (
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">{client.phone}</p>
                    )}
                  </div>
                </div>
                {client.phone && (
                  <button 
                    onClick={() => openWhatsApp(client.phone!)}
                    className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:scale-110 transition-transform"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[var(--muted)] rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">Visitas</p>
                  <p className="text-xl font-black">{client.totalVisits}</p>
                </div>
                <div className="p-4 bg-[var(--muted)] rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)] mb-1">Última</p>
                  <p className="text-sm font-bold">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-sm font-bold text-blue-600 group-hover:gap-2 transition-all cursor-pointer">
                  Ver Histórico Completo
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-[var(--muted)] rounded-3xl flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nenhum cliente encontrado</h3>
              <p className="text-[var(--muted-foreground)] font-medium">Tente buscar por outro nome ou celular.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
