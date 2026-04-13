import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  User, 
  ShieldCheck, 
  X, 
  Save, 
  Check, 
  Camera,
  Percent,
  Briefcase,
  UserCheck,
  UserMinus,
  AlertCircle
} from 'lucide-react';
import { Professional } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ProfessionalsPageProps {
  professionals: Professional[];
  onAdd: (professional: Professional) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Professional>) => void;
}

export default function ProfessionalsPage({ professionals, onAdd, onRemove, onUpdate }: ProfessionalsPageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newCommission, setNewCommission] = useState('0');
  const [newPhoto, setNewPhoto] = useState('');
  const [profToDelete, setProfToDelete] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole) return;

    onAdd({
      id: crypto.randomUUID(),
      name: newName,
      role: newRole,
      commissionRate: parseFloat(newCommission),
      photo: newPhoto,
      active: true
    });

    setNewName('');
    setNewRole('');
    setNewCommission('0');
    setNewPhoto('');
    setIsAdding(false);
    toast.success('Profissional adicionado com sucesso!');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('A imagem é muito grande. Use uma imagem de até 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Equipe</h2>
          <p className="text-[var(--muted-foreground)] font-medium">Gerencie os profissionais da sua barbearia.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Novo Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((prof) => (
          <motion.div
            key={prof.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden border-2 border-blue-500/10">
                  {prof.photo ? (
                    <img src={prof.photo} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black">{prof.name}</h3>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{prof.role}</p>
                </div>
              </div>
              <button
                onClick={() => setProfToDelete(prof.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-2xl">
                <div className="flex items-center gap-3">
                  <Percent className="w-5 h-5 text-[var(--muted-foreground)]" />
                  <span className="text-sm font-bold text-[var(--muted-foreground)]">Comissão</span>
                </div>
                <span className="text-lg font-black">{prof.commissionRate}%</span>
              </div>

              <button
                onClick={() => onUpdate(prof.id, { active: !prof.active })}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  prof.active 
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/10' 
                    : 'bg-slate-50 text-slate-400 dark:bg-slate-900/10'
                }`}
              >
                {prof.active ? <UserCheck className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                {prof.active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--card)] rounded-[40px] p-10 shadow-2xl border border-[var(--border)] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tight">Novo Profissional</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                      {newPhoto ? (
                        <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg">
                      <Plus className="w-6 h-6" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Cargo / Especialidade</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: Barbeiro Master"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-1">Comissão (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                      <input
                        type="number"
                        value={newCommission}
                        onChange={(e) => setNewCommission(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--muted)] border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  <Save className="w-6 h-6" />
                  Salvar Profissional
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {profToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfToDelete(null)}
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
              <p className="text-[var(--muted-foreground)]">Esta ação não pode ser desfeita. O profissional será excluído permanentemente.</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setProfToDelete(null)}
                  className="flex-1 p-3 font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onRemove(profToDelete);
                    setProfToDelete(null);
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
