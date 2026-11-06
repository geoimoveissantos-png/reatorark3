import React from 'react';
import { Sliders, Radio, Bell, Moon, Sun, Volume2, ShieldAlert, Cpu } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface ControlsDrawerProps {
  wakeWordEnabled: boolean;
  onToggleWakeWord: () => void;
  isSleeping: boolean;
  onToggleSleep: () => void;
  onClose: () => void;
}

export const ControlsDrawer: React.FC<ControlsDrawerProps> = ({
  wakeWordEnabled,
  onToggleWakeWord,
  isSleeping,
  onToggleSleep,
  onClose,
}) => {
  return (
    <div className="absolute top-12 right-0 bottom-14 w-full sm:w-96 bg-[#010d14]/95 border-l border-[#0d3347] z-30 p-4 overflow-y-auto flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3347] mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00ff88]" />
            <h2 className="text-xs font-bold tracking-widest text-[#00ff88] uppercase font-mono">
              HUD CONTROLS &amp; SWITCHES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#3a8a9a] hover:text-[#8ffcff] font-mono"
          >
            [CLOSE]
          </button>
        </div>

        <div className="space-y-3">
          {/* Wake Word */}
          <div className="p-3 rounded bg-[#000a10] border border-[#0d3347] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00ff88]" />
                <span className="text-xs font-bold font-mono text-[#ffffff]">"HEY JARVIS" WAKE WORD</span>
              </div>
              <p className="text-[10px] text-[#3a8a9a] mt-0.5">Listens for trigger keyword</p>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onToggleWakeWord();
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider border transition-colors ${
                wakeWordEnabled
                  ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]'
                  : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347]'
              }`}
            >
              {wakeWordEnabled ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          {/* Sleep / Awake */}
          <div className="p-3 rounded bg-[#000a10] border border-[#0d3347] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {isSleeping ? <Moon className="w-4 h-4 text-[#3a8a9a]" /> : <Sun className="w-4 h-4 text-[#ffaa00]" />}
                <span className="text-xs font-bold font-mono text-[#ffffff]">SYSTEM POWER STATE</span>
              </div>
              <p className="text-[10px] text-[#3a8a9a] mt-0.5">
                {isSleeping ? 'Jarvis is resting (eyes closed, mic idle)' : 'Jarvis is fully awake & monitoring'}
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onToggleSleep();
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider border transition-colors ${
                isSleeping
                  ? 'bg-[#2b000a] text-[#ff3355] border-[#ff3355]'
                  : 'bg-[#002b1f] text-[#00ff88] border-[#00ff88]'
              }`}
            >
              {isSleeping ? 'SLEEP' : 'AWAKE'}
            </button>
          </div>

          {/* Instant Acknowledgment */}
          <div className="p-3 rounded bg-[#000a10] border border-[#0d3347] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-xs font-bold font-mono text-[#ffffff]">INSTANT ACKNOWLEDGMENT</span>
              </div>
              <p className="text-[10px] text-[#3a8a9a] mt-0.5">Speaks short confirmation before task</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#00d4ff]">ENABLED</span>
          </div>

          {/* Safe Confirmation Gate */}
          <div className="p-3 rounded bg-[#000a10] border border-[#0d3347] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ffaa00]" />
                <span className="text-xs font-bold font-mono text-[#ffffff]">CONFIRMATION GATE</span>
              </div>
              <p className="text-[10px] text-[#3a8a9a] mt-0.5">Irreversible actions require user click</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#00ff88]">LOCKED</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded bg-[#000a10] border border-[#0d3347] text-[10px] font-mono text-[#3a8a9a]">
        <div className="flex items-center gap-1.5 text-[#00d4ff] font-bold mb-1">
          <Cpu className="w-3.5 h-3.5" />
          <span>REATOR ARK RUNTIME</span>
        </div>
        <div>Vite + React SPA with full-stack Node.js server. Host 0.0.0.0:3000.</div>
      </div>
    </div>
  );
};
