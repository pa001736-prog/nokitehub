import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithEmail, loginWithGoogle, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Por favor, digite seu e-mail primeiro.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('E-mail enviado! Verifique sua caixa de entrada e também a pasta de SPAM.', {
        duration: 6000,
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar e-mail de redefinição.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginPromise = loginWithEmail(email.trim(), password);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tempo de resposta excedido. Verifique sua conexão.')), 15000)
    );

    try {
      console.log('Tentando login:', email.trim());
      await Promise.race([loginPromise, timeoutPromise]);
      console.log('Login bem-sucedido');
      
      toast.success('Bem-vindo de volta!');
      
      onLoginSuccess();
      navigate('/admin');
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      let message = 'Ocorreu um erro. Tente novamente.';
      
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/invalid-login-credentials') {
        message = 'E-mail ou senha incorretos. Verifique seus dados.';
      } else if (errorCode === 'auth/too-many-requests') {
        message = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
      } else if (errorCode === 'auth/user-disabled') {
        message = 'Esta conta foi desativada. Entre em contato com o suporte.';
      } else if (err.message && !err.message.includes('Firebase:')) {
        message = err.message;
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Login realizado com sucesso!');
      onLoginSuccess();
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Login cancelado.');
      } else {
        toast.error('Erro ao entrar com Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-[var(--foreground)] bg-white dark:bg-slate-950 font-sans selection:bg-blue-500/30">
      
      {/* Left Pane - Brand / Trust (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative p-12 lg:p-20 flex-col overflow-hidden">
        {/* Subtle background pattern/glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-multiply" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[120px]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <Link to="/" className="inline-flex items-center gap-4 w-fit">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4 shadow-lg shadow-black/20">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white font-display">Nokite Hub</span>
          </Link>

          <div className="mt-auto mb-12">
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight font-display mb-6">
              A plataforma definitiva para organizar e crescer o seu negócio.
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed font-medium">
              Agendamentos inteligentes, controle financeiro absoluto e gestão de equipe em um único painel.
            </p>

            <div className="flex items-center gap-6 pt-10 border-t border-white/10">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative z-[${5-i}]`}>
                     <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-300">
                  <span className="font-bold text-white">500+</span> profissionais confiam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <Link to="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      
        <div className="w-full max-w-[440px] mt-12 lg:mt-0">
          <div className="mb-10 text-center lg:text-left">
             <div className="lg:hidden w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-4 shadow-lg shadow-black/5 border border-slate-100 dark:border-white/5 mx-auto mb-6">
                <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
             </div>
            <h1 className="text-3xl font-black tracking-tight mb-2 font-display text-slate-900 dark:text-white">Acesse sua conta</h1>
            <p className="text-[var(--muted-foreground)] font-medium">Informe seus dados para entrar no painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-4 flex items-start gap-3 mb-6"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] ml-1">
                E-mail Profissional
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@suabarbearia.com"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Senha
                </label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 mt-2 font-black tracking-wide shadow-lg shadow-blue-600/25 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
              <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">Login Alternativo</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm mb-8"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
            Continuar com Google
          </button>
          
          <div className="flex items-center justify-center gap-2 mt-auto text-xs font-bold text-slate-400">
             <AlertCircle className="w-4 h-4 text-emerald-500" /> 
             <span>Ambiente Seguro 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
