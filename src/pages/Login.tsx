import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message === 'Email not confirmed' || error.message.includes('confirmed')) {
        setError('Por favor, confirme seu e-mail através do link que enviamos antes de fazer login. (Ou desative a confirmação de e-mail no painel do Supabase)');
      } else {
        setError(error.message || 'E-mail ou senha inválidos.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-8 py-4 mb-5 shadow-lg">
            <img src="/logoAttos.jpeg" alt="Attos" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">Caixa Gerencial</h1>
          <p className="text-neutral-400 mt-2">Faça login para acessar o sistema</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mensagem de erro */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campo E-mail */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-neutral-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/30 focus:border-white/30 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-neutral-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/30 focus:border-white/30 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg border border-neutral-700 hover:border-neutral-600 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer do card */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/10">
            <p className="text-center text-neutral-400 text-sm mb-2">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-white hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
            <p className="text-center text-neutral-500 text-xs">
              Gestão Financeira Segura
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-500 text-xs mt-6">
          © 2026 Attos · Caixa Gerencial
        </p>
      </div>
    </div>
  );
}
