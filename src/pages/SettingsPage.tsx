import React from 'react';
import { Settings as SettingsIcon, Store, Sun, Moon, Palette, ShieldCheck, ChevronRight, Scissors, Plus, Trash2, Clock, DollarSign, ExternalLink, Wallet, Save, Check, Phone, Upload, Image, CreditCard, Zap, AlertCircle, Edit2 } from 'lucide-react';
import { Settings, Service, SubscriptionPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../firebase';

interface SettingsPageProps {
  settings: Settings;
  shopId: string;
  onUpdate: (settings: Partial<Settings>) => void;
  isSuperAdmin?: boolean;
}

export default function SettingsPage({ settings, shopId, onUpdate, isSuperAdmin }: SettingsPageProps) {
  const [newService, setNewService] = React.useState({ name: '', price: '', duration: '' });
  const [isAddingService, setIsAddingService] = React.useState(false);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = React.useState<string | null>(null);
  
  // Local state for profile settings to allow "Confirm" button
  const [localShopName, setLocalShopName] = React.useState(settings.shopName);
  const [localShopLogo, setLocalShopLogo] = React.useState(settings.shopLogo || '');
  const [localPixKey, setLocalPixKey] = React.useState(settings.pixKey || '');
  const [localSlug, setLocalSlug] = React.useState(settings.slug || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // 800KB limit for base64 in Firestore
        toast.error('A imagem é muito grande. Use uma imagem de até 800KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [localPixName, setLocalPixName] = React.useState(settings.pixName || '');
  const [localShopPhone, setLocalShopPhone] = React.useState(settings.shopPhone || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false);

  // Update local state when settings prop changes (e.g. on initial load)
  React.useEffect(() => {
    setLocalShopName(settings.shopName);
    setLocalShopLogo(settings.shopLogo || '');
    setLocalPixKey(settings.pixKey || '');
    setLocalPixName(settings.pixName || '');
    setLocalShopPhone(settings.shopPhone || '');
    setLocalSlug(settings.slug || '');
  }, [settings.shopName, settings.shopLogo, settings.pixKey, settings.pixName, settings.shopPhone, settings.slug]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Validate slug if changed
      if (localSlug !== settings.slug) {
        const cleanSlug = localSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (cleanSlug.length < 3) {
          toast.error('O link deve ter pelo menos 3 caracteres.');
          setIsSaving(false);
          return;
        }
        
        // Check if slug is already taken
        const { getShopIdBySlug } = await import('../firebase');
        const existingShopId = await getShopIdBySlug(cleanSlug);
        if (existingShopId && existingShopId !== shopId) {
          toast.error('Este link já está sendo usado por outra barbearia.');
          setIsSaving(false);
          return;
        }

        // Update slug mapping
        const { db } = await import('../firebase');
        const { doc, setDoc, deleteDoc } = await import('firebase/firestore');
        
        if (settings.slug) {
          await deleteDoc(doc(db, 'slugs', settings.slug));
        }
        await setDoc(doc(db, 'slugs', cleanSlug), { shopId });
        setLocalSlug(cleanSlug);
        
        await onUpdate({
          shopName: localShopName,
          shopLogo: localShopLogo,
          pixKey: localPixKey,
          pixName: localPixName,
          shopPhone: localShopPhone,
          slug: cleanSlug
        });
      } else {
        await onUpdate({
          shopName: localShopName,
          shopLogo: localShopLogo,
          pixKey: localPixKey,
          pixName: localPixName,
          shopPhone: localShopPhone
        });
      }

      toast.success('Configurações salvas com sucesso!', {
        icon: <Check className="w-4 h-4 text-blue-500" />
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shops/${shopId}`);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price || !newService.duration) return;

    const service: Service = {
      id: editingServiceId || crypto.randomUUID(),
      name: newService.name,
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration)
    };

    if (editingServiceId) {
      onUpdate({
        services: settings.services.map(s => s.id === editingServiceId ? service : s)
      });
    } else {
      onUpdate({
        services: [...(settings.services || []), service]
      });
    }

    setNewService({ name: '', price: '', duration: '' });
    setIsAddingService(false);
    setEditingServiceId(null);
  };

  const editService = (service: Service) => {
    setNewService({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString()
    });
    setEditingServiceId(service.id);
    setIsAddingService(true);
  };

  const removeService = (id: string) => {
    onUpdate({
      services: settings.services.filter(s => s.id !== id)
    });
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setIsUpdatingPlan(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      let maxProfessionals = 1;
      if (plan === 'Pro' || plan === 'Trial Pro') maxProfessionals = 999;

      await onUpdate({
        subscription: {
          plan,
          status: 'active',
          expiresAt: expiresAt.toISOString(),
          maxProfessionals
        }
      });
      toast.success(`Plano ${plan} ativado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao atualizar plano.');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const bookingUrl = `${window.location.origin}/b/${settings.slug || shopId}`;
  const subscription = settings.subscription;
  const isTrial = subscription?.plan?.includes('Trial');
  const isSuspended = subscription?.status === 'suspended';

  return (
    <div className="space-y-8 pb-20">
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            <p className="text-[var(--muted-foreground)]">Personalize sua experiência no Nokite Hub.</p>
          </div>
          {isSuperAdmin && (
            <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Modo Master Ativo</span>
            </div>
          )}
        </div>
      </header>

      {isSuperAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600 uppercase tracking-widest text-xs font-bold px-2">
            <Zap className="w-4 h-4" />
            Demonstração Master (Troca de Planos)
          </div>
          <div className="p-8 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-3xl">
            <div className="flex flex-wrap gap-4">
              {(['Básico', 'Pro', 'Trial Básico', 'Trial Pro'] as SubscriptionPlan[]).map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleUpgrade(plan)}
                  disabled={isUpdatingPlan}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    settings.subscription?.plan === plan
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-[var(--card)] text-purple-600 border border-purple-200 dark:border-purple-800 hover:bg-purple-50'
                  }`}
                >
                  Simular Plano {plan}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-purple-600/70 font-medium">
              * Use estes botões para alternar instantaneamente entre os planos e testar as funcionalidades disponíveis em cada um.
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subscription Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold px-2">
            <CreditCard className="w-4 h-4" />
            Assinatura e Planos
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Current Status Card */}
            <div className={`p-8 rounded-[32px] border flex flex-col justify-between ${
              isSuspended 
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' 
                : 'bg-white border-[var(--border)] dark:bg-[var(--card)]'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Status Atual</span>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    isSuspended ? 'bg-red-600 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {isSuspended ? 'Suspenso' : subscription?.status === 'trialing' || subscription?.plan?.includes('Trial') ? 'Teste Grátis' : 'Ativo'}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black">{subscription?.plan || 'Nenhum'}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] font-medium">
                    Expira em: {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
              
              {isSuspended && (
                <div className="mt-6 flex items-center gap-2 text-red-600 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Pagamento pendente
                </div>
              )}
            </div>

            {/* Basic Plan Card */}
            <div className={`p-8 rounded-[32px] border transition-all ${
              (subscription?.plan === 'Básico' || subscription?.plan === 'Trial Básico')
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 ring-2 ring-blue-500' 
                : 'bg-white border-[var(--border)] dark:bg-[var(--card)] hover:border-blue-300'
            }`}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">Básico</h3>
                  <span className="text-sm font-bold text-blue-600">R$ 29,90/mês</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                    <Check className="w-4 h-4 text-green-500" />
                    Até 1 Profissional
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                    <Check className="w-4 h-4 text-green-500" />
                    Agendamentos Ilimitados
                  </li>
                </ul>
                <button 
                  onClick={() => handleUpgrade('Básico')}
                  disabled={subscription?.plan === 'Básico' || subscription?.plan === 'Trial Básico' || isUpdatingPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    (subscription?.plan === 'Básico' || subscription?.plan === 'Trial Básico')
                      ? 'bg-blue-100 text-blue-600 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {(subscription?.plan === 'Básico' || subscription?.plan === 'Trial Básico') ? 'Plano Atual' : 'Assinar Básico'}
                </button>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className={`p-8 rounded-[32px] border transition-all relative overflow-hidden ${
              (subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro')
                ? 'bg-slate-900 border-slate-800 ring-2 ring-blue-500' 
                : 'bg-white border-[var(--border)] dark:bg-[var(--card)] hover:border-blue-300'
            }`}>
              {(subscription?.plan !== 'Pro' && subscription?.plan !== 'Trial Pro') && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-widest">
                  Em Breve
                </div>
              )}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-black ${(subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro') ? 'text-white' : ''}`}>Plano Pro</h3>
                  <span className="text-sm font-bold text-blue-500">R$ 89,90/mês</span>
                </div>
                <ul className="space-y-3">
                  <li className={`flex items-center gap-2 text-xs font-medium ${(subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro') ? 'text-slate-400' : 'text-[var(--muted-foreground)]'}`}>
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Profissionais Ilimitados
                  </li>
                  <li className={`flex items-center gap-2 text-xs font-medium ${(subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro') ? 'text-slate-400' : 'text-[var(--muted-foreground)]'}`}>
                    <Check className="w-4 h-4 text-green-500" />
                    Suporte Prioritário
                  </li>
                </ul>
                <button 
                  onClick={() => handleUpgrade('Pro')}
                  disabled={subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro' || isUpdatingPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    (subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro')
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/20'
                  }`}
                >
                  {(subscription?.plan === 'Pro' || subscription?.plan === 'Trial Pro') ? 'Plano Atual' : 'Assinar Pro'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Public Booking Link Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold px-2">
            <ExternalLink className="w-4 h-4" />
            Link de Agendamento Público
          </div>
          <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100">Seu link está pronto!</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 max-w-xl">
                  Compartilhe este link no seu Instagram, WhatsApp ou Facebook para que seus clientes possam agendar horários sozinhos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl font-mono text-sm flex items-center gap-2 overflow-hidden max-w-xs truncate">
                  {bookingUrl}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bookingUrl);
                    toast.success('Link copiado para a área de transferência!');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Copiar Link
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Profile & Payment Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold px-2">
            <Store className="w-4 h-4" />
            Perfil e Pagamento
          </div>
          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Nome da Barbearia / Salão</h4>
                <input
                  type="text"
                  value={localShopName}
                  onChange={(e) => setLocalShopName(e.target.value)}
                  className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Link Personalizado (Slug)</h4>
                <div className="flex items-center gap-2 p-4 bg-[var(--muted)] rounded-xl">
                  <span className="text-sm text-[var(--muted-foreground)] font-mono">/b/</span>
                  <input
                    type="text"
                    value={localSlug}
                    onChange={(e) => setLocalSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="minha-barbearia"
                    className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-widest px-1">Ex: flokite.com/b/{localSlug || 'sua-loja'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Logo da Barbearia</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img 
                        src={localShopLogo || '/logoo.png'} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.src = '/logoo.png')}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 bg-[var(--muted)] hover:bg-[var(--border)] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-[var(--border)]"
                      >
                        <Upload className="w-4 h-4" />
                        Escolher da Galeria
                      </button>
                      <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-widest">Ou cole o link abaixo</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={localShopLogo}
                    onChange={(e) => setLocalShopLogo(e.target.value)}
                    placeholder="https://exemplo.com/logoo.png"
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-blue-500" />
                  WhatsApp da Barbearia
                </label>
                <input
                  type="text"
                  value={localShopPhone}
                  onChange={(e) => setLocalShopPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={localPixKey}
                  onChange={(e) => setLocalPixKey(e.target.value)}
                  placeholder="E-mail, CPF, CNPJ ou Celular"
                  className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-wider">
                  <Check className="w-4 h-4 text-blue-500" />
                  Nome Completo (Pix)
                </label>
                <input
                  type="text"
                  value={localPixName}
                  onChange={(e) => setLocalPixName(e.target.value)}
                  placeholder="Nome do Titular da Conta"
                  className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Seus clientes verão estas informações para realizar o pagamento e entrar em contato.</p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar Alterações
                  </>
                )}
              </button>
              
              <AnimatePresence>
                {isSaving && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-xs font-bold text-blue-500 flex items-center gap-1"
                  >
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                    Sincronizando...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold px-2">
            <Palette className="w-4 h-4" />
            Aparência e Tema
          </div>
          <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Modo Escuro</h4>
                <p className="text-sm text-[var(--muted-foreground)]">Alternar entre tema claro e escuro.</p>
              </div>
              <button
                onClick={() => onUpdate({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 flex items-center px-1 ${
                  settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <motion.div
                  animate={{ x: settings.theme === 'dark' ? 32 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                >
                  {settings.theme === 'dark' ? <Moon className="w-3 h-3 text-blue-600" /> : <Sun className="w-3 h-3 text-blue-500" />}
                </motion.div>
              </button>
            </div>
          </div>
        </section>

        {/* Services Management Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold">
              <Scissors className="w-4 h-4" />
              Serviços e Preços
            </div>
            <button 
              onClick={() => {
                setNewService({ name: '', price: '', duration: '' });
                setEditingServiceId(null);
                setIsAddingService(true);
              }}
              className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" />
              Novo Serviço
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {(settings.services || []).map((service) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={service.id}
                  className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-3xl flex flex-col justify-between group hover:border-[var(--primary)] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{service.name}</h4>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => editService(service)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setServiceToDelete(service.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {service.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Info Section */}
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-bold px-2">
            <ShieldCheck className="w-4 h-4" />
            Sistema e Segurança
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Versão do Sistema', value: 'v1.1.0 (Nuvem)', info: 'Sistema atualizado' },
              { label: 'Armazenamento', value: 'Firebase Cloud', info: 'Dados sincronizados em tempo real' },
              { label: 'Status da Conta', value: 'Ativa', info: 'Acesso total liberado' }
            ].map((item) => (
              <div key={item.label} className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-3xl">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="font-bold text-lg mb-1">{item.value}</p>
                <div className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  {item.info}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Future Features */}
        <section className="md:col-span-2 p-8 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Próximas Atualizações</h3>
              <p className="text-slate-400 max-w-xl">
                Estamos trabalhando em integração com WhatsApp, relatórios avançados de performance e backup em nuvem.
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
              Ver Novidades
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-0 right-0 -mb-12 -mr-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        </section>
      </div>

      {/* Add Service Modal */}
      <AnimatePresence>
        {isAddingService && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingService(false);
                setEditingServiceId(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleSaveService}
              className="relative w-full max-w-md bg-[var(--card)] p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Scissors className="w-6 h-6 text-[var(--primary)]" />
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Nome do Serviço</label>
                  <input
                    autoFocus
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="Ex: Corte Degradê"
                    className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      placeholder="0,00"
                      className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Duração (min)</label>
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                      placeholder="30"
                      className="w-full p-4 bg-[var(--muted)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingService(false);
                    setEditingServiceId(null);
                  }}
                  className="flex-1 p-4 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 p-4 bg-[var(--primary)] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Salvar
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {serviceToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setServiceToDelete(null)}
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
              <p className="text-[var(--muted-foreground)]">Esta ação não pode ser desfeita. O serviço será excluído permanentemente.</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setServiceToDelete(null)}
                  className="flex-1 p-3 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    removeService(serviceToDelete);
                    setServiceToDelete(null);
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
