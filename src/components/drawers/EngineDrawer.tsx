import React, { useState } from 'react';
import { Cpu, Check, Sliders, Shield, Zap, Sparkles, Server } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface EngineDrawerProps {
  currentEngine: string;
  onSelectEngine: (engine: string) => void;
  onClose: () => void;
}

export const EngineDrawer: React.FC<EngineDrawerProps> = ({
  currentEngine,
  onSelectEngine,
  onClose,
}) => {
  const [sttProvider, setSttProvider] = useState('browser');
  const [ttsProvider, setTtsProvider] = useState('fish_audio');
  const [toolBudget, setToolBudget] = useState(38);
  const [filterReasoning, setFilterReasoning] = useState(true);
  const [selfEchoGuard, setSelfEchoGuard] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const engines = [
    {
      id: 'gemini_live',
      name: 'Gemini 3.1 Flash Live',
      tier: 'Fastest (0.3s TTFW)',
      desc: 'Native bidirectional audio streaming & live tool calling. Zero local compute.',
      type: 'CLOUD',
    },
    {
      id: 'gemini_flash',
      name: 'Gemini 3.5 Flash',
      tier: 'Standard Cloud',
      desc: 'Nine-model fallback ladder with automatic cooldowns on 429/503.',
      type: 'CLOUD',
    },
    {
      id: 'ollama_local',
      name: 'Ollama / Local LLM (127.0.0.1)',
      tier: 'Offline / Private',
      desc: 'Runs on CPU/GPU via OpenAI-compatible endpoint. Tool budget enforced.',
      type: 'LOCAL',
    },
    {
      id: 'openai_compat',
      name: 'OpenAI / DeepSeek / Groq',
      tier: 'Stateless Chat API',
      desc: 'Custom address & key. Reasoning tags (<think>) auto-filtered from voice.',
      type: 'REMOTE',
    },
  ];

  const handleSave = () => {
    sounds.playAcknowledge();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="absolute top-12 right-0 bottom-14 w-full sm:w-96 bg-[#010d14]/95 border-l border-[#0d3347] z-30 p-4 overflow-y-auto flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3347] mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00d4ff]" />
            <h2 className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase font-mono">
              ENGINE &amp; PROVIDERS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#3a8a9a] hover:text-[#8ffcff] font-mono"
          >
            [CLOSE]
          </button>
        </div>

        {/* Engine Switcher */}
        <div className="space-y-2 mb-5">
          <label className="text-[10px] font-mono text-[#3a8a9a] uppercase tracking-wider block">
            CORE LANGUAGE ENGINE
          </label>
          {engines.map((eng) => (
            <div
              key={eng.id}
              onClick={() => {
                sounds.playClick();
                onSelectEngine(eng.id);
              }}
              className={`p-3 rounded border cursor-pointer transition-all ${
                currentEngine === eng.id
                  ? 'bg-[#001f2e] border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                  : 'bg-[#000a10] border-[#0d3347] hover:border-[#00d4ff]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ffffff] font-mono">{eng.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  eng.type === 'LOCAL' ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#002b1f]' : 'text-[#00d4ff] border-[#00d4ff]/30 bg-[#001f2e]'
                }`}>
                  {eng.type}
                </span>
              </div>
              <p className="text-[11px] text-[#3a8a9a] mt-1 leading-snug">{eng.desc}</p>
              <div className="text-[10px] text-[#00d4ff]/80 font-mono mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{eng.tier}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Audio Pipeline Config */}
        <div className="space-y-4 mb-5 p-3 rounded bg-[#000a10] border border-[#0d3347]">
          <div>
            <label className="text-[10px] font-mono text-[#3a8a9a] uppercase tracking-wider block mb-1.5">
              SPEECH-TO-TEXT (STT)
            </label>
            <select
              value={sttProvider}
              onChange={(e) => setSttProvider(e.target.value)}
              className="w-full bg-[#010d14] border border-[#0d3347] text-xs font-mono text-[#8ffcff] rounded p-2 outline-none focus:border-[#00d4ff]"
            >
              <option value="browser">Browser Native Web Speech (Ultra low latency)</option>
              <option value="whisper">Whisper Local CPU (~50 languages offline)</option>
              <option value="gemini_live">Gemini Native Audio Stream</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#3a8a9a] uppercase tracking-wider block mb-1.5">
              TEXT-TO-SPEECH (TTS)
            </label>
            <select
              value={ttsProvider}
              onChange={(e) => setTtsProvider(e.target.value)}
              className="w-full bg-[#010d14] border border-[#0d3347] text-xs font-mono text-[#8ffcff] rounded p-2 outline-none focus:border-[#00d4ff]"
            >
              <option value="fish_audio">Fish Audio Neural (Voice ID: 82d13948027e - Default)</option>
              <option value="jarvis_neural">Jarvis Neural Voice (Synthesizer fallback)</option>
              <option value="piper">Piper Neural Offline (Fast local voice)</option>
              <option value="elevenlabs">ElevenLabs Custom Voice API</option>
            </select>
          </div>
        </div>

        {/* Mark LVI Guards & Budgets */}
        <div className="space-y-3 mb-4 p-3 rounded bg-[#000a10] border border-[#0d3347]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#8ffcff] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00ff88]" />
              Self-Echo Guard
            </span>
            <input
              type="checkbox"
              checked={selfEchoGuard}
              onChange={(e) => setSelfEchoGuard(e.target.checked)}
              className="accent-[#00d4ff]"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#8ffcff] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ffaa00]" />
              Filter &lt;think&gt; Reasoning
            </span>
            <input
              type="checkbox"
              checked={filterReasoning}
              onChange={(e) => setFilterReasoning(e.target.checked)}
              className="accent-[#00d4ff]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-[#3a8a9a] mb-1">
              <span>TOOL BUDGET LIMIT:</span>
              <span className="text-[#00d4ff] font-bold">{toolBudget} TOOLS</span>
            </div>
            <input
              type="range"
              min="8"
              max="45"
              value={toolBudget}
              onChange={(e) => setToolBudget(Number(e.target.value))}
              className="w-full accent-[#00d4ff]"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2.5 rounded bg-[#00d4ff] hover:bg-[#33ddff] text-black font-mono font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] mt-2"
      >
        {savedNotice ? 'CONFIGURATION APPLIED' : 'APPLY CONFIGURATION'}
      </button>
    </div>
  );
};
