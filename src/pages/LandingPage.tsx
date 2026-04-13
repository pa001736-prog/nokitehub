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
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <Zap className="w-3 h-3" />
            O Sistema #1 para Barbearias Modernas
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9]"
          >
            Pare de perder tempo no <span className="text-blue-600">WhatsApp</span>. <br className="hidden md:block" />
            Tenha sua agenda <span className="text-blue-600">lotada no automático</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed"
          >
            Gestão completa, agendamento online e controle financeiro em uma única plataforma. 
            Feito para barbeiros que querem crescer e profissionalizar seu negócio.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {user ? (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3"
              >
                Ir para o Painel
                <LayoutDashboard className="w-6 h-6" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  Começar Agora
                  <ArrowRight className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  Ver Preços
                </button>
              </>
            )}
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-16 flex flex-col items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <img 
                  key={i}
                  src={`https://i.pravatar.cc/100?u=${i}`} 
                  alt="User" 
                  className="w-12 h-12 rounded-full border-4 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Mais de <span className="text-slate-900">500 barbeiros</span> já transformaram sua rotina
            </p>
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
