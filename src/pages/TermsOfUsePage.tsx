import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, ShieldCheck, Scale, FileText, Lock } from 'lucide-react';

export default function TermsOfUsePage() {
  const navigate = useNavigate();
  const sections = [
    {
      icon: FileText,
      title: "1. Aceitação dos Termos",
      content: "Ao acessar e utilizar o Nokite Hub, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços."
    },
    {
      icon: ShieldCheck,
      title: "2. Uso do Serviço",
      content: "O Nokite Hub é uma plataforma de gestão para barbearias. Você é responsável por manter a confidencialidade de sua conta e senha. O uso indevido da plataforma, incluindo tentativas de invasão ou engenharia reversa, resultará no cancelamento imediato da conta."
    },
    {
      icon: Scale,
      title: "3. Responsabilidades",
      content: "A Nokite Hub fornece a ferramenta, mas não se responsabiliza pelos serviços prestados pelos barbeiros aos seus clientes finais. A gestão de agendamentos, pagamentos e atendimento é de inteira responsabilidade do estabelecimento parceiro."
    },
    {
      icon: Lock,
      title: "4. Privacidade e Dados",
      content: "Coletamos dados necessários para o funcionamento da agenda e gestão financeira. Seus dados e os dados de seus clientes são tratados com segurança e não são vendidos a terceiros. Consulte nossa Política de Privacidade para mais detalhes."
    },
    {
      icon: Scissors,
      title: "5. Planos e Pagamentos",
      content: "O uso da plataforma está sujeito ao pagamento de mensalidades conforme o plano escolhido. O atraso no pagamento pode resultar na suspensão temporária do acesso às funcionalidades administrativas."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 p-1 overflow-hidden">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black tracking-tight text-sm">Nokite <span className="text-blue-600">Hub</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-16 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Termos de <span className="text-blue-600">Uso</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Última atualização: 30 de Março de 2026
          </p>
        </motion.div>

        <div className="grid gap-12">
          {sections.map((section, index) => (
            <motion.section 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 md:p-12 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <section.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <footer className="mt-20 pt-12 border-t border-slate-200 text-center space-y-6">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Dúvidas sobre os termos? Entre em contato conosco.
          </p>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
            suporte@flokite.com
          </button>
        </footer>
      </main>
    </div>
  );
}
