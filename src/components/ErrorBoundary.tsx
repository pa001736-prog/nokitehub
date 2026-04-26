import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ops! Algo deu errado</h1>
              <p className="text-slate-500 font-medium">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
            </div>

            {errorDetails && (
              <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-2 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhes do Erro</p>
                <p className="text-xs font-mono text-slate-600 break-all">
                  Operação: {errorDetails.operationType}<br />
                  Caminho: {errorDetails.path}<br />
                  Erro: {errorDetails.error}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
