import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  Calendar, 
  CircleDollarSign, 
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Bell,
  BellOff,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Filter,
  Users,
  Layers,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Appointment, Sale, Settings, Subscription, Professional, Product } from '../types';
import { 
  db, 
  logout, 
  handleFirestoreError, 
  OperationType,
  requestNotificationToken,
  saveNotificationToken,
  sendPushNotification
} from '../firebase';
import { updateDynamicManifest, isIOS } from '../lib/pwa';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  getDocs
} from 'firebase/firestore';
import { User } from 'firebase/auth';

// Pages
import HomePage from '../pages/HomePage';
import SmartSchedulePage from '../pages/SmartSchedulePage';
import CashRegisterPage from '../pages/CashRegisterPage';
import SettingsPage from '../pages/SettingsPage';
import ClientsPage from '../pages/ClientsPage';
import ProfessionalsPage from '../pages/ProfessionalsPage';
import InventoryPage from '../pages/InventoryPage';

const INITIAL_DATA: AppData = {
  appointments: [],
  sales: [],
  busySlots: [],
  professionals: [],
  inventory: [],
  clients: [],
  settings: {
    shopName: 'Nokite Hub',
    theme: 'light',
    services: [
      { id: '1', name: 'Corte de Cabelo', price: 40, duration: 30 },
      { id: '2', name: 'Barba', price: 25, duration: 20 },
      { id: '3', name: 'Sobrancelha', price: 15, duration: 10 },
      { id: '4', name: 'Combo (Corte + Barba)', price: 60, duration: 50 },
    ]
  }
};

interface AdminDashboardProps {
  user: User;
  companyId: string | null;
}

export default function AdminDashboard({ user, companyId }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const shopId = companyId || user.uid; // Fallback for backward compatibility during transition

  const [currentPage, setCurrentPage] = useState<'home' | 'schedule' | 'cash' | 'settings' | 'clients' | 'professionals' | 'inventory'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS()) {
      toast.info('Para instalar no iPhone: Toque no botão de Compartilhar (ícone de quadrado com seta) e selecione "Adicionar à Tela de Início".', {
        duration: 8000
      });
      return;
    }

    if (!deferredPrompt) {
      toast.info('O aplicativo já está instalado ou seu navegador não suporta esta função.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      toast.success('Aplicativo instalado com sucesso!');
    }
  };

  useEffect(() => {
    if (!companyId && user.email !== 'pa001736@gmail.com') {
      // User has no company assigned
      toast.error('Conta não autorizada. Entre em contato com o administrador.');
      logout();
    }
  }, [companyId, user]);

  if (!companyId && user.email !== 'pa001736@gmail.com') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
        <p className="text-slate-600 mb-6">Sua conta ainda não foi vinculada a uma barbearia.</p>
        <button onClick={() => logout()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">
          Sair
        </button>
      </div>
    );
  }

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => console.log('Audio play blocked by browser'));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notificações ativadas!');
        
        // Register FCM Token
        const token = await requestNotificationToken();
        if (token && shopId) {
          await saveNotificationToken(shopId, user.uid, token);
          console.log("FCM Token registered");
        }
      } else {
        setNotificationsEnabled(false);
        toast.error('Permissão de notificação negada.');
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error('Erro ao ativar notificações.');
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync Settings
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'shops', shopId), 
      (docSnap) => {
        if (docSnap.exists()) {
          const settings = docSnap.data() as Settings;
          setData(prev => ({ ...prev, settings }));

          // Update PWA Manifest
          updateDynamicManifest(settings.shopName, settings.shopLogo);

          // Automated Suspension Check - RELY ON UI ONLY, DO NOT TRY TO WRITE TO DB (forbidden for users)
          // The suspension overlay logic already checks data.settings.subscription
        } else {
          // MVP Manual Flow: Auto-create as pending. No public registration.
          setDoc(doc(db, 'shops', shopId), {
            company_id: shopId,
            shopName: user.displayName || user.email?.split('@')[0] || 'Nova Barbearia',
            theme: 'light',
            services: [
              { id: '1', name: 'Corte de Cabelo', price: 40, duration: 30 }
            ],
            createdAt: new Date().toISOString(),
            subscription: {
              plan: 'Trial Básico',
              status: 'pending',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }).catch(error => handleFirestoreError(error, OperationType.WRITE, `shops/${shopId}`));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `shops/${shopId}`)
    );
    return () => unsubSettings();
  }, [shopId]);

  // Sync Appointments & Sales
  useEffect(() => {
    const getFilterConstraints = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        return {
          appointment: [where('date', '==', todayStr)],
          sale: [where('timestamp', '>=', `${todayStr}T00:00:00.000Z`)]
        };
      }
      
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        return {
          appointment: [where('date', '>=', weekAgoStr)],
          sale: [where('timestamp', '>=', weekAgo.toISOString())]
        };
      }
      
      if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        return {
          appointment: [where('date', '>=', monthAgoStr)],
          sale: [where('timestamp', '>=', monthAgo.toISOString())]
        };
      }
      
      return {
        appointment: [limit(500)],
        sale: [limit(500)]
      };
    };

    const constraints = getFilterConstraints();

    const unsubAppointments = onSnapshot(
      query(
        collection(db, 'shops', shopId, 'appointments'), 
        where('company_id', '==', shopId),
        ...constraints.appointment,
        orderBy('date', 'desc'), 
        orderBy('time', 'asc')
      ), 
      (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setData(prev => ({ ...prev, appointments }));

        if (!isInitialLoad.current) {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const newApp = change.doc.data() as Appointment;
              const message = `Novo agendamento: ${newApp.clientName} às ${newApp.time} (${newApp.date})`;
              toast.success(message, {
                duration: 10000,
                action: { label: 'Ver Agenda', onClick: () => setCurrentPage('schedule') }
              });
              playNotificationSound();
              
              if (Notification.permission === 'granted') {
                new Notification('Nokite Hub', { body: message, icon: '/logoo.png' });
              }
            }
          });
        }
        isInitialLoad.current = false;
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/appointments`)
    );

    const unsubSales = onSnapshot(
      query(
        collection(db, 'shops', shopId, 'sales'), 
        where('company_id', '==', shopId),
        ...constraints.sale,
        orderBy('timestamp', 'desc')
      ), 
      (snapshot) => {
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setData(prev => ({ ...prev, sales }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/sales`)
    );

    const unsubBusySlots = onSnapshot(
      query(
        collection(db, 'shops', shopId, 'busy_slots'),
        where('company_id', '==', shopId)
      ),
      (snapshot) => {
        const busySlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setData(prev => ({ ...prev, busySlots }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/busy_slots`)
    );

    const unsubProfessionals = onSnapshot(
      query(
        collection(db, 'shops', shopId, 'professionals'),
        where('company_id', '==', shopId)
      ),
      (snapshot) => {
        const professionals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setData(prev => ({ ...prev, professionals }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/professionals`)
    );

    const unsubInventory = onSnapshot(
      query(
        collection(db, 'shops', shopId, 'inventory'),
        where('company_id', '==', shopId)
      ),
      (snapshot) => {
        const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setData(prev => ({ ...prev, inventory }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `shops/${shopId}/inventory`)
    );

    return () => {
      unsubAppointments();
      unsubSales();
      unsubBusySlots();
      unsubProfessionals();
      unsubInventory();
    };
  }, [shopId, dateFilter]);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [data.settings.theme]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...data.settings, ...newSettings, company_id: shopId };
    setData(prev => ({ ...prev, settings: updated }));
    try {
      await setDoc(doc(db, 'shops', shopId), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}`);
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    try {
      const { id, ...rest } = appointment;
      const { writeBatch, doc, collection } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const appointmentRef = doc(collection(db, 'shops', shopId, 'appointments'));
      const appointmentId = appointmentRef.id;

      batch.set(appointmentRef, { 
        ...rest, 
        company_id: shopId,
        createdAt: new Date().toISOString() 
      });

      const slotId = `${appointment.date}_${appointment.time}_${appointment.professionalId}`;
      const slotRef = doc(db, 'shops', shopId, 'busy_slots', slotId);
      batch.set(slotRef, {
        date: appointment.date,
        time: appointment.time,
        professionalId: appointment.professionalId,
        appointmentId: appointmentId,
        company_id: shopId
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shops/${shopId}/appointments`);
    }
  };

  const removeAppointment = async (id: string) => {
    try {
      const appointment = data.appointments.find(a => a.id === id);
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.delete(doc(db, 'shops', shopId, 'appointments', id));
      
      if (appointment) {
        const slotId = `${appointment.date}_${appointment.time}_${appointment.professionalId}`;
        batch.delete(doc(db, 'shops', shopId, 'busy_slots', slotId));
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shops/${shopId}/appointments/${id}`);
    }
  };

  const addSale = async (sale: Sale) => {
    try {
      const { id, ...rest } = sale;
      await addDoc(collection(db, 'shops', shopId, 'sales'), {
        ...rest,
        company_id: shopId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `shops/${shopId}/sales`);
    }
  };

  const addProfessional = async (professional: Professional) => {
    try {
      const { id, ...rest } = professional;
      await addDoc(collection(db, 'shops', shopId, 'professionals'), {
        ...rest,
        company_id: shopId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `shops/${shopId}/professionals`);
    }
  };

  const removeProfessional = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shops', shopId, 'professionals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shops/${shopId}/professionals/${id}`);
    }
  };

  const updateProfessional = async (id: string, updates: Partial<Professional>) => {
    try {
      await updateDoc(doc(db, 'shops', shopId, 'professionals', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}/professionals/${id}`);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      const { id, ...rest } = product;
      await addDoc(collection(db, 'shops', shopId, 'inventory'), {
        ...rest,
        company_id: shopId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `shops/${shopId}/inventory`);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shops', shopId, 'inventory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shops/${shopId}/inventory/${id}`);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'shops', shopId, 'inventory', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}/inventory/${id}`);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status'], paymentMethod?: Sale['method']) => {
    try {
      const appointment = data.appointments.find(a => a.id === id);
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      batch.update(doc(db, 'shops', shopId, 'appointments', id), { status });

      if (status === 'Cancelado' && appointment) {
        const slotId = `${appointment.date}_${appointment.time}_${appointment.professionalId}`;
        batch.delete(doc(db, 'shops', shopId, 'busy_slots', slotId));
      } else if (status !== 'Cancelado' && appointment && appointment.status === 'Cancelado') {
        // Re-occupy slot if un-cancelling
        const slotId = `${appointment.date}_${appointment.time}_${appointment.professionalId}`;
        batch.set(doc(db, 'shops', shopId, 'busy_slots', slotId), {
          date: appointment.date,
          time: appointment.time,
          professionalId: appointment.professionalId,
          appointmentId: id,
          company_id: shopId
        });
      }

      if (status === 'Concluído' && paymentMethod && appointment) {
        const totalAmount = appointment.services.reduce((acc, s) => acc + s.price, 0);
        const saleRef = doc(collection(db, 'shops', shopId, 'sales'));
        batch.set(saleRef, {
          amount: totalAmount,
          method: paymentMethod,
          timestamp: new Date().toISOString(),
          appointmentId: id,
          company_id: shopId
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}/appointments/${id}`);
    }
  };

  const isSuperAdmin = user.email === 'pa001736@gmail.com';
  const isExpired = data.settings.subscription?.expiresAt && new Date(data.settings.subscription.expiresAt) < new Date();
  const isSuspended = (data.settings.subscription?.status === 'suspended' || isExpired) && !isSuperAdmin;
  const isPending = data.settings.subscription?.status === 'pending' && !isSuperAdmin;
  const isVerified = user.emailVerified || isSuperAdmin;
  const isBasic = data.settings.subscription?.plan === 'Básico' || data.settings.subscription?.plan === 'Trial Básico';

  const handleResendVerification = async () => {
    const { sendEmailVerification } = await import('firebase/auth');
    try {
      await sendEmailVerification(user);
      toast.success('E-mail de verificação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar e-mail: ' + (err.message || 'Tente novamente mais tarde.'));
    }
  };

  console.log("Current Plan:", data.settings.subscription?.plan);
  console.log("Is Basic Plan?", isBasic);

  const navItems = [
    { id: 'home', label: 'Painel', icon: LayoutDashboard },
    { id: 'schedule', label: 'Agenda Inteligente', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'professionals', label: 'Equipe', icon: ShieldCheck, hide: isBasic },
    { id: 'inventory', label: 'Estoque', icon: Layers, hide: isBasic },
    { id: 'cash', label: 'Fluxo de Caixa', icon: CircleDollarSign, hide: isBasic },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ].filter(i => !i.hide);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 bottom-0 w-72 bg-[var(--sidebar-bg)] border-r border-[var(--border)] z-50 
        transition-transform duration-300 md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-slate-100">
                <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Nokite Hub</h1>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                  ${currentPage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}

            {isSuperAdmin && (
              <div className="pt-6">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest px-4 mb-2">Administração</p>
                <button
                  onClick={() => navigate('/super-admin')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-purple-600 hover:bg-purple-50 transition-all border border-transparent hover:border-purple-100"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Painel Master
                </button>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      <main className="md:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 hover:bg-[var(--muted)] rounded-xl md:hidden transition-colors border border-[var(--border)]">
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold tracking-tight">
                {navItems.find(i => i.id === currentPage)?.label || 'Painel'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-1 bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)]">
                {(['today', 'week', 'month', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={`
                      px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all
                      ${dateFilter === f 
                        ? 'bg-white text-[var(--foreground)] shadow-sm' 
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                    `}
                  >
                    {f === 'today' ? 'Hoje' : f === 'week' ? '7 Dias' : f === 'month' ? '30 Dias' : 'Tudo'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={requestNotificationPermission}
                  className={`p-2.5 rounded-xl transition-all border ${
                    notificationsEnabled 
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] border-transparent'
                  }`}
                >
                  {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>
                
                <a 
                  href={`/b/${data.settings.slug || shopId}`} 
                  target="_blank"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/15 active:scale-95"
                >
                  Ver Site
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentPage === 'home' && (
                <HomePage 
                  shopName={data.settings.shopName} 
                  shopLogo={data.settings.shopLogo} 
                  onNavigate={setCurrentPage} 
                  subscription={data.settings.subscription}
                  appointments={data.appointments}
                />
              )}
              {currentPage === 'schedule' && (
                <SmartSchedulePage 
                  appointments={data.appointments} 
                  services={data.settings.services}
                  settings={data.settings}
                  professionals={data.professionals}
                  onAdd={addAppointment}
                  onUpdateStatus={updateAppointmentStatus}
                  onRemove={removeAppointment}
                />
              )}
              {currentPage === 'clients' && <ClientsPage appointments={data.appointments} />}
              {currentPage === 'professionals' && (
                <ProfessionalsPage 
                  professionals={data.professionals}
                  onAdd={addProfessional}
                  onRemove={removeProfessional}
                  onUpdate={updateProfessional}
                />
              )}
              {currentPage === 'inventory' && (
                <InventoryPage 
                  inventory={data.inventory}
                  onAdd={addProduct}
                  onRemove={removeProduct}
                  onUpdate={updateProduct}
                />
              )}
              {currentPage === 'cash' && <CashRegisterPage sales={data.sales} onAddSale={addSale} />}
              {currentPage === 'settings' && <SettingsPage settings={data.settings} shopId={shopId} onUpdate={updateSettings} isSuperAdmin={isSuperAdmin} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
