import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Users, FolderKanban, Menu, Tags, LogOut, Calculator, ScrollText } from 'lucide-react';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Payees from './pages/Payees';
import Projects from './pages/Projects';
import Classifications from './pages/Classifications';
import MonetaryCorrection from './pages/MonetaryCorrection';
import MonetaryHistory from './pages/MonetaryHistory';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user } = useAuth();

  const linksCaixa = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Lançamentos', icon: ReceiptText },
  ];

  const linksCorrecao = [
    { to: '/monetary-correction', label: 'Novo Cálculo', icon: Calculator },
    { to: '/monetary-correction/history', label: 'Histórico', icon: ScrollText },
  ];

  const linksCadastros = [
    { to: '/payees', label: 'Favorecidos', icon: Users },
    { to: '/projects', label: 'Projetos', icon: FolderKanban },
    { to: '/classifications', label: 'Classificações', icon: Tags },
  ];

  const renderLinks = (links: any[]) => {
    return links.map((link) => {
      const Icon = link.icon;
      const isActive = location.pathname === link.to;
      return (
        <Link
          key={link.to}
          to={link.to}
          onClick={() => setIsOpen(false)}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors",
            isActive 
              ? "bg-white text-neutral-900 font-semibold shadow-sm" 
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <>
      <div className="md:hidden p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logoAttos.jpeg" alt="Attos" className="h-7 w-auto" />
          <span className="font-bold text-lg text-neutral-800">Sistema Attos</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo na Sidebar */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white rounded-lg p-1.5">
              <img src="/logoAttos.jpeg" alt="Attos" className="h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Sistema Attos</h1>
              <p className="text-neutral-500 text-xs">Gestão Financeira</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-2 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h2 className="px-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Caixa Gerencial</h2>
            <div className="px-2 space-y-1">
              {renderLinks(linksCaixa)}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="px-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Correção Monetária</h2>
            <div className="px-2 space-y-1">
              {renderLinks(linksCorrecao)}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="px-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cadastros</h2>
            <div className="px-2 space-y-1">
              {renderLinks(linksCadastros)}
            </div>
          </div>
        </nav>

        {/* Área do usuário + Logout */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function AppLayout() {
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/monetary-correction" element={<MonetaryCorrection />} />
            <Route path="/monetary-correction/history" element={<MonetaryHistory />} />
            <Route path="/payees" element={<Payees />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/classifications" element={<Classifications />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/register" element={<RegisterGuard />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

function RegisterGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Register />;
}
