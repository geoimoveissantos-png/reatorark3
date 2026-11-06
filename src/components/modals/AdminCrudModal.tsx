import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  Database,
  CheckCircle,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  Server,
  Layers,
  Key
} from 'lucide-react';
import { User, DatabaseStatus, UserRole, UserStatus } from '../../types/auth';
import { sounds } from '../../utils/soundEffects';

interface AdminCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserModified?: () => void;
}

export const AdminCrudModal: React.FC<AdminCrudModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserModified,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'database'>('users');

  // Form states
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form inputs
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/database/status');
      const data = await res.json();
      setDbStatus(data);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchDbStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openCreateModal = () => {
    sounds.playClick();
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormStatus('active');
    setFormError(null);
    setModalMode('create');
  };

  const openEditModal = (user: User) => {
    sounds.playClick();
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormFullName(user.fullName);
    setFormEmail(user.email);
    setFormPassword(''); // blank unless changing
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormError(null);
    setModalMode('edit');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formEmail.trim()) {
      setFormError('Nome de usuário e e-mail são obrigatórios.');
      return;
    }
    if (modalMode === 'create' && !formPassword) {
      setFormError('A senha é obrigatória para criação de novos usuários.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            fullName: formFullName.trim() || formUsername.trim(),
            email: formEmail.trim(),
            password: formPassword,
            role: formRole,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário.');
      } else if (modalMode === 'edit' && selectedUser) {
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            fullName: formFullName.trim() || formUsername.trim(),
            email: formEmail.trim(),
            password: formPassword.trim() ? formPassword.trim() : undefined,
            role: formRole,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar usuário.');
      }

      sounds.playAcknowledge();
      setModalMode(null);
      fetchUsers();
      fetchDbStatus();
      onUserModified?.();
    } catch (err: any) {
      sounds.playClick();
      setFormError(err.message || 'Falha ao processar operação.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao deletar.');

      sounds.playAcknowledge();
      setUserToDelete(null);
      fetchUsers();
      fetchDbStatus();
      onUserModified?.();
    } catch (err: any) {
      alert(err.message || 'Não foi possível deletar o usuário.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-mono">
      <div className="w-full max-w-5xl h-[90vh] bg-[#000a10] border border-[#00d4ff]/40 rounded-xl shadow-[0_0_40px_rgba(0,212,255,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 bg-[#011520] border-b border-[#0d3347] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-[#00d4ff] uppercase">
                  PAINEL ADMIN MASTER // CRUD REATOR ARK
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88]">
                  ACESSO MASTER
                </span>
              </div>
              <p className="text-[10px] text-[#3a8a9a]">
                Gerenciamento completo de usuários, dados cadastrais e banco de dados MySQL reatorark
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded text-[#3a8a9a] hover:text-[#ff3355] hover:bg-[#ff3355]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Quick Telemetry Banner */}
        <div className="bg-[#00060a] border-b border-[#0d3347] px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-[#3a8a9a] gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#00d4ff]" />
              <span>BANCO: <strong className="text-[#8ffcff]">reatorark</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#ffaa00]" />
              <span>USUÁRIO: <strong className="text-[#8ffcff]">emribeir_romildo</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#00ff88]" />
              <span>HOST: <strong className="text-[#8ffcff]">127.0.0.1:3306</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-[#00ff88]' : 'bg-[#00d4ff] animate-pulse'}`} />
              <span className="text-[#00ff88] font-bold">
                {dbStatus?.connected ? 'MYSQL CONECTADO' : 'PERSISTÊNCIA HÍBRIDA ATIVA'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab(activeTab === 'users' ? 'database' : 'users');
              }}
              className="px-2.5 py-1 rounded bg-[#011520] hover:bg-[#002b3d] border border-[#0d3347] text-[#00d4ff] text-[10px] flex items-center gap-1 transition-colors"
            >
              <Layers className="w-3 h-3" />
              <span>{activeTab === 'users' ? 'VER TABELAS SQL' : 'VER USUÁRIOS'}</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                fetchUsers();
                fetchDbStatus();
              }}
              className="p-1 rounded text-[#3a8a9a] hover:text-[#00d4ff] transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Body View */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-[#00080f]">
          {activeTab === 'users' ? (
            <>
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#3a8a9a]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar por nome, usuário, email ou papel..."
                    className="w-full h-8 pl-8 pr-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] placeholder-[#3a8a9a] outline-none"
                  />
                </div>

                <button
                  onClick={openCreateModal}
                  className="px-4 h-8 rounded bg-[#00d4ff] hover:bg-[#33ddff] text-black font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,212,255,0.3)] shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>INCLUIR USUÁRIO</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="flex-1 border border-[#0d3347] rounded-lg overflow-x-auto overflow-y-auto bg-[#000a10]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#011520] border-b border-[#0d3347] text-[#3a8a9a] uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Usuário</th>
                      <th className="py-2.5 px-3">Nome Completo</th>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">Papel</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Data de Cadastro</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0d3347]/50 text-[#8ffcff]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#3a8a9a]">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isRootMaster = u.username === 'romildo' && u.role === 'master_admin';
                        return (
                          <tr key={u.id} className="hover:bg-[#011520]/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold flex items-center gap-1.5">
                              <span className="text-[#00d4ff]">@{u.username}</span>
                              {u.role === 'master_admin' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#ffaa00]/15 border border-[#ffaa00]/30 text-[#ffaa00]">
                                  MASTER
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">{u.fullName}</td>
                            <td className="py-2.5 px-3 text-[#3a8a9a]">{u.email}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded ${
                                  u.role === 'master_admin'
                                    ? 'bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30'
                                    : u.role === 'admin'
                                    ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                                    : 'bg-[#3a8a9a]/15 text-[#8ffcff] border border-[#3a8a9a]/30'
                                }`}
                              >
                                {u.role === 'master_admin'
                                  ? 'Master Admin'
                                  : u.role === 'admin'
                                  ? 'Administrador'
                                  : 'Usuário'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded ${
                                  u.status === 'active'
                                    ? 'bg-[#00ff88]/15 text-[#00ff88]'
                                    : 'bg-[#ff3355]/15 text-[#ff3355]'
                                }`}
                              >
                                {u.status === 'active' ? 'Ativo' : 'Suspenso'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#3a8a9a] whitespace-nowrap">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-1 rounded text-[#00d4ff] hover:bg-[#00d4ff]/20 border border-transparent hover:border-[#00d4ff]/40 transition-colors"
                                  title="Editar Usuário"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    sounds.playClick();
                                    setUserToDelete(u);
                                  }}
                                  disabled={isRootMaster}
                                  className={`p-1 rounded transition-colors ${
                                    isRootMaster
                                      ? 'text-[#3a8a9a] opacity-30 cursor-not-allowed'
                                      : 'text-[#ff3355] hover:bg-[#ff3355]/20 border border-transparent hover:border-[#ff3355]/40'
                                  }`}
                                  title={isRootMaster ? 'Conta mestre protegida' : 'Excluir Usuário'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Database Inspector Tab */
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="p-4 rounded-lg bg-[#000a10] border border-[#0d3347] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00d4ff]" />
                    <span className="font-bold text-xs text-[#00d4ff]">
                      CONFIGURAÇÃO DO BANCO DE DADOS MYSQL
                    </span>
                  </div>
                  <span className="text-[10px] text-[#00ff88]">
                    TABELAS OPERACIONAIS SINCRONIZADAS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-[#010d14] border border-[#0d3347]">
                    <span className="text-[10px] text-[#3a8a9a] block">BANCO DE DADOS</span>
                    <span className="font-bold text-[#8ffcff]">reatorark</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#010d14] border border-[#0d3347]">
                    <span className="text-[10px] text-[#3a8a9a] block">USUÁRIO MYSQL</span>
                    <span className="font-bold text-[#8ffcff]">emribeir_romildo</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#010d14] border border-[#0d3347]">
                    <span className="text-[10px] text-[#3a8a9a] block">SENHA MYSQL</span>
                    <span className="font-mono text-[#00ff88]">Romildo2009@</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#010d14] border border-[#0d3347]">
                    <span className="text-[10px] text-[#3a8a9a] block">CONEXÃO HOST</span>
                    <span className="font-bold text-[#8ffcff]">127.0.0.1:3306</span>
                  </div>
                </div>

                {/* Tables count */}
                <div>
                  <span className="text-[11px] font-bold text-[#3a8a9a] uppercase block mb-2">
                    TABELAS CRIADAS NO REATOR ARK
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {dbStatus?.tables?.map((t) => (
                      <div
                        key={t.name}
                        className="p-2 rounded bg-[#011520] border border-[#0d3347] flex items-center justify-between"
                      >
                        <span className="text-xs text-[#8ffcff] font-bold">{t.name}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#00d4ff]/20 text-[#00d4ff] font-mono">
                          {t.count} regs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DDL SQL Script info */}
                <div className="p-3 rounded bg-[#010d14] border border-[#0d3347] text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#00d4ff] font-bold">SCRIPT SQL DDL COMPLETO DISPONÍVEL:</span>
                    <code className="text-[#ffaa00]">/reatorark_schema.sql</code>
                  </div>
                  <p className="text-[#3a8a9a] text-[10px]">
                    O arquivo <code>reatorark_schema.sql</code> contém os comandos de criação do banco, concessão de privilégios para <code>emribeir_romildo</code>, schemas das 5 tabelas e seeds de inicialização.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submodal: Create or Edit User */}
        {modalMode && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#000a10] border border-[#00d4ff] rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.3)] overflow-hidden flex flex-col font-mono animate-fadeIn">
              <div className="px-5 py-3 bg-[#011520] border-b border-[#0d3347] flex items-center justify-between">
                <span className="text-xs font-bold text-[#00d4ff] uppercase">
                  {modalMode === 'create' ? 'INCLUIR NOVO USUÁRIO' : `EDITAR: @${selectedUser?.username}`}
                </span>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-5 space-y-3">
                {formError && (
                  <div className="p-2.5 rounded bg-[#2b000a] border border-[#ff3355]/40 text-[#ff8899] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#ff3355]" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    required
                    placeholder="usuario_login"
                    className="w-full h-8 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Nome e Sobrenome"
                    className="w-full h-8 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    placeholder="email@exemplo.com"
                    className="w-full h-8 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                    {modalMode === 'create' ? 'Senha *' : 'Nova Senha (deixe em branco para manter)'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={modalMode === 'create' ? 'Senha do usuário' : 'Nova senha opcional'}
                    className="w-full h-8 px-3 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                      Papel / Role
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      className="w-full h-8 px-2 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                      <option value="master_admin">Master Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#3a8a9a] uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                      className="w-full h-8 px-2 rounded bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs text-[#8ffcff] outline-none"
                    >
                      <option value="active">Ativo</option>
                      <option value="suspended">Suspenso</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0d3347]">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-3 py-1.5 rounded bg-[#011520] hover:bg-[#002b3d] text-xs text-[#3a8a9a] hover:text-[#8ffcff]"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-1.5 rounded bg-[#00d4ff] hover:bg-[#33ddff] text-black font-bold text-xs tracking-wider disabled:opacity-50"
                  >
                    {formLoading ? 'SALVANDO...' : modalMode === 'create' ? 'CRIAR USUÁRIO' : 'SALVAR ALTERAÇÕES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#000a10] border border-[#ff3355] rounded-xl p-5 font-mono shadow-[0_0_30px_rgba(255,51,85,0.3)]">
              <div className="flex items-center gap-2 text-[#ff3355] mb-3">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">CONFIRMAR EXCLUSÃO</span>
              </div>
              <p className="text-xs text-[#8ffcff] mb-2">
                Tem certeza que deseja remover o usuário <strong>@{userToDelete.username}</strong> ({userToDelete.fullName})?
              </p>
              <p className="text-[11px] text-[#3a8a9a] mb-4">
                Esta ação apagará permanentemente o registro do banco de dados reatorark.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-3 py-1.5 rounded bg-[#011520] text-xs text-[#3a8a9a] hover:text-[#8ffcff]"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-1.5 rounded bg-[#ff3355] hover:bg-[#ff5577] text-white font-bold text-xs tracking-wider"
                >
                  CONFIRMAR EXCLUSÃO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
