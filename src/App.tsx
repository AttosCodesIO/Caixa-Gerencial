import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Users,
  FolderKanban,
  Menu,
  Tags,
  LogOut,
  Calculator,
  ScrollText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
  const [openMenus, setOpenMenus] = useState<string[]>(['CAIXA GERENCIAL']);
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

  const modules = [
    { title: 'CAIXA GERENCIAL', links: linksCaixa },
    { title: 'CORREÇÃO MONETÁRIA', links: linksCorrecao },
    { title: 'CADASTROS', links: linksCadastros },
  ];

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((m) => m !== title) : [...prev, title],
    );
  };

  return (
    <>
      <div className="md:hidden p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logoAttos.jpeg" alt="Attos" className="h-7 w-auto" />
          <span className="font-bold text-lg text-neutral-800">Gestão Financeira</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo na Sidebar */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              <img src="/logoAttos.jpeg" alt="Attos" className="h-6 w-auto" />
            </div>
            <p className="text-white font-medium text-sm leading-tight">Gestão Financeira</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-3 pb-6 flex flex-col gap-4">
            {modules.map((module) => {
              const isModuleOpen = openMenus.includes(module.title);
              const hasActiveChild = module.links.some((link) => location.pathname === link.to);

              return (
                <div key={module.title} className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleMenu(module.title)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors group',
                      hasActiveChild && !isModuleOpen
                        ? 'text-white'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5',
                    )}
                  >
                    <span>{module.title}</span>
                    {isModuleOpen ? (
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>

                  {/* Conteúdo Retrátil com CSS puro */}
                  <div
                    className={cn(
                      'grid transition-all duration-200 ease-in-out',
                      isModuleOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-1 pt-1 ml-3 border-l border-neutral-800 pl-3">
                        {module.links.map((link) => {
                          const Icon = link.icon;
                          const isActive = location.pathname === link.to;
                          return (
                            <Link
                              key={link.to}
                              to={link.to}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200',
                                isActive
                                  ? 'bg-neutral-800 text-white font-medium shadow-sm ring-1 ring-white/10'
                                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200',
                              )}
                            >
                              <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-neutral-500")} />
                              <span className="text-sm">{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
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
