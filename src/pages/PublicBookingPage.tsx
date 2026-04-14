import React, { useState, useEffect } from 'react';
import { isIOS } from '../lib/pwa';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Scissors,
  Info,
  ArrowRight,
  Check,
  Copy,
  Phone,
  Hash,
  Wallet,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, onSnapshot, writeBatch, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { Service, Settings, Appointment, PaymentMethod, BusySlot } from '../types';

type BookingStep = 'SERVICES' | 'CONFIRM_SERVICES' | 'DATETIME' | 'PAYMENT' | 'DETAILS';

interface PublicBookingPageProps {
  shopId: string;
  settings: Settings;
  busySlots: BusySlot[];
  onAddAppointment: (appointment: Appointment) => Promise<void>;
}

export default function PublicBookingPage({ shopId, settings, busySlots, onAddAppointment }: PublicBookingPageProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('SERVICES');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Meus Agendamentos State
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleSearchAppointments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const q = query(
        collection(db, 'shops', shopId, 'appointments'),
        where('phone', '==', searchPhone)
      );
      const snap = await getDocs(q);
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      
      // Sort by date/time descending
      apps.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMyAppointments(apps);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `shops/${shopId}/appointments`);
      toast.error('Erro ao buscar agendamentos.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelAppointment = async (appId: string, date: string, time: string) => {
    try {
      const batch = writeBatch(db);
      
      // Update appointment status
      batch.update(doc(db, 'shops', shopId, 'appointments', appId), {
        status: 'Cancelado'
      });
      
      // Remove busy slot
      const slotId = `${date}_${time}`;
      batch.delete(doc(db, 'shops', shopId, 'busy_slots', slotId));
      
      await batch.commit();
      toast.success('Agendamento cancelado com sucesso.');
      
      // Update local state
      setMyAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: 'Cancelado' } : a));
      setCancelingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}/appointments/${appId}`);
      toast.error('Erro ao cancelar agendamento.');
    }
  };

  const isTimeOccupied = (time: string) => {
    return busySlots.some(s => 
      s.date === selectedDate && 
      s.time === time
    );
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBooking = async () => {
    if (!clientName || !selectedDate || !selectedTime || selectedServices.length === 0 || !settings) return;

    setIsSubmitting(true);
    try {
      const appointmentServices = settings.services.filter(s => selectedServices.includes(s.id));
      const appointment: Appointment = {
        id: crypto.randomUUID(),
        clientName,
        date: selectedDate,
        time: selectedTime,
        services: appointmentServices,
        status: 'Pendente',
        notes: `Telefone: ${phone}${cpf ? ` | CPF: ${cpf}` : ''}${notes ? ` | Notas: ${notes}` : ''}`,
        createdAt: new Date().toISOString()
      };

      await onAddAppointment(appointment);
      
      // Automatic WhatsApp message
      const total = appointmentServices.reduce((acc, s) => acc + s.price, 0);
      const dateFormatted = new Date(selectedDate).toLocaleDateString('pt-BR');
      
      let message = '';
      if (paymentMethod === 'Pix') {
        const pixInfo = settings.pixKey 
          ? `\n\nChave Pix: ${settings.pixKey}${settings.pixName ? `\nTitular: ${settings.pixName}` : ''}`
          : '';
        message = `Olá! Acabei de realizar um agendamento na ${settings.shopName}.\n\n📅 Data: ${dateFormatted}\n⏰ Horário: ${selectedTime}\n💰 Valor: R$ ${total.toFixed(2)}${pixInfo}\n\nEstou enviando o comprovante em anexo.`;
      } else {
        message = `Olá! Gostaria de confirmar meu agendamento na ${settings.shopName}.\n\n📅 Data: ${dateFormatted}\n⏰ Horário: ${selectedTime}\n💰 Valor: R$ ${total.toFixed(2)}\n💵 Forma de Pagamento: Dinheiro`;
      }

      // Open WhatsApp
      const cleanPhone = settings.shopPhone ? settings.shopPhone.replace(/\D/g, '') : '';
      if (cleanPhone) {
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        toast.info('Agendamento realizado! Não esqueça de enviar o comprovante.');
      }

      setIsSuccess(true);
    } catch (error) {
      toast.error('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 'SERVICES') {
      if (selectedServices.length === 0) {
        toast.error('Por favor, selecione pelo menos um serviço.');
        return;
      }
      setCurrentStep('CONFIRM_SERVICES');
    } else if (currentStep === 'CONFIRM_SERVICES') {
      setCurrentStep('DATETIME');
    } else if (currentStep === 'DATETIME') {
      if (!selectedTime) {
        toast.error('Por favor, selecione um horário.');
        return;
      }
      setCurrentStep('PAYMENT');
    } else if (currentStep === 'PAYMENT') {
      setCurrentStep('DETAILS');
    }
  };

  const prevStep = () => {
    if (currentStep === 'CONFIRM_SERVICES') setCurrentStep('SERVICES');
    else if (currentStep === 'DATETIME') setCurrentStep('CONFIRM_SERVICES');
    else if (currentStep === 'PAYMENT') setCurrentStep('DATETIME');
    else if (currentStep === 'DETAILS') setCurrentStep('PAYMENT');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white p-12 border border-[var(--border)] text-center space-y-10 shadow-sm"
        >
          <div className="w-24 h-24 bg-[var(--background)] rounded-full flex items-center justify-center mx-auto border border-[var(--accent)]/20">
            <CheckCircle2 className="w-12 h-12 text-[var(--accent)]" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Reserva Solicitada</h2>
            <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Aguardamos por você</p>
          </div>

          <div className="space-y-6 text-[var(--muted-foreground)]">
            <p className="leading-relaxed">
              Seu horário para <strong className="text-[var(--primary)]">{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}</strong> foi enviado com sucesso. 
              Aguarde a confirmação final da nossa equipe.
            </p>
            <div className="p-6 bg-[var(--background)] border border-[var(--accent)]/10 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-2">Atenção</p>
              <p className="text-sm font-medium leading-relaxed">Uma mensagem de confirmação foi aberta no seu WhatsApp. Por favor, envie-a para finalizar o processo.</p>
            </div>
          </div>

          {paymentMethod === 'Pix' && settings?.pixKey && (
            <div className="p-10 bg-white border-2 border-[var(--accent)]/20 space-y-8">
              <div className="flex items-center justify-center gap-3 text-[var(--accent)] uppercase tracking-[0.3em] text-[10px] font-bold">
                <Wallet className="w-4 h-4" />
                Pagamento via Pix
              </div>
              
              <div className="space-y-6">
                {settings.pixName && (
                  <div className="text-left space-y-1">
                    <p className="text-[9px] uppercase font-bold text-[var(--muted-foreground)] tracking-widest">Beneficiário</p>
                    <p className="font-serif text-2xl text-[var(--primary)]">{settings.pixName}</p>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="text-left overflow-hidden">
                    <p className="text-[9px] uppercase font-bold text-[var(--muted-foreground)] tracking-widest">Chave Pix</p>
                    <p className="font-mono text-xl font-black truncate tracking-tight text-[var(--primary)]">{settings.pixKey}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(settings.pixKey!);
                      toast.success('Chave Pix copiada!');
                    }}
                    className="w-12 h-12 bg-[var(--primary)] text-white hover:bg-[var(--accent)] transition-all flex items-center justify-center shadow-md active:scale-95"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-6">
                <p className="text-[9px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest">Após o pagamento, confirme via WhatsApp</p>
                <button 
                  onClick={() => {
                    const cleanPhone = settings.shopPhone ? settings.shopPhone.replace(/\D/g, '') : '';
                    if (cleanPhone) {
                      const total = settings.services.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.price, 0);
                      const msg = `Olá! Acabei de pagar o Pix de R$ ${total.toFixed(2)} referente ao meu agendamento. Segue o comprovante.`;
                      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                  }}
                  className="w-full h-16 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-5 h-5" />
                  Enviar Comprovante
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full h-16 border border-[var(--primary)] text-[var(--primary)] font-serif text-lg hover:bg-[var(--primary)] hover:text-white transition-all rounded-full"
          >
            Nova Reserva
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-24 selection:bg-[var(--accent)]/30">
      {/* Elegant Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 shadow-sm border border-blue-100">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-[9px] tracking-widest text-[var(--primary)] leading-none uppercase opacity-60">Powered by</span>
              <span className="font-bold tracking-[0.2em] text-blue-600 text-[10px] uppercase">NOKITE HUB</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const isIOSDevice = isIOS();
                if (isIOSDevice) {
                  toast.info('Para instalar no iPhone: Toque no botão de Compartilhar (ícone de quadrado com seta) e selecione "Adicionar à Tela de Início".', {
                    duration: 8000
                  });
                  return;
                }

                const promptEvent = (window as any).deferredPrompt;
                if (promptEvent) {
                  promptEvent.prompt();
                  promptEvent.userChoice.then((choiceResult: any) => {
                    if (choiceResult.outcome === 'accepted') {
                      (window as any).deferredPrompt = null;
                    }
                  });
                } else {
                  toast.info('O aplicativo já está instalado ou seu navegador não suporta esta função.');
                }
              }}
              className="font-sans font-bold text-xs uppercase tracking-wider text-green-600 hover:text-green-700 transition-colors border-b border-green-200 pb-0.5 hidden sm:block"
            >
              Baixar App
            </button>
            <button 
              onClick={() => setIsMyAppointmentsOpen(true)}
              className="font-sans font-bold text-xs uppercase tracking-wider text-[var(--primary)] hover:text-blue-700 transition-colors border-b border-blue-200 pb-0.5"
            >
              Meus agendamentos
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
        {/* Shop Info Section - Luxury Style */}
        <div className="relative flex flex-col md:flex-row md:items-end gap-8 border-b border-[var(--border)] pb-12">
          <div className="absolute -left-4 top-0 h-full w-[1px] bg-[var(--accent)]/20 hidden lg:block" />
          
          <div className="w-32 h-44 rounded-t-full rounded-b-xl border border-[var(--border)] p-1.5 flex-shrink-0 bg-white shadow-sm overflow-hidden">
            <div className="w-full h-full rounded-t-full rounded-b-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
              <img 
                src={settings?.shopLogo || '/logoo.png'} 
                alt="Shop Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = '/logoo.png')}
              />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-[var(--accent)]" />
              <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Bem-vindo à excelência</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight leading-[0.9] text-[var(--primary)]">
              {settings?.shopName || 'Carregando...'}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm uppercase tracking-[0.15em] font-medium">
              Agendamento Exclusivo & Gestão de Excelência
            </p>
          </div>

          <div className="hidden md:block writing-mode-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--accent)]/40">
            EST. {new Date().getFullYear()} • LUXURY SERVICE
          </div>
        </div>

        {/* Minimalist Progress Bar */}
        {currentStep !== 'SERVICES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              {['Serviços', 'Revisão', 'Horário', 'Pagamento', 'Dados'].map((label, idx) => {
                const steps = ['SERVICES', 'CONFIRM_SERVICES', 'DATETIME', 'PAYMENT', 'DETAILS'];
                const isActive = currentStep === steps[idx];
                const isPast = steps.indexOf(currentStep) > idx;
                return (
                  <div key={label} className="flex flex-col items-center gap-3">
                    <div className={`font-serif text-xl transition-all duration-500 ${
                      isActive ? 'text-[var(--accent)] scale-125' : 
                      isPast ? 'text-[var(--primary)] opacity-40' : 
                      'text-[var(--muted-foreground)] opacity-20'
                    }`}>
                      {idx + 1}.
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-[var(--accent)]' : 'text-transparent'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-[1px] bg-[var(--border)] relative">
              <motion.div 
                initial={false}
                animate={{ 
                  width: currentStep === 'CONFIRM_SERVICES' ? '25%' :
                         currentStep === 'DATETIME' ? '50%' : 
                         currentStep === 'PAYMENT' ? '75%' : '100%' 
                }}
                className="absolute top-0 left-0 h-[1px] bg-[var(--accent)]"
              />
            </div>
          </div>
        )}

        <div className="space-y-12">
          <AnimatePresence mode="wait">
            {currentStep === 'SERVICES' && (
              <motion.section
                key="services"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="flex items-end justify-between border-b border-[var(--border)] pb-4">
                  <h2 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Nossos Serviços</h2>
                  <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Selecione sua experiência</p>
                </div>
                
                <div className="grid grid-cols-1 gap-0">
                  {settings?.services?.map((service) => (
                    <div
                      key={service.id}
                      className="group py-10 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--border)] hover:bg-white/40 transition-colors px-4 -mx-4"
                    >
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-4">
                          <h4 className="font-sans font-black text-3xl text-[var(--primary)] tracking-tight group-hover:text-[var(--accent)] transition-colors">
                            {service.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-8 text-[var(--muted-foreground)]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="text-xs uppercase tracking-widest font-bold">{service.duration} MINUTOS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="text-xs uppercase tracking-widest font-bold">VALOR SOB CONSULTA</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] mb-1">Investimento</p>
                          <p className="font-sans font-black text-2xl text-[var(--primary)]">R$ {service.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServices([service.id]);
                            setCurrentStep('CONFIRM_SERVICES');
                          }}
                          className="px-8 py-4 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] transition-all font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95"
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {currentStep === 'CONFIRM_SERVICES' && (
              <motion.section
                key="confirm-services"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Revisão do Pedido</h3>
                  <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Confirme sua seleção exclusiva</p>
                </div>

                <div className="bg-white p-10 border border-[var(--border)] shadow-sm space-y-8">
                  <div className="space-y-6">
                    {settings?.services.filter(s => selectedServices.includes(s.id)).map(service => (
                      <div key={service.id} className="flex items-center justify-between pb-6 border-b border-[var(--border)] last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="font-sans font-black text-2xl text-[var(--primary)]">{service.name}</p>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted-foreground)]">{service.duration} MINUTOS DE ATENDIMENTO</p>
                        </div>
                        <p className="font-sans font-bold text-xl text-[var(--accent)]">R$ {service.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-8 border-t-2 border-[var(--primary)] flex items-end justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Total da Experiência</span>
                      <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Valor final para pagamento</p>
                    </div>
                    <span className="text-5xl font-sans font-black text-[var(--primary)]">
                      R$ {settings?.services.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.price, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.section>
            )}

            {currentStep === 'DATETIME' && (
              <motion.section
                key="datetime"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Data & Horário</h3>
                  <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Escolha o momento ideal</p>
                </div>

                <div className="bg-white p-10 border border-[var(--border)] shadow-sm space-y-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Calendário de Disponibilidade</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-6 bg-[var(--background)] border border-[var(--border)] font-sans font-bold text-2xl focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none transition-all"
                      />
                      <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--accent)] opacity-40" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Horários de Atendimento</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => {
                        const occupied = isTimeOccupied(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={occupied}
                            onClick={() => setSelectedTime(time)}
                            className={`p-5 font-sans font-bold text-lg transition-all border ${
                              selectedTime === time 
                                ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] shadow-lg scale-105' 
                                : occupied
                                  ? 'bg-[var(--muted)] text-[var(--muted-foreground)] opacity-30 cursor-not-allowed border-transparent'
                                  : 'bg-white border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {currentStep === 'PAYMENT' && (
              <motion.section
                key="payment"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Pagamento</h3>
                  <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Selecione sua preferência</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {(['Pix', 'Dinheiro'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex items-center justify-between p-10 bg-white border transition-all text-left ${
                        paymentMethod === method
                          ? 'border-[var(--accent)] shadow-md'
                          : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 flex items-center justify-center transition-all duration-500 ${
                          paymentMethod === method ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]'
                        }`}>
                          {method === 'Pix' ? <Wallet className="w-10 h-10" /> : <Banknote className="w-10 h-10" />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-sans font-black text-3xl text-[var(--primary)] uppercase tracking-tight">{method}</h4>
                          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)]">
                            {method === 'Pix' ? 'TRANSFERÊNCIA INSTANTÂNEA' : 'PAGAMENTO NO ESTABELECIMENTO'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
                        paymentMethod === method ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
                      }`}>
                        {paymentMethod === method && <Check className="w-5 h-5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {currentStep === 'DETAILS' && (
              <motion.section
                key="details"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-4xl font-sans font-black uppercase tracking-tight text-[var(--primary)]">Seus Dados</h3>
                  <p className="font-sans font-bold text-[var(--accent)] text-sm uppercase tracking-widest">Finalize sua reserva</p>
                </div>

                <div className="bg-white p-10 border border-[var(--border)] shadow-sm space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent)] opacity-40" />
                      <input 
                        type="text" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Alexandre de Moraes"
                        className="w-full p-6 pl-10 bg-transparent border-b border-[var(--border)] font-sans font-bold text-2xl focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent)] opacity-40" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full p-6 pl-10 bg-transparent border-b border-[var(--border)] font-sans font-bold text-2xl focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Observações (Opcional)</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Alguma preferência especial?"
                      className="w-full p-6 bg-[var(--background)] border border-[var(--border)] font-sans font-bold text-xl focus:border-[var(--accent)] outline-none transition-all min-h-[150px] placeholder:text-[var(--muted-foreground)]/30"
                    />
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Navigation Buttons - Luxury Style */}
          <div className="sticky bottom-8 left-0 right-0 px-2 z-40 flex gap-6">
            {currentStep !== 'SERVICES' && (
              <button
                type="button"
                onClick={prevStep}
                className="w-20 h-20 bg-white text-[var(--primary)] border border-[var(--border)] font-bold rounded-full shadow-lg hover:bg-[var(--muted)] transition-all flex items-center justify-center group"
              >
                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            
            {currentStep !== 'DETAILS' ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 h-20 bg-[var(--primary)] text-[var(--primary-foreground)] font-sans font-black text-xl uppercase tracking-[0.1em] rounded-full shadow-2xl hover:bg-[var(--accent)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
              >
                Continuar
                <ArrowRight className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBooking}
                disabled={isSubmitting || !clientName || !phone}
                className="flex-1 h-20 bg-[var(--primary)] text-[var(--primary-foreground)] font-sans font-black text-xl uppercase tracking-[0.1em] rounded-full shadow-2xl hover:bg-[var(--accent)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-4"
              >
                {isSubmitting ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirmar Reserva
                    <CheckCircle2 className="w-6 h-6" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Exclusive Footer */}
        <footer className="text-center py-20 border-t border-[var(--border)] space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2.5 shadow-md border border-blue-100">
              <img src="/logoo.png" alt="Nokite Hub Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="h-[1px] w-12 bg-blue-200" />
              <span className="font-sans font-black text-blue-600 text-xl uppercase tracking-tighter">Nokite Hub</span>
              <div className="h-[1px] w-12 bg-blue-200" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--muted-foreground)]">The Art of Management</p>
            <p className="text-[9px] text-[var(--muted-foreground)] opacity-50 uppercase tracking-[0.2em]">© {new Date().getFullYear()} • Todos os direitos reservados</p>
          </div>
        </footer>
      </div>

      {/* Meus Agendamentos Modal */}
      <AnimatePresence>
        {isMyAppointmentsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-black text-slate-900">Meus Agendamentos</h3>
                <button 
                  onClick={() => {
                    setIsMyAppointmentsOpen(false);
                    setSearchPhone('');
                    setMyAppointments([]);
                    setHasSearched(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                >
                  <span className="font-bold text-lg leading-none">&times;</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSearchAppointments} className="flex gap-2 mb-8">
                  <div className="flex-1 relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Seu WhatsApp (ex: 11999999999)"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchPhone}
                    className="h-12 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>

                {hasSearched && myAppointments.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Nenhum agendamento encontrado para este número.</p>
                  </div>
                )}

                {myAppointments.length > 0 && (
                  <div className="space-y-4">
                    {myAppointments.map((app) => {
                      const isPast = new Date(`${app.date}T${app.time}`) < new Date();
                      const isCanceled = app.status === 'Cancelado';
                      
                      return (
                        <div key={app.id} className={`p-4 rounded-2xl border ${isCanceled ? 'bg-red-50 border-red-100' : isPast ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-slate-900">{new Date(app.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {app.time}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {app.services.map(s => s.name).join(', ')}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                              isCanceled ? 'bg-red-100 text-red-600' : 
                              isPast ? 'bg-slate-200 text-slate-600' : 
                              'bg-green-100 text-green-700'
                            }`}>
                              {isCanceled ? 'Cancelado' : isPast ? 'Concluído' : 'Confirmado'}
                            </span>
                          </div>
                          
                          {!isPast && !isCanceled && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                              {cancelingId === app.id ? (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-slate-500">Tem certeza?</span>
                                  <button 
                                    onClick={() => setCancelingId(null)}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                                  >
                                    Não
                                  </button>
                                  <button 
                                    onClick={() => handleCancelAppointment(app.id, app.date, app.time)}
                                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    Sim, Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setCancelingId(app.id)}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Cancelar Agendamento
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
