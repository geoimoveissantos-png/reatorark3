import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Settings,
  Sliders,
  Brain,
  Puzzle,
  Smartphone,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Power,
  Shield,
  User as UserIcon,
  LogOut,
  LogIn,
  Key
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { User } from '../types/auth';

interface HudHeaderProps {
  engineMode: 'gemini' | 'local';
  onToggleDrawer: (drawer: 'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote' | null) => void;
  activeDrawer: string | null;
  isSleeping: boolean;
  onToggleSleep: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAdminCrud: () => void;
  onLogout: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  engineMode,
  onToggleDrawer,
  activeDrawer,
  isSleeping,
  onToggleSleep,
  currentUser,
  onOpenAuth,
  onOpenAdminCrud,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
    if (!next) sounds.playClick();
  };

  const handleFullscreenToggle = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDrawerClick = (name: 'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote') => {
    sounds.playClick();
    onToggleDrawer(activeDrawer === name ? null : name);
  };

  const isMasterOrAdmin = currentUser?.role === 'master_admin' || currentUser?.role === 'admin';

  return (
    <header className="h-12 bg-[#00060a] border-b border-[#0d3347] px-2 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none gap-2">
      {/* Zone 1: Brand & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff] animate-pulse" />
          <span className="font-mono font-black text-xs sm:text-sm tracking-[0.2em] text-[#00d4ff] whitespace-nowrap">
            REATOR<span className="text-[#ff6b00]">ARK</span>
          </span>
          <span className="text-[9px] sm:text-[10px] tracking-wider text-[#3a8a9a] font-mono border-l border-[#0d3347] pl-1.5 sm:pl-2 hidden xs:inline">
            MARK LVI
          </span>
        </div>

        {/* Engine status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#011520] border border-[#0d3347] text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
          <span className="text-[#3a8a9a]">ENGINE:</span>
          <span className="text-[#00ff88] font-bold">
            {engineMode === 'gemini' ? 'GEMINI FLASH' : 'LOCAL CORE'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Drawers & Admin Shortcut */}
      <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-1">
        {/* Admin Master CRUD Button */}
        {isMasterOrAdmin && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdminCrud();
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] font-mono font-bold rounded bg-[#ff6b00]/15 hover:bg-[#ff6b00]/25 text-[#ffaa00] border border-[#ff6b00]/40 transition-all shadow-[0_0_10px_rgba(255,107,0,0.2)]"
            title="Painel Master de Gerenciamento CRUD de Usuários e Banco MySQL"
          >
            <Shield className="w-3.5 h-3.5 text-[#ffaa00]" />
            <span className="whitespace-nowrap">CRUD MASTER</span>
          </button>
        )}

        <button
          onClick={() => handleDrawerClick('engine')}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            activeDrawer === 'engine'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
          }`}
          title="Provedores de IA"
        >
          <Cpu className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="hidden md:inline">ENGINE</span>
        </button>

        <button
          onClick={() => handleDrawerClick('skills')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            activeDrawer === 'skills'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
          }`}
          title="Catálogo de Habilidades"
        >
          <Puzzle className="w-3.5 h-3.5 text-[#ffaa00]" />
          <span className="hidden md:inline">SKILLS</span>
        </button>

        <button
          onClick={() => handleDrawerClick('memory')}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            activeDrawer === 'memory'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
          }`}
          title="Cofre de Memória"
        >
          <Brain className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="hidden md:inline">MEMÓRIA</span>
        </button>

        <button
          onClick={() => handleDrawerClick('controls')}
          className={`hidden md:flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            activeDrawer === 'controls'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]'
              : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
          }`}
          title="Controles do HUD"
        >
          <Sliders className="w-3.5 h-3.5 text-[#00ff88]" />
          <span>CONTROLES</span>
        </button>
      </nav>

      {/* Zone 3: User Authentication & Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* User Profile Pill / Auth Button */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-[#011520] border border-[#0d3347] px-2 py-1 rounded">
            <UserIcon className="w-3.5 h-3.5 text-[#00d4ff]" />
            <div className="flex flex-col text-left leading-tight hidden xs:block">
              <span className="text-[10px] font-mono font-bold text-[#8ffcff] truncate max-w-[80px] sm:max-w-[120px]">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className="text-[8px] font-mono text-[#3a8a9a] uppercase">
                {currentUser.role === 'master_admin' ? 'MASTER' : currentUser.role}
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onLogout();
              }}
              className="p-1 rounded text-[#3a8a9a] hover:text-[#ff3355] transition-colors ml-1"
              title="Trocar de Conta / Sair"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAuth();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-mono font-bold transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>LOGIN</span>
          </button>
        )}

        <div className="h-4 w-px bg-[#0d3347] mx-0.5 hidden xs:block" />

        {/* Audio Mute */}
        <button
          onClick={handleMuteToggle}
          className="p-1.5 rounded text-[#3a8a9a] hover:text-[#00d4ff] border border-[#0d3347] bg-[#010d14] transition-colors"
          title={isMuted ? 'Ativar Efeitos Sonoros' : 'Mutar Efeitos Sonoros'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ff3355]" /> : <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />}
        </button>

        {/* Sleep / Wake Toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleSleep();
          }}
          className={`p-1.5 rounded border transition-colors ${
            isSleeping
              ? 'bg-[#2b000a] border-[#ff3355]/40 text-[#ff3355]'
              : 'bg-[#002b1f] border-[#00ff88]/40 text-[#00ff88]'
          }`}
          title={isSleeping ? 'Despertar JARVIS' : 'Colocar JARVIS em Repouso'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen (desktop) */}
        <button
          onClick={handleFullscreenToggle}
          className="p-1.5 rounded text-[#3a8a9a] hover:text-[#8ffcff] border border-[#0d3347] bg-[#010d14] transition-colors hidden sm:block"
          title="Tela Cheia"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
