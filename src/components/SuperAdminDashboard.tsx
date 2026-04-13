import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Store, 
  TrendingUp, 
  Search, 
  ExternalLink, 
  LogOut,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  Plus,
  X,
  Info,
  Key,
  Edit2,
  Save,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, logout, handleFirestoreError, OperationType, createClientAccount } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc, where, limit, getDocs, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Subscription } from '../types';
import { toast, Toaster } from 'sonner';

interface Shop {
  id: string;
  shopName: string;
  slug: string;
  phone?: string;
  email?: string;
  createdAt?: any;
  subscription?: Subscription;
}

interface SuperAdminDashboardProps {
  user: User;
}

export default function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [shopToDelete, setShopToDelete] = useState<{id: string, shopName: string, slug: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Partner Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newShopData, setNewShopData] = useState({
    shopName: '',
    email: '',
    password: '',
    slug: ''
  });

  // Client Details Modal State
  const [selectedShopDetails, setSelectedShopDetails] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shopName: '',
    slug: '',
    phone: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'shops'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const shopList: Shop[] = [];
      snap.forEach((doc) => {
        shopList.push({ id: doc.id, ...doc.data() } as Shop);
      });
      setShops(shopList);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shops');
    });
    return () => unsub();
  }, []);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    const cleanEmail = newShopData.email.trim().toLowerCase();
    const cleanShopName = newShopData.shopName.trim();
    const cleanSlug = newShopData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      // 1. Check if slug is available
      const slugDoc = await getDoc(doc(db, 'slugs', cleanSlug));
      if (slugDoc.exists()) {
        toast.error('Este link (slug) já está em uso.');
        setIsCreating(false);
        return;
      }

      // 2. Create user in Firebase Auth
      const userCredential = await createClientAccount(cleanEmail, newShopData.password, cleanShopName);
      const newUserId = userCredential.user.uid;

      // 3. Create shop document (Company)
      const newShopRef = doc(collection(db, 'shops'));
      const newShopId = newShopRef.id;

      await setDoc(newShopRef, {
        shopName: cleanShopName,
        slug: cleanSlug,
        email: cleanEmail, // Save contact email in shop
        theme: 'light',
        services: [],
        createdAt: new Date().toISOString(),
        subscription: {
          plan: 'Trial Básico',
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days trial
        }
      });

      // 4. Create user mapping
      await setDoc(doc(db, 'users', newUserId), {
        email: cleanEmail,
        company_id: newShopId,
        role: 'admin'
      });

      // 5. Create slug mapping
      await setDoc(doc(db, 'slugs', cleanSlug), {
        shopId: newShopId
      });

      toast.success('Parceiro criado com sucesso!');
      setIsCreateModalOpen(false);
      setNewShopData({ shopName: '', email: '', password: '', slug: '' });
    } catch (error: any) {
      console.error("Erro ao criar parceiro:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('A senha deve ter pelo menos 6 caracteres.');
      } else if (error.code === 'permission-denied') {
        toast.error('Erro de permissão no banco de dados. Verifique as regras.');
      } else {
        toast.error(`Erro: ${error.message || 'Verifique os dados e tente novamente.'}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSubscriptionStatus = async (shopId: string, currentStatus: string | undefined) => {
    setIsUpdating(shopId);
    try {
      let newStatus = 'active';
      if (currentStatus === 'suspended') newStatus = 'active';
      else if (currentStatus === 'active' || currentStatus === 'trialing') newStatus = 'suspended';
      else if (currentStatus === 'pending') newStatus = 'trialing';

      await updateDoc(doc(db, 'shops', shopId), {
        'subscription.status': newStatus
      });
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}`);
      toast.error('Erro ao atualizar status.');
    } finally {
      setIsUpdating(null);
    }
  };

  const fetchClientDetails = async (shop: Shop) => {
    setIsLoadingDetails(true);
    setIsDetailsModalOpen(true);
    setIsEditingDetails(false);
    setEditFormData({
      shopName: shop.shopName || '',
      slug: shop.slug || '',
      phone: shop.phone || ''
    });
    try {
      // Find the admin user for this shop
      const usersQuery = query(collection(db, 'users'), where('company_id', '==', shop.id), limit(1));
      const userDocs = await getDocs(usersQuery);
      
      if (!userDocs.empty) {
        const userDoc = userDocs.docs[0];
        setSelectedShopDetails({
          ...shop,
          userData: userDoc.data(),
          userId: userDoc.id,
          email: userDoc.data().email || shop.email // Fallback to shop email
        });
      } else {
        setSelectedShopDetails({
          ...shop,
          userData: null,
          email: shop.email
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error('Erro ao carregar detalhes do cliente.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!editFormData.shopName || !editFormData.slug) {
      toast.error('Preencha os campos obrigatórios (Nome e Link).');
      return;
    }

    setIsSavingDetails(true);
    try {
      const shopRef = doc(db, 'shops', selectedShopDetails.id);
      const updates: any = {};

      // 1. Check Slug Change
      if (editFormData.slug !== selectedShopDetails.slug) {
        const newSlug = editFormData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const slugRef = doc(db, 'slugs', newSlug);
        const slugDoc = await getDoc(slugRef);
        
        if (slugDoc.exists()) {
          toast.error("Este link (slug) já está em uso.");
          setIsSavingDetails(false);
          return;
        }
        
        // Delete old slug and create new one
        await deleteDoc(doc(db, 'slugs', selectedShopDetails.slug));
        await setDoc(slugRef, { shopId: selectedShopDetails.id });
        updates.slug = newSlug;
      }

      // 2. Other fields
      if (editFormData.shopName !== selectedShopDetails.shopName) updates.shopName = editFormData.shopName;
      if (editFormData.phone !== selectedShopDetails.phone) updates.phone = editFormData.phone;

      // 3. Apply updates to shops collection
      if (Object.keys(updates).length > 0) {
        await updateDoc(shopRef, updates);
      }

      // Update user email if it was changed (note: we removed email editing from the UI for security, but keeping this safe)
      if (updates.email && selectedShopDetails.userId) {
         await updateDoc(doc(db, 'users', selectedShopDetails.userId), { email: updates.email });
      }

      toast.success("Detalhes atualizados com sucesso!");
      setSelectedShopDetails({
        ...selectedShopDetails,
        ...updates,
        slug: updates.slug || selectedShopDetails.slug
      });
      setIsEditingDetails(false);
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error("Erro ao salvar os detalhes.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!selectedShopDetails?.email) return;
    
    setIsSendingReset(true);
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      
      await sendPasswordResetEmail(auth, selectedShopDetails.email);
      toast.success('Link enviado! Oriente o cliente a verificar a caixa de entrada e a pasta de SPAM.', {
        duration: 8000,
      });
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast.error('Erro ao enviar e-mail de redefinição. Tente novamente.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handlePlanChange = async (shopId: string, newPlan: Subscription['plan']) => {
    setIsUpdating(shopId);
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        'subscription.plan': newPlan
      });
      toast.success(`Plano alterado para ${newPlan}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}`);
      toast.error('Erro ao alterar plano');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;
    setIsDeleting(true);
    try {
      // Delete the shop document
      await deleteDoc(doc(db, 'shops', shopToDelete.id));
      // Delete the slug mapping
      await deleteDoc(doc(db, 'slugs', shopToDelete.slug));
      
      // Clean up orphaned user mappings in Firestore
      const usersQuery = query(collection(db, 'users'), where('company_id', '==', shopToDelete.id));
      const userDocs = await getDocs(usersQuery);
      const deleteUserPromises = userDocs.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
      await Promise.all(deleteUserPromises);
      
      toast.success('Parceiro excluído com sucesso!');
      setShopToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shops/${shopToDelete.id}`);
      toast.error('Erro ao excluir parceiro.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredShops = shops.filter(s => 
    s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total de Lojas', value: shops.length, icon: Store, color: 'bg-blue-500' },
    { label: 'Lojas Ativas', value: shops.filter(s => s.subscription?.status === 'active' || s.subscription?.status === 'trialing').length, icon: ShieldCheck, color: 'bg-green-500' },
    { 
      label: 'Faturamento Est.', 
      value: `R$ ${shops.reduce((acc, s) => {
        if (s.subscription?.status === 'suspended' || s.subscription?.plan?.includes('Trial')) return acc;
        const price = s.subscription?.plan === 'Pro' ? 89.90 : 29.90;
        return acc + price;
      }, 0).toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'bg-purple-500' 
    },
  ];

  const planDistribution = shops.reduce((acc, s) => {
    const plan = s.subscription?.plan || 'Nenhum';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalShops = shops.length || 1;
  const recentShops = [...shops].slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sidebar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="Voltar ao Dashboard"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/10 border border-slate-100 p-2 overflow-hidden">
                <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Painel Master</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nokite Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-900">{user.email}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Super Admin</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6"
            >
              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/5`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Stats & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Distribution */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribuição de Planos</h3>
            <div className="space-y-4">
              {Object.keys(planDistribution).map((plan) => {
                const count = planDistribution[plan] as number;
                return (
                  <div key={plan} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{plan}</span>
                      <span className="text-slate-900">{count} ({((count / totalShops) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / totalShops) * 100}%` }}
                        className={`h-full ${
                          plan === 'Pro' ? 'bg-purple-500' : 
                          plan === 'Básico' ? 'bg-blue-500' : 
                          plan === 'Trial Pro' ? 'bg-purple-300' : 
                          plan === 'Trial Básico' ? 'bg-blue-300' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Signups */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Novos Parceiros</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentShops.map((shop, i) => (
                <motion.div 
                  key={shop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 group hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">
                    {shop.shopName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{shop.shopName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('pt-BR') : 'Recente'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Shops List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciar Parceiros</h2>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por nome ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Parceiro</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Barbearia</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">
                        Nenhuma barbearia encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-black text-blue-600">
                              {shop.shopName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{shop.shopName}</p>
                              <p className="text-xs text-slate-400">flokite.com/b/{shop.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <select
                              value={shop.subscription?.plan || 'Trial Básico'}
                              onChange={(e) => handlePlanChange(shop.id, e.target.value as Subscription['plan'])}
                              disabled={isUpdating === shop.id}
                              className="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
                            >
                              <option value="Trial Básico">Trial Básico</option>
                              <option value="Trial Pro">Trial Pro</option>
                              <option value="Básico">Básico</option>
                              <option value="Pro">Pro</option>
                            </select>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                              shop.subscription?.expiresAt && new Date(shop.subscription.expiresAt) < new Date()
                                ? 'text-red-500'
                                : 'text-slate-400'
                            }`}>
                              Exp: {shop.subscription?.expiresAt ? new Date(shop.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                              {shop.subscription?.expiresAt && new Date(shop.subscription.expiresAt) < new Date() && ' (Vencido)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {shop.subscription?.status === 'suspended' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              <AlertCircle className="w-3 h-3" />
                              Suspenso
                            </span>
                          ) : shop.subscription?.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              <AlertCircle className="w-3 h-3" />
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativo
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => toggleSubscriptionStatus(shop.id, shop.subscription?.status)}
                              disabled={isUpdating === shop.id}
                              className={`p-2 rounded-lg transition-all ${
                                shop.subscription?.status === 'suspended'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : shop.subscription?.status === 'pending'
                                  ? 'text-blue-600 hover:bg-blue-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={
                                shop.subscription?.status === 'suspended' ? 'Ativar Acesso' : 
                                shop.subscription?.status === 'pending' ? 'Aprovar Cadastro' : 
                                'Suspender Acesso'
                              }
                            >
                              {isUpdating === shop.id ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : shop.subscription?.status === 'suspended' ? (
                                <Unlock className="w-5 h-5" />
                              ) : shop.subscription?.status === 'pending' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Lock className="w-5 h-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => fetchClientDetails(shop)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ver Detalhes"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            <a 
                              href={`/b/${shop.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={() => setShopToDelete({ id: shop.id, shopName: shop.shopName, slug: shop.slug })}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Parceiro"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Client Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedShopDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Detalhes do Cliente</h3>
                <div className="flex items-center gap-2">
                  {!isLoadingDetails && !isEditingDetails && (
                    <button 
                      onClick={() => setIsEditingDetails(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors font-bold text-sm"
                      title="Editar Detalhes"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="py-12 flex justify-center">
                  <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Shop Info */}
                  <div className="space-y-4">
                    {isEditingDetails ? (
                      <>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Barbearia</label>
                          <input 
                            type="text"
                            value={editFormData.shopName}
                            onChange={(e) => setEditFormData({...editFormData, shopName: e.target.value})}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link (Slug)</label>
                          <div className="flex items-center mt-1">
                            <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl py-2 px-3 text-sm font-medium text-slate-500">
                              flokite.com/b/
                            </span>
                            <input 
                              type="text"
                              value={editFormData.slug}
                              onChange={(e) => setEditFormData({...editFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail de Acesso</label>
                          <input 
                            type="email"
                            value={selectedShopDetails.email}
                            disabled
                            className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
                            title="O e-mail não pode ser alterado por motivos de segurança."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone</label>
                          <input 
                            type="text"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setIsEditingDetails(false)}
                            disabled={isSavingDetails}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveDetails}
                            disabled={isSavingDetails}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            {isSavingDetails ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Salvar
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Barbearia</label>
                          <p className="text-lg font-bold text-slate-900">{selectedShopDetails.shopName}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link</label>
                          <p className="text-sm font-medium text-blue-600">flokite.com/b/{selectedShopDetails.slug}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail de Acesso</label>
                          <p className="text-sm font-medium text-slate-900">{selectedShopDetails.email}</p>
                        </div>
                        {selectedShopDetails.phone && (
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone</label>
                            <p className="text-sm font-medium text-slate-900">{selectedShopDetails.phone}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Password Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Acesso e Segurança
                    </h4>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <p className="text-sm text-slate-600">
                        Se o cliente não consegue logar, use o botão abaixo para forçar a sincronização do e-mail com a barbearia.
                      </p>
                      
                      <button 
                        onClick={async () => {
                          if (!selectedShopDetails?.email) return;
                          setIsLoadingDetails(true);
                          try {
                            const cleanEmail = selectedShopDetails.email.trim().toLowerCase();
                            const rawEmail = selectedShopDetails.email;
                            
                            // Search for any existing user doc with this email (try raw and clean)
                            const usersRef = collection(db, 'users');
                            const q1 = query(usersRef, where('email', '==', rawEmail));
                            const q2 = query(usersRef, where('email', '==', cleanEmail));
                            const q3 = query(usersRef, where('email', '==', cleanEmail + ' '));
                            
                            const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
                            const allDocs = [...s1.docs, ...s2.docs, ...s3.docs];
                            
                            if (allDocs.length > 0) {
                              // Update all found docs to be clean and linked
                              const batch = [];
                              for (const d of allDocs) {
                                batch.push(updateDoc(doc(db, 'users', d.id), {
                                  company_id: selectedShopDetails.id,
                                  email: cleanEmail,
                                  role: 'admin'
                                }));
                              }
                              await Promise.all(batch);
                            } else {
                              // Create new mapping
                              await addDoc(collection(db, 'users'), {
                                email: cleanEmail,
                                company_id: selectedShopDetails.id,
                                role: 'admin'
                              });
                            }
                            toast.success('Vínculo de acesso reparado e limpo com sucesso!');
                          } catch (err) {
                            console.error(err);
                            toast.error('Erro ao reparar vínculo.');
                          } finally {
                            setIsLoadingDetails(false);
                          }
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Reparar Vínculo de Acesso
                      </button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold">
                          <span className="bg-slate-50 px-2 text-slate-400">Ou</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleSendPasswordReset}
                        disabled={isSendingReset}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSendingReset ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Enviar E-mail de Redefinição
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {shopToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-center text-slate-900 mb-2">Excluir Parceiro?</h3>
              <p className="text-center text-slate-500 mb-8">
                Tem certeza que deseja excluir a barbearia <strong className="text-slate-900">{shopToDelete.shopName}</strong>? Esta ação não pode ser desfeita e todos os dados serão perdidos.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShopToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteShop}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  {isDeleting ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sim, Excluir'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Partner Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Novo Parceiro</h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Nome da Barbearia
                  </label>
                  <input 
                    type="text"
                    required
                    value={newShopData.shopName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewShopData({
                        ...newShopData,
                        shopName: name,
                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                      });
                    }}
                    placeholder="Ex: Barbearia do João"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Link de Agendamento (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-2xl py-3 px-4 text-sm font-medium text-slate-500">
                      flokite.com/b/
                    </span>
                    <input 
                      type="text"
                      required
                      value={newShopData.slug}
                      onChange={(e) => setNewShopData({ ...newShopData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="barbearia-do-joao"
                      className="w-full bg-slate-50 border border-slate-200 rounded-r-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                    E-mail do Parceiro
                  </label>
                  <input 
                    type="email"
                    required
                    value={newShopData.email}
                    onChange={(e) => setNewShopData({ ...newShopData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Senha Inicial
                  </label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    value={newShopData.password}
                    onChange={(e) => setNewShopData({ ...newShopData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {isCreating ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Criar Parceiro'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
    </div>
  );
}
