import React, { useState } from 'react';
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
import { Appointment, Service, AppointmentStatus, PaymentMethod, Settings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SmartSchedulePageProps {
  appointments: Appointment[];
  services: Service[];
  settings: Settings;
  onAdd: (appointment: Appointment) => void;
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus, paymentMethod?: PaymentMethod) => void;
}

export default function SmartSchedulePage({ 
  appointments, 
  services,
  settings,
  onAdd, 
  onRemove, 
  onUpdateStatus 
}: SmartSchedulePageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  
  // Form states
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const filteredAppointments = appointments
    .filter(a => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTime || selectedServices.length === 0) return;

    const appointmentServices = services.filter(s => selectedServices.includes(s.id));

    onAdd({
      id: crypto.randomUUID(),
      clientName: newName,
      date: selectedDate,
      time: newTime,
      services: appointmentServices,
      status: 'Pendente',
      paymentMethod: 'Dinheiro',
      notes
    });

    resetForm();
  };

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !notes) return;

    onAdd({
      id: crypto.randomUUID(),
      clientName: 'HORÁRIO BLOQUEADO',
      date: selectedDate,
      time: newTime,
      services: [],
      status: 'Confirmado',
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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-blue-900 dark:text-blue-100 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-blue-600" />
            Agenda Inteligente
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2 font-medium">Gerencie seus horários e compromissos com precisão.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBlocking(true)}
            className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-2xl border-2 border-blue-100 dark:border-blue-800 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Bloquear Horário
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Date Selector */}
      <div className="flex items-center justify-between bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent font-bold text-lg focus:outline-none cursor-pointer"
          />
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Appointment List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-dashed border-[var(--border)]">
            <CalendarIcon className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-20" />
            <p className="text-[var(--muted-foreground)] font-medium">Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((app) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={app.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl group transition-all ${
                  app.isBlocked ? 'opacity-75 border-dashed bg-slate-50 dark:bg-slate-900/20' : 'hover:border-[var(--primary)]'
                }`}
              >
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-colors ${
                    app.isBlocked ? 'bg-slate-200 dark:bg-slate-800' : 'bg-[var(--muted)] group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
                  }`}>
                    <Clock className="w-4 h-4 text-[var(--muted-foreground)] mb-1" />
                    <span className="font-bold text-lg">{app.time}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {app.isBlocked ? (
                        <Lock className="w-4 h-4 text-slate-500" />
                      ) : (
                        <User className="w-4 h-4 text-[var(--primary)]" />
                      )}
                      <h4 className="font-bold text-lg">{app.clientName}</h4>
                      {!app.isBlocked && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      )}
                    </div>
                    {!app.isBlocked && (app.phone || app.cpf) && (
                      <div className="flex items-center gap-3 mb-1 text-xs text-[var(--muted-foreground)]">
                        {app.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {app.phone}
                          </div>
                        )}
                        {app.cpf && (
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {app.cpf}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {app.isBlocked ? app.notes : (app.services || []).map(s => s.name).join(' + ')}
                    </p>
                    {!app.isBlocked && (
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs font-bold text-[var(--primary)]">
                          Total: R$ {(app.services || []).reduce((acc, s) => acc + s.price, 0).toFixed(2)}
                        </p>
                        {app.paymentMethod && (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                            {app.paymentMethod === 'Pix' ? <Wallet className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                            {app.paymentMethod}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <Clock className="w-3 h-3" />
                          <span>{(app.services || []).reduce((acc, s) => acc + s.duration, 0)} min</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!app.isBlocked && app.status !== 'Concluído' && app.status !== 'Cancelado' && (
                    <>
                      <button
                        onClick={() => {
                          const total = (app.services || []).reduce((acc, s) => acc + s.price, 0);
                          const pixInfo = settings.pixKey 
                            ? `\nChave Pix: ${settings.pixKey}${settings.pixName ? `\nTitular: ${settings.pixName}` : ''}`
                            : '\nChave Pix: Não cadastrada';
                          const message = `Olá ${app.clientName}! Aqui está o link para pagamento do seu agendamento (${app.date} às ${app.time}):\n\nValor: R$ ${total.toFixed(2)}${pixInfo}\n\nPor favor, envie o comprovante após o pagamento.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="Enviar Cobrança (WhatsApp)"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(app.id, 'Confirmado')}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="Confirmar"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsCompleting(app.id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="Concluir"
                      >
                        <DollarSign className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(app.id, 'Cancelado')}
                        className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="Cancelar"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onRemove(app.id)}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
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
                  disabled={selectedServices.length === 0}
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
                  className="flex-1 p-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all"
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
