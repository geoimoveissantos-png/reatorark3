import React, { useState, useEffect, useRef } from 'react';
import { HudHeader } from './components/HudHeader';
import { ArcReactorHolo, AvatarState } from './components/ArcReactorHolo';
import { ActivityLog, LogEntry } from './components/ActivityLog';
import { VoiceControlBar } from './components/VoiceControlBar';
import {
  HudOverlays,
  VideoData,
  QuizData,
  ReviewData,
  ContentData,
} from './components/HudOverlays';
import { EngineDrawer } from './components/drawers/EngineDrawer';
import { SkillsDrawer } from './components/drawers/SkillsDrawer';
import { MemoryDrawer, MemoryFact } from './components/drawers/MemoryDrawer';
import { ControlsDrawer } from './components/drawers/ControlsDrawer';
import { RemoteDashboardModal } from './components/drawers/RemoteDashboardModal';
import { AuthModal } from './components/modals/AuthModal';
import { AdminCrudModal } from './components/modals/AdminCrudModal';
import { sounds } from './utils/soundEffects';
import { User, AuthSession } from './types/auth';
import {
  Activity,
  Zap,
  ShieldCheck,
  Radio,
  Sliders,
  Sparkles,
  Play,
  CloudSun,
  HelpCircle,
  FileCheck,
  Plane,
  Eye,
  FileText,
  SlidersHorizontal,
  Shield
} from 'lucide-react';

export const App: React.FC = () => {
  // Authentication & Current User
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('reatorark_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) return parsed.user;
      }
    } catch {}
    // Default Comandante Romildo
    return {
      id: 'usr_romildo_master',
      username: 'romildo',
      email: 'geoimoveissantos@gmail.com',
      fullName: 'Romildo Ribeiro',
      role: 'master_admin',
      status: 'active',
      createdAt: '2026-11-06T00:00:00.000Z',
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminCrudOpen, setIsAdminCrudOpen] = useState<boolean>(false);

  // Mobile Active HUD View: 'hologram' | 'telemetry' | 'logs'
  const [mobileHudView, setMobileHudView] = useState<'hologram' | 'telemetry' | 'logs'>('hologram');

  // State
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true);
  const [engineMode, setEngineMode] = useState<'gemini' | 'local'>('gemini');
  const [activeDrawer, setActiveDrawer] = useState<'setup' | 'controls' | 'skills' | 'memory' | 'engine' | 'remote' | null>(null);

  // HUD Overlays
  const [videoOverlay, setVideoOverlay] = useState<VideoData | null>(null);
  const [quizOverlay, setQuizOverlay] = useState<QuizData | null>(null);
  const [reviewOverlay, setReviewOverlay] = useState<ReviewData | null>(null);
  const [contentOverlay, setContentOverlay] = useState<ContentData | null>(null);

  // Speech Recognition & Activity Logs
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'Sistema MARK LVI inicializado. Holograma Mark 42 e Reator Ark online.',
    },
    {
      id: 'init_2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'speech_out',
      text: 'Olá Romildo espero que esteja tudo bem com você. Em que posso ajudar agora?',
    },
  ]);

  // Memory
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);

  // Telemetry simulation
  const [reactorPower, setReactorPower] = useState(3.18);
  const [reactorTemp, setReactorTemp] = useState(312.4);

  // Active audio player ref for Fish Audio
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback to Web Speech Synthesis if audio stream cannot be fetched
  const fallbackWebSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAvatarState('IDLE');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith('pt') ||
            v.name.includes('Luciana') ||
            v.name.includes('Felipe') ||
            v.name.includes('Francisca') ||
            v.lang === 'pt-BR' ||
            v.lang === 'pt-PT'
        ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.lang = 'pt-BR';

      setAvatarState('SPEAKING');

      utterance.onend = () => {
        setAvatarState('IDLE');
        setAudioLevel(0);
      };

      utterance.onerror = () => {
        setAvatarState('IDLE');
        setAudioLevel(0);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setAvatarState('IDLE');
    }
  };

  // Speak text with Fish Audio (default voice 82d13948027e4be69892dd3d0104e681)
  const speakText = async (text: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setAvatarState('SPEAKING');

      // Call Fish Audio TTS proxy
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        // Drive avatar lip sync while Fish Audio plays
        const interval = setInterval(() => {
          if (!currentAudioRef.current || currentAudioRef.current.paused || currentAudioRef.current.ended) {
            clearInterval(interval);
            setAudioLevel(0);
            return;
          }
          setAudioLevel(0.35 + Math.random() * 0.5);
        }, 75);

        audio.onended = () => {
          clearInterval(interval);
          setAvatarState('IDLE');
          setAudioLevel(0);
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        };

        audio.onerror = () => {
          clearInterval(interval);
          fallbackWebSpeech(text);
        };

        await audio.play();
      } else {
        fallbackWebSpeech(text);
      }
    } catch {
      fallbackWebSpeech(text);
    }
  };

  // Dynamic user greeting function
  const triggerUserGreeting = (userObj: User | null) => {
    const targetName = userObj?.fullName || userObj?.username || 'Romildo';
    const cleanName = targetName.split(' ')[0];
    const greeting = `Olá ${cleanName} espero que esteja tudo bem com você. Em que posso ajudar agora?`;

    setLogs((prev) => [
      ...prev,
      {
        id: `greet_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'speech_out',
        text: greeting,
      },
    ]);

    speakText(greeting);
  };

  // Load memory from server on start and speak initial greeting for active user
  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => {
        if (data.facts) setMemoryFacts(data.facts);
      })
      .catch(() => {});

    // Boot chime sound
    sounds.playBoot();

    // Initial voice greeting for logged-in user
    const greetingTimer = setTimeout(() => {
      triggerUserGreeting(currentUser);
    }, 1200);

    return () => clearTimeout(greetingTimer);
  }, []);

  // Update telemetry continuously
  useEffect(() => {
    const timer = setInterval(() => {
      setReactorPower(+(3.15 + Math.random() * 0.08).toFixed(2));
      setReactorTemp(+(312 + Math.random() * 0.9).toFixed(1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync avatar state
  useEffect(() => {
    if (isSleeping) {
      setAvatarState('SLEEPING');
    } else if (isThinking) {
      setAvatarState('THINKING');
    } else if (isListening) {
      setAvatarState('LISTENING');
    } else if (avatarState === 'SPEAKING') {
      // Kept while speaking
    } else {
      setAvatarState('IDLE');
    }
  }, [isSleeping, isThinking, isListening]);

  // WebSocket for real-time events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'tool' || data.type === 'system') {
            setLogs((prev) => [
              ...prev,
              {
                id: `ws_${Date.now()}_${Math.random()}`,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                type: data.type === 'tool' ? 'tool' : 'system',
                text: data.text,
              },
            ]);
          }
        } catch {}
      };
    } catch {}

    return () => {
      ws?.close();
    };
  }, []);

  // Transmit command to backend with logged-in user's name
  const handleSendCommand = async (cmdText: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const activeUserName = currentUser?.fullName || currentUser?.username || 'Romildo';

    // Log user speech/command
    setLogs((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        timestamp,
        type: 'speech_in',
        text: cmdText,
      },
    ]);

    setIsThinking(true);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cmdText,
          userName: activeUserName,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.spoken) {
        // Log Jarvis reply
        setLogs((prev) => [
          ...prev,
          {
            id: `jarvis_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'speech_out',
            text: data.spoken,
          },
        ]);

        speakText(data.spoken);
      }

      // Check for HUD overlays in payload
      if (data.hudOverlay) {
        if (data.hudOverlay.type === 'video') {
          setVideoOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'quiz') {
          setQuizOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'review') {
          setReviewOverlay(data.hudOverlay.data);
        } else if (data.hudOverlay.type === 'content') {
          setContentOverlay(data.hudOverlay.data);
        }
      }
    } catch (err: any) {
      setIsThinking(false);
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          text: `Command error: ${err.message || 'Falha na transmissão'}`,
        },
      ]);
    }
  };

  // Auth handler
  const handleLoginSuccess = (session: AuthSession) => {
    setCurrentUser(session.user);
    try {
      localStorage.setItem('reatorark_session', JSON.stringify(session));
    } catch {}

    setLogs((prev) => [
      ...prev,
      {
        id: `login_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        text: `Sessão autorizada para ${session.user.fullName} (@${session.user.username}) [${session.user.role}].`,
      },
    ]);

    // Greet user dynamically upon login
    setTimeout(() => {
      triggerUserGreeting(session.user);
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem('reatorark_session');
    sounds.playClick();
    setIsAuthModalOpen(true);
  };

  // Add memory fact
  const handleAddFact = async (fact: Omit<MemoryFact, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fact),
      });
      const data = await res.json();
      if (data.fact) {
        setMemoryFacts((prev) => [...prev, data.fact]);
      }
    } catch {}
  };

  // Delete memory fact
  const handleDeleteFact = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      setMemoryFacts((prev) => prev.filter((f) => f.id !== id));
    } catch {}
  };

  // Run skill directly
  const handleRunSkill = async (skillId: string, param: string) => {
    await handleSendCommand(`${skillId} ${param}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#00060a] text-[#8ffcff] overflow-hidden select-none font-mono">
      {/* Top Header */}
      <HudHeader
        engineMode={engineMode}
        onToggleDrawer={(drawer) => setActiveDrawer(drawer)}
        activeDrawer={activeDrawer}
        isSleeping={isSleeping}
        onToggleSleep={() => setIsSleeping(!isSleeping)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdminCrud={() => setIsAdminCrudOpen(true)}
        onLogout={handleLogout}
      />

      {/* Mobile Responsive HUD View Switcher (Visible on mobile/tablets < lg) */}
      <div className="lg:hidden flex items-center justify-between px-2 py-1.5 bg-[#000d14] border-b border-[#0d3347] z-20 shrink-0 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sounds.playClick();
              setMobileHudView('hologram');
            }}
            className={`px-3 py-1.5 rounded text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
              mobileHudView === 'hologram'
                ? 'bg-[#00d4ff] text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                : 'bg-[#011520] text-[#3a8a9a] border border-[#0d3347]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HOLOGRAMA</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setMobileHudView('telemetry');
            }}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
              mobileHudView === 'telemetry'
                ? 'bg-[#00d4ff] text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                : 'bg-[#011520] text-[#3a8a9a] border border-[#0d3347]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>TELEMETRIA</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setMobileHudView('logs');
            }}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
              mobileHudView === 'logs'
                ? 'bg-[#00d4ff] text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                : 'bg-[#011520] text-[#3a8a9a] border border-[#0d3347]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>REGISTROS</span>
          </button>
        </div>

        {currentUser?.role === 'master_admin' && (
          <button
            onClick={() => {
              sounds.playClick();
              setIsAdminCrudOpen(true);
            }}
            className="p-1.5 rounded bg-[#ff6b00]/20 text-[#ffaa00] border border-[#ff6b00]/40"
            title="Painel Master CRUD"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main HUD Body */}
      <div className="flex-1 flex overflow-hidden p-1.5 sm:p-2 gap-2 relative pb-16 sm:pb-0">
        {/* Left Telemetry Sidebar: Visible on desktop or when mobileHudView === 'telemetry' */}
        <div
          className={`${
            mobileHudView === 'telemetry' ? 'flex w-full absolute inset-0 z-10 bg-[#00060a] p-2' : 'hidden'
          } lg:relative lg:flex lg:w-64 flex-col gap-2 shrink-0 overflow-y-auto`}
        >
          {/* Reactor Energy Core Box */}
          <div className="p-3 bg-[#010d14]/90 border border-[#0d3347] rounded-lg">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#00d4ff] mb-2 pb-1 border-b border-[#0d3347]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#ffaa00]" />
                REATOR ARK MATRIX
              </span>
              <span className="text-[10px] text-[#00ff88]">100% OK</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">OUTPUT:</span>
                <span className="text-[#00ff88] font-bold">{reactorPower} GJ/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">THERMAL:</span>
                <span className="text-[#00d4ff] font-bold">{reactorTemp} K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">USUÁRIO ATIVO:</span>
                <span className="text-[#8ffcff] font-bold truncate max-w-[110px]">
                  {currentUser?.fullName || currentUser?.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3a8a9a] text-[11px]">SECURITY GATE:</span>
                <span className="text-[#00ff88] font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Reactor energy bar */}
            <div className="mt-2.5 h-1.5 w-full bg-[#001f2e] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] w-[94%]" />
            </div>
          </div>

          {/* Quick HUD Triggers */}
          <div className="p-3 bg-[#010d14]/90 border border-[#0d3347] rounded-lg flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#3a8a9a] uppercase block mb-2">
                ATALHOS TÁTICOS
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    handleSendCommand('clima em São Paulo');
                    if (window.innerWidth < 1024) setMobileHudView('hologram');
                  }}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <CloudSun className="w-3.5 h-3.5 text-[#00d4ff] shrink-0" />
                  <span>Verificar Clima</span>
                </button>

                <button
                  onClick={() => {
                    handleSendCommand('tocar Queen Bohemian Rhapsody no Youtube');
                    if (window.innerWidth < 1024) setMobileHudView('hologram');
                  }}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <Play className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
                  <span>Tocar Vídeo no YouTube</span>
                </button>

                <button
                  onClick={() => {
                    handleSendCommand('fazer um quiz sobre Tony Stark e o Reator Ark');
                    if (window.innerWidth < 1024) setMobileHudView('hologram');
                  }}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#ffaa00] shrink-0" />
                  <span>Questionário Interativo</span>
                </button>

                <button
                  onClick={() => {
                    handleSendCommand('executar revisão diagnóstica do sistema');
                    if (window.innerWidth < 1024) setMobileHudView('hologram');
                  }}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
                  <span>Diagnóstico do Sistema</span>
                </button>

                <button
                  onClick={() => {
                    handleSendCommand('rastrear voo LATAM 8084');
                    if (window.innerWidth < 1024) setMobileHudView('hologram');
                  }}
                  className="w-full text-left p-2 rounded bg-[#000a10] hover:bg-[#001f2e] border border-[#0d3347] hover:border-[#00d4ff]/40 text-xs font-mono text-[#8ffcff] flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <Plane className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                  <span>Rastrear Voo</span>
                </button>
              </div>
            </div>

            {/* Mobile close telemetry button */}
            <div className="lg:hidden mt-3 pt-2">
              <button
                onClick={() => setMobileHudView('hologram')}
                className="w-full py-2 bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff] rounded text-xs font-bold"
              >
                VOLTAR AO HOLOGRAMA
              </button>
            </div>
          </div>
        </div>

        {/* Center Stage: Holographic Mark 42 Screen & Arc Reactor (Always prominent and visible!) */}
        <div
          className={`${
            mobileHudView === 'hologram' ? 'flex' : 'hidden lg:flex'
          } flex-1 flex flex-col relative rounded-lg border border-[#0d3347] overflow-hidden bg-[#00060a] min-h-[300px]`}
        >
          <ArcReactorHolo
            state={avatarState}
            audioLevel={audioLevel}
          />

          {/* Overlays mounted inside HUD surface (Video, Quiz, Review, Content) */}
          <HudOverlays
            video={videoOverlay}
            onCloseVideo={() => setVideoOverlay(null)}
            quiz={quizOverlay}
            onCloseQuiz={(score) => {
              setQuizOverlay(null);
              if (score) {
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `quiz_score_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'system',
                    text: `Quiz finalizado: ${score.correct}/${score.total} respostas corretas.`,
                  },
                ]);
              }
            }}
            review={reviewOverlay}
            onCloseReview={() => setReviewOverlay(null)}
            content={contentOverlay}
            onCloseContent={() => setContentOverlay(null)}
          />
        </div>

        {/* Right Sidebar: HUD Activity Log: Visible on desktop or when mobileHudView === 'logs' */}
        <div
          className={`${
            mobileHudView === 'logs' ? 'flex w-full absolute inset-0 z-10 bg-[#00060a] p-2' : 'hidden'
          } lg:relative lg:flex lg:w-80 xl:w-96 flex-col shrink-0`}
        >
          <ActivityLog
            logs={logs}
            onClear={() => setLogs([])}
          />
          <div className="lg:hidden mt-2">
            <button
              onClick={() => setMobileHudView('hologram')}
              className="w-full py-2 bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff] rounded text-xs font-bold"
            >
              VOLTAR AO HOLOGRAMA
            </button>
          </div>
        </div>

        {/* Slide-out Drawers */}
        {activeDrawer === 'engine' && (
          <EngineDrawer
            currentEngine={engineMode === 'gemini' ? 'gemini_live' : 'ollama_local'}
            onSelectEngine={(e) => setEngineMode(e.startsWith('gemini') ? 'gemini' : 'local')}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'skills' && (
          <SkillsDrawer
            onRunSkill={handleRunSkill}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'memory' && (
          <MemoryDrawer
            facts={memoryFacts}
            onAddFact={handleAddFact}
            onDeleteFact={handleDeleteFact}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'controls' && (
          <ControlsDrawer
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
            isSleeping={isSleeping}
            onToggleSleep={() => setIsSleeping(!isSleeping)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'setup' && (
          <ControlsDrawer
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
            isSleeping={isSleeping}
            onToggleSleep={() => setIsSleeping(!isSleeping)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'remote' && (
          <RemoteDashboardModal
            onClose={() => setActiveDrawer(null)}
            onSendCommand={handleSendCommand}
          />
        )}

        {/* Auth Modal (Login / Register / Admin Master) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Admin Master CRUD Modal (Users & Database) */}
        <AdminCrudModal
          isOpen={isAdminCrudOpen}
          onClose={() => setIsAdminCrudOpen(false)}
          currentUser={currentUser}
        />
      </div>

      {/* Bottom Voice Control Bar (Fixed and visible on mobile, docked on desktop) */}
      <VoiceControlBar
        onSendCommand={handleSendCommand}
        isListening={isListening}
        setIsListening={setIsListening}
        isThinking={isThinking}
        wakeWordEnabled={wakeWordEnabled}
        onToggleWakeWord={() => setWakeWordEnabled(!wakeWordEnabled)}
        onAudioLevelChange={(lvl) => setAudioLevel(lvl)}
      />
    </div>
  );
};

export default App;
