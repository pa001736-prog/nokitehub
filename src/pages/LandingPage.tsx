import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  Scissors, 
  Calendar, 
  CircleDollarSign, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Users,
  LayoutDashboard
} from 'lucide-react';

export default function LandingPage({ user }: { user: FirebaseUser | null }) {
  const navigate = useNavigate();
  const features = [
    {
      icon: Calendar,
      title: "Agenda lotada no automático",
      desc: "Seus clientes agendam sozinhos 24h por dia. O sistema organiza sua grade e você só se preocupa em cortar cabelo."
    },
    {
      icon: Smartphone,
      title: "Pare de perder tempo no WhatsApp",
      desc: "Chega de ficar respondendo 'tem horário pra hoje?' o dia todo. Envie seu link e deixe a tecnologia trabalhar por você."
    },
    {
      icon: CircleDollarSign,
      title: "Controle Financeiro Real",
      desc: "Fluxo de caixa completo. Saiba exatamente quanto ganhou no dia, na semana e no mês sem planilhas complicadas."
    },
    {
      icon: Zap,
      title: "Notificações Instantâneas",
      desc: "Receba alertas no celular assim que um novo cliente agendar. Fique por dentro de tudo em tempo real."
    },
    {
      icon: ShieldCheck,
      title: "Gestão de Clientes",
      desc: "Histórico completo de cada cliente, preferências e frequência de visitas para um atendimento personalizado."
    },
    {
      icon: LayoutDashboard,
      title: "Painel Administrativo",
      desc: "Interface moderna e intuitiva para gerenciar sua equipe, serviços e horários em segundos."
    }
  ];

  const plans = [
    {
      name: "Básico",
      price: "R$ 29,90",
      period: "/mês",
      desc: "O essencial para começar",
      features: [
        "Agendamentos Ilimitados",
        "Link Personalizado",
        "Cadastro de Clientes",
        "Até 1 Barbeiro"
      ],
      buttonText: "Começar Agora",
      highlight: false
    },
    {
      name: "Ideal",
      price: "R$ 51,29",
      period: "/mês",
      desc: "Perfeito para profissionais individuais",
      features: [
        "Tudo do Básico",
        "Controle Financeiro",
        "Até 3 Barbeiros",
        "Suporte Prioritário",
        "Relatórios de Vendas"
      ],
      buttonText: "Assinar Ideal",
      highlight: true
    },
    {
      name: "Pro",
      price: "R$ 89,90",
      period: "/mês",
      desc: "Para barbearias em expansão",
      features: [
        "Tudo do Ideal",
        "Barbeiros Ilimitados",
        "Gestão de Estoque",
        "Marketing p/ Clientes",
        "Suporte VIP 24/7"
      ],
      buttonText: "Em Breve",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 p-2 border border-slate-100 overflow-hidden transition-transform hover:scale-105">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight">Nokite <span className="text-blue-600">Hub</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-500">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-blue-600 transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir para o Painel
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="hidden sm:block font-bold text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Entrar
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                >
                  Começar Agora
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left space-y-8 lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100"
            >
              <Zap className="w-4 h-4" />
              O Sistema de Agendamento Moderno
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]"
            >
              Sua agenda <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                100% no automático.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg"
            >
              Organize seus horários, controle o financeiro e deixe seus clientes agendarem sozinhos. Tudo em um sistema simples, profissional e feito para impulsionar o seu negócio.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              {user ? (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Ir para o Painel
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    Começar Grátis
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    Ver Como Funciona
                  </button>
                </>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-6 flex items-center gap-4 text-sm font-semibold text-slate-500"
            >
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Teste grátis</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sem compromisso</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Suporte VIP</div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block relative [perspective:1000px]"
          >
            {/* Barbershop UI Mockup */}
            <div className="relative z-10 w-full h-[500px] flex items-center justify-center">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 rounded-full blur-[80px]" />
                
                {/* Main Schedule Card */}
                <div className="absolute right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 transition-all duration-700 ease-out [transform:rotateY(-15deg)_rotateX(5deg)_translateZ(20px)] hover:[transform:rotateY(0)_rotateX(0)_translateZ(0)]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Agenda de Hoje</h3>
                            <p className="text-sm font-semibold text-slate-500">Terça, 15 de Out</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-blue-100/50">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="font-bold text-slate-900 w-12 text-right text-lg">09:00</div>
                           <div className="w-1.5 h-12 bg-slate-300 rounded-full" />
                           <div>
                               <div className="font-bold text-slate-900">João Silva</div>
                               <div className="text-xs text-slate-500 font-semibold tracking-wide">CORTE + BARBA</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.08)] relative overflow-hidden transform scale-[1.02]">
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full" />
                           <div className="font-black text-blue-600 w-12 text-right text-lg">10:30</div>
                           <div className="w-1.5 h-12 bg-blue-100 rounded-full" />
                           <div>
                               <div className="font-black text-slate-900">C. Eduardo</div>
                               <div className="text-xs text-blue-600 font-bold tracking-wide">EM ANDAMENTO</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                           <div className="font-bold text-slate-400 w-12 text-right text-lg">11:30</div>
                           <div className="w-1.5 h-12 bg-slate-200 rounded-full" />
                           <div>
                               <div className="font-bold text-slate-400">Horário Livre</div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Floating Daily Revenue Card */}
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 left-0 lg:-left-12 w-64 bg-[var(--foreground)] rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-800 p-6 z-20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                            <CircleDollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimas 24h</div>
                            <div className="text-2xl font-black text-white">R$ 1.450</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-xs">+12%</span>
                        </div>
                        <span className="text-slate-500 font-semibold text-xs">vs ontem</span>
                    </div>
                </motion.div>

                {/* Floating Client Card */}
                 <motion.div 
                    animate={{ x: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
                    className="absolute top-24 left-0 lg:-left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 z-20"
                >
                    <div className="relative">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                            <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900 tracking-tight">Novo Agendamento</div>
                        <div className="text-xs text-slate-500 font-semibold">Via link da bio</div>
                    </div>
                </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tudo o que você precisa para <span className="text-blue-600">dominar</span> o mercado</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Desenvolvemos cada detalhe pensando na agilidade que o barbeiro precisa no dia a dia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <f.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Preço justo para <span className="text-blue-600">crescer</span> com você</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Escolha o plano que melhor se adapta ao seu momento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Básico",
                price: "R$ 29,90",
                period: "/mês",
                desc: "O essencial para começar",
                features: ["Agendamentos Ilimitados", "Link Personalizado", "Cadastro de Clientes", "Até 1 Barbeiro"],
                buttonText: "Começar Agora",
                highlight: false
              },
              {
                name: "Pro",
                price: "R$ 89,90",
                period: "/mês",
                desc: "Para barbearias em expansão",
                features: ["Tudo do Básico", "Barbeiros Ilimitados", "Gestão de Estoque", "Marketing p/ Clientes", "Suporte VIP 24/7"],
                buttonText: "Em Breve",
                highlight: true
              }
            ].map((plan, i) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-[40px] p-10 shadow-2xl transition-all relative overflow-hidden flex flex-col ${
                  plan.highlight 
                    ? 'border-2 border-blue-600 shadow-blue-500/10 scale-105 z-10' 
                    : 'border border-slate-100 shadow-slate-200/50'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-xs uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}
                
                <div className="space-y-6 flex-1">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                    <p className="text-slate-500 font-medium">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 font-bold">{plan.period}</span>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-slate-600 font-bold text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/login')}
                  className={`w-full mt-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
            Todos os planos incluem 15 dias de teste grátis
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-[40px] p-12 md:p-20 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-blue-500/40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[0.9]">
            Pronto para levar sua barbearia ao próximo nível?
          </h2>
          
          <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto">
            Comece agora mesmo e ganhe 15 dias de teste grátis. Sem cartão de crédito, sem burocracia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {user ? (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full sm:w-auto px-12 py-6 bg-white text-blue-600 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3"
              >
                Ir para o Painel
                <LayoutDashboard className="w-6 h-6" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-12 py-6 bg-white text-blue-600 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Criar Minha Conta Grátis
              </button>
            )}
            <div className="flex items-center gap-2 text-white/80 font-bold text-sm uppercase tracking-widest">
              <CheckCircle2 className="w-5 h-5" />
              Setup em 2 minutos
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 p-1 overflow-hidden">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black tracking-tight">Nokite <span className="text-blue-600">Hub</span></span>
          </div>
          
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Nokite Hub • Todos os direitos reservados
          </p>

          <div className="flex items-center gap-6">
            <a 
              href="/termos" 
              className="text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Termos de Uso
            </a>
            <Users className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
            <Smartphone className="w-5 h-5 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
