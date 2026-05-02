import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  Calendar as CalendarIcon, 
  Calendar,
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Unlock,
  DollarSign,
  Info,
  MessageSquare,
  Wallet,
  Banknote,
  Phone,
  Hash
} from 'lucide-react';
import { Appointment, Service, AppointmentStatus, PaymentMethod, Settings, Professional } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SmartSchedulePageProps {
  appointments: Appointment[];
  services: Service[];
  settings: Settings;
  professionals: Professional[];
  onAdd: (appointment: Appointment) => void;
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus, paymentMethod?: PaymentMethod) => void;
}

export default function SmartSchedulePage({ 
  appointments, 
  services,
  settings,
  professionals,
  onAdd, 
  onRemove, 
  onUpdateStatus 
}: SmartSchedulePageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  
  // Selection
  const [selectedProfessionalView, setSelectedProfessionalView] = useState<string | 'all'>('all');

  // Form states
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [targetProfessionalId, setTargetProfessionalId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const filteredAppointments = appointments
    .filter(a => a.date === selectedDate)
    .filter(a => selectedProfessionalView === 'all' || a.professionalId === selectedProfessionalView)
    .sort((a, b) => a.time.localeCompare(b.time));

  useEffect(() => {
    // If no professionals selected but available, auto-select first one for new additions
    if (!targetProfessionalId && professionals.length > 0) {
      setTargetProfessionalId(professionals[0].id);
    }
  }, [professionals, targetProfessionalId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTime || selectedServices.length === 0 || !targetProfessionalId) return;

    const appointmentServices = services.filter(s => selectedServices.includes(s.id));

    onAdd({
      id: crypto.randomUUID(),
      clientName: newName,
      date: selectedDate,
      time: newTime,
      services: appointmentServices,
      status: 'Pendente',
      paymentMethod: 'Dinheiro',
      professionalId: targetProfessionalId,
      notes
    });

    resetForm();
  };

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !notes || !targetProfessionalId) return;

    onAdd({
      id: crypto.randomUUID(),
      clientName: 'HORÁRIO BLOQUEADO',
      date: selectedDate,
      time: newTime,
      services: [],
      status: 'Confirmado',
      professionalId: targetProfessionalId,
      isBlocked: true,
      notes
    });

    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewTime('');
    setSelectedServices([]);
    setNotes('');
    setIsAdding(false);
    setIsBlocking(false);
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmado': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'Concluído': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'Cancelado': return <XCircle className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
      case 'Concluído': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
      case 'Cancelado': return 'bg-blue-100/50 text-blue-400 dark:bg-blue-900/10';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="small-caps">Gestão de Fluxo</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-display leading-none">
            Agenda <br />
            <span className="text-blue-600 italic">Inteligente</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsBlocking(true)}
            className="flex-1 lg:flex-none px-8 py-4 bg-[var(--card)] text-[var(--foreground)] font-bold rounded-2xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Lock className="w-5 h-5" />
            <span className="hidden sm:inline">Bloquear Horário</span>
            <span className="sm:hidden">Bloquear</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Date Selector and Professional Filter Header */}
      <div className="flex flex-col md:flex-row items-center gap-4 sticky top-[100px] z-20 glass rounded-3xl border border-[var(--border)] p-4 shadow-2xl shadow-black/[0.02]">
        <div className="flex items-center justify-between w-full md:w-auto">
          <button onClick={() => changeDate(-1)} className="p-4 hover:bg-[var(--muted)] rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-black text-xl md:text-2xl tracking-tighter font-display focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <button onClick={() => changeDate(1)} className="p-4 hover:bg-[var(--muted)] rounded-xl transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full md:w-[1px] h-[1px] md:h-10 bg-[var(--border)]" />

        <div className="flex-1 w-full flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setSelectedProfessionalView('all')}
            className={`flex-shrink-0 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              selectedProfessionalView === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
            }`}
          >
            Todos
          </button>
          {professionals.map(prof => (
            <button
              key={prof.id}
              onClick={() => setSelectedProfessionalView(prof.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all border ${
                selectedProfessionalView === prof.id
                  ? 'bg-[var(--background)] border-blue-600 text-blue-600 shadow-sm'
                  : 'bg-[var(--muted)] border-transparent text-[var(--muted-foreground)] hover:bg-[var(--border)]'
              }`}
            >
              {prof.photo ? (
                <img src={prof.photo} alt={prof.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {prof.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="space-y-6">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-32 bg-[var(--card)] rounded-5xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[var(--muted)] flex items-center justify-center mb-6">
              <CalendarIcon className="w-10 h-10 text-[var(--muted-foreground)] opacity-30" />
            </div>
            <h3 className="text-2xl font-black font-display tracking-tight opacity-50">Silêncio na Barbearia</h3>
            <p className="text-[var(--muted-foreground)] font-bold mt-2">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((app) => {
              const prof = professionals.find(p => p.id === app.professionalId);
              return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={app.id}
                className={`bento-card group flex flex-col lg:flex-row lg:items-center justify-between gap-8 !p-6 ${
                  app.isBlocked ? 'opacity-50 border-dashed bg-slate-50 dark:bg-slate-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl transition-all duration-500 flex-shrink-0 ${
                    app.isBlocked 
                      ? 'bg-slate-200 dark:bg-slate-800' 
                      : 'bg-[var(--muted)] group-hover:bg-blue-600 group-hover:text-white shadow-xl shadow-black/[0.02]'
                  }`}>
                    <Clock className={`w-4 h-4 mb-1 ${app.isBlocked ? 'text-slate-400' : 'text-blue-600 group-hover:text-blue-100'}`} />
                    <span className="font-black text-xl font-display">{app.time}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-2xl font-black tracking-tight font-display">{app.clientName}</h4>
                      {!app.isBlocked && (
                        <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(app.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${app.status === 'Concluído' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                          {app.status}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-5">
                      <p className="text-[var(--muted-foreground)] font-bold text-sm">
                        {app.isBlocked ? app.notes : (app.services || []).map(s => s.name).join(' + ')}
                      </p>
                      
                      {prof && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <User className="w-3.5 h-3.5" />
                          {prof.name.split(' ')[0]}
                        </div>
                      )}

                      {!app.isBlocked && (
                        <div className="flex items-center gap-4 border-l border-[var(--border)] pl-4">
                          <p className="text-sm font-black text-blue-600">
                            R$ {(app.services || []).reduce((acc, s) => acc + s.price, 0).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                            <Clock className="w-3.5 h-3.5" />
                            {(app.services || []).reduce((acc, s) => acc + s.duration, 0)} min
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:bg-[var(--muted)] lg:p-2 lg:rounded-2xl transition-all">
                  {!app.isBlocked && app.status !== 'Concluído' && app.status !== 'Cancelado' && (
                    <div className="flex items-center gap-2 pr-2 border-r border-[var(--border)] mr-2">
                      <button
                        onClick={() => {
                          const total = (app.services || []).reduce((acc, s) => acc + s.price, 0);
                          const pixInfo = settings.pixKey 
                            ? `\nChave Pix: ${settings.pixKey}${settings.pixName ? `\nTitular: ${settings.pixName}` : ''}`
                            : '\nChave Pix: Não cadastrada';
                          const message = `Olá ${app.clientName}! Aqui está o link para pagamento do seu agendamento (${app.date} às ${app.time}):\n\nValor: R$ ${total.toFixed(2)}${pixInfo}\n\nPor favor, envie o comprovante após o pagamento.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="p-3 text-blue-600 hover:bg-white rounded-xl transition-all hover:scale-110 active:scale-90"
                        title="Enviar Cobrança (WhatsApp)"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(app.id, 'Confirmado')}
                        className="p-3 text-emerald-600 hover:bg-white rounded-xl transition-all hover:scale-110 active:scale-95"
                        title="Confirmar"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {!app.isBlocked && app.status !== 'Concluído' && app.status !== 'Cancelado' && (
                    <button
                      onClick={() => setIsCompleting(app.id)}
                      className="flex items-center gap-2 px-5 py-3 bg-[var(--foreground)] text-[var(--background)] font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-xl shadow-black/5"
                    >
                      <DollarSign className="w-4 h-4" />
                      Finalizar
                    </button>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemove(app.id)}
                      className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Remover"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-lg bg-[var(--card)] p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold">Novo Agendamento</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Nome do Cliente</label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Profissional</label>
                  <select
                    value={targetProfessionalId}
                    onChange={(e) => setTargetProfessionalId(e.target.value)}
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                    required
                  >
                    {!targetProfessionalId && <option value="" disabled>Selecione um profissional</option>}
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Data</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Serviços</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(services || []).map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedServices.includes(service.id)
                            ? 'border-[var(--primary)] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent bg-[var(--muted)]'
                        }`}
                      >
                        <div className="font-bold text-sm">{service.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">R$ {service.price.toFixed(2)} • {service.duration} min</div>
                      </button>
                    ))}
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div className="text-xs font-bold text-[var(--primary)] uppercase">Resumo</div>
                      <div className="flex gap-4 text-sm font-bold">
                        <span>R$ {(services || []).filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.price, 0).toFixed(2)}</span>
                        <span className="text-[var(--muted-foreground)]">{(services || []).filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.duration, 0)} min</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Observações (Opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma observação especial?"
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 p-4 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedServices.length === 0 || !targetProfessionalId}
                  className="flex-1 p-4 bg-[var(--primary)] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Block Modal */}
      <AnimatePresence>
        {isBlocking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlocking(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleBlock}
              className="relative w-full max-w-md bg-[var(--card)] p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6 text-slate-500" />
                Bloquear Horário
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Profissional</label>
                  <select
                    value={targetProfessionalId}
                    onChange={(e) => setTargetProfessionalId(e.target.value)}
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-slate-500 transition-all"
                    required
                  >
                    {!targetProfessionalId && <option value="" disabled>Selecione um profissional</option>}
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Motivo / Descrição</label>
                  <input
                    autoFocus
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Almoço, Folga, Manutenção"
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-slate-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Horário</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-slate-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBlocking(false)}
                  className="flex-1 p-4 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!targetProfessionalId}
                  className="flex-1 p-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bloquear
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Modal (Payment Method) */}
      <AnimatePresence>
        {isCompleting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompleting(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--card)] p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">Concluir Atendimento</h3>
                <p className="text-[var(--muted-foreground)]">Selecione o método de pagamento para registrar no caixa.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {(['Pix', 'Dinheiro', 'Cartão'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      onUpdateStatus(isCompleting, 'Concluído', method);
                      setIsCompleting(null);
                    }}
                    className="flex items-center justify-between p-4 bg-[var(--muted)] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group"
                  >
                    <span className="font-bold text-lg group-hover:text-blue-500 transition-colors">{method}</span>
                    <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCompleting(null)}
                className="w-full p-4 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
