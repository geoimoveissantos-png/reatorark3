import React, { useState } from 'react';
import { Shield, Key, User as UserIcon, Mail, Lock, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { User, AuthSession } from '../../types/auth';
import { sounds } from '../../utils/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Informe o usuário/e-mail e a senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      sounds.playAcknowledge();
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      sounds.playClick();
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError('Todos os campos obrigatórios devem ser preenchidos.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          fullName: regFullName.trim() || regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar cadastro.');
      }

      sounds.playBoot();
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      sounds.playClick();
      setError(err.message || 'Erro ao registrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMasterLogin = () => {
    setLoginIdentifier('romildo');
    setLoginPassword('Romildo2009@');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#000a10] border border-[#00d4ff]/40 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.2)] overflow-hidden font-mono flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#011520] border-b border-[#0d3347] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase">
              REATOR ARK // AUTENTICAÇÃO
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355] hover:bg-[#ff3355]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-[#0d3347] bg-[#00060a]">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setTab('login');
              setError(null);
            }}
            className={`py-2.5 text-xs font-bold tracking-wider transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-[#00d4ff] text-[#00d4ff] bg-[#011520]'
                : 'border-transparent text-[#3a8a9a] hover:text-[#8ffcff]'
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setTab('register');
              setError(null);
            }}
            className={`py-2.5 text-xs font-bold tracking-wider transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-[#00d4ff] text-[#00d4ff] bg-[#011520]'
                : 'border-transparent text-[#3a8a9a] hover:text-[#8ffcff]'
            }`}
          >
            CADASTRO
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#2b000a] border border-[#ff3355]/40 text-[#ff8899] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ff3355]" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#3a8a9a]" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="romildo ou email@exemplo.com"
                    className="w-full h-10 pl-9 pr-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#3a8a9a] uppercase">
                    Senha
                  </label>
                  <span className="text-[10px] text-[#3a8a9a]">
                    Master: <code className="text-[#00ff88]">Romildo2009@</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#3a8a9a]" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha de acesso"
                    className="w-full h-10 pl-9 pr-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                  />
                </div>
              </div>

              {/* Quick Admin Master Prefill */}
              <button
                type="button"
                onClick={handleQuickMasterLogin}
                className="w-full py-1.5 px-2 rounded bg-[#001f2e] border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[10px] text-[#00d4ff] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-3 h-3 text-[#ffaa00]" />
                <span>Preencher Acesso Admin Master (Romildo)</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded bg-[#00d4ff] hover:bg-[#33ddff] text-black font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(0,212,255,0.4)] disabled:opacity-50"
              >
                {loading ? 'AUTENTICANDO...' : 'ACESSAR REATOR ARK'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full h-9 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  Nome de Usuário (Login) *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Ex: carlos_stark"
                  required
                  className="w-full h-9 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="carlos@exemplo.com"
                  required
                  className="w-full h-9 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  Senha de Acesso *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Crie uma senha segura"
                  required
                  className="w-full h-9 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className="w-full h-9 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-3 rounded bg-[#00ff88] hover:bg-[#33ffaa] text-black font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(0,255,136,0.3)] disabled:opacity-50"
              >
                {loading ? 'CADASTRANDO...' : 'CRIAR CADASTRO NO SISTEMA'}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#00060a] border-t border-[#0d3347] text-[10px] text-[#3a8a9a] text-center">
          BANCO DE DADOS: <span className="text-[#00ff88]">reatorark</span> // USUÁRIO: <span className="text-[#00d4ff]">emribeir_romildo</span>
        </div>
      </div>
    </div>
  );
};
