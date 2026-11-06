import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface VoiceControlBarProps {
  onSendCommand: (text: string) => Promise<void>;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isThinking: boolean;
  wakeWordEnabled: boolean;
  onToggleWakeWord: () => void;
  onAudioLevelChange?: (level: number) => void;
}

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  onSendCommand,
  isListening,
  setIsListening,
  isThinking,
  wakeWordEnabled,
  onToggleWakeWord,
  onAudioLevelChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      setTranscriptPreview(interim || final);

      // Check for wake word: "Ei Jarvis", "Jarvis" or "Hey Jarvis"
      const lowerInterim = interim.toLowerCase();
      const lowerFinal = final.toLowerCase();
      if (
        wakeWordEnabled &&
        (lowerInterim.includes('ei jarvis') ||
          lowerInterim.includes('hey jarvis') ||
          lowerInterim.includes('jarvis') ||
          lowerFinal.includes('ei jarvis') ||
          lowerFinal.includes('hey jarvis') ||
          lowerFinal.includes('jarvis'))
      ) {
        sounds.playWake();
      }

      if (final.trim()) {
        const cmd = final.trim();
        setTranscriptPreview('');
        onSendCommand(cmd);
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [wakeWordEnabled, onSendCommand]);

  // Audio simulation level when listening
  useEffect(() => {
    if (!isListening) {
      onAudioLevelChange?.(0);
      return;
    }
    const interval = setInterval(() => {
      const simulatedLevel = 0.3 + Math.random() * 0.5;
      onAudioLevelChange?.(simulatedLevel);
    }, 100);
    return () => clearInterval(interval);
  }, [isListening, onAudioLevelChange]);

  // Toggle mic
  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      sounds.playClick();
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    } else {
      sounds.playWake();
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch {}
    }
  };

  // Keyboard shortcut Ctrl+Space for Push to talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isThinking) return;
    const text = inputText.trim();
    setInputText('');
    sounds.playAcknowledge();
    onSendCommand(text);
  };

  return (
    <div className="fixed sm:relative bottom-0 left-0 right-0 z-40 bg-[#00060a]/95 sm:bg-[#00060a] border-t border-[#0d3347] px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shrink-0 select-none backdrop-blur-md">
      {/* Push-to-Talk Mic Button (touch target >= 44px) */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={!speechSupported}
        className={`min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 rounded-lg font-mono text-xs tracking-wider border flex items-center justify-center gap-1.5 transition-all shrink-0 ${
          isListening
            ? 'bg-[#ff3355]/20 text-[#ff3355] border-[#ff3355] shadow-[0_0_15px_rgba(255,51,85,0.4)] animate-pulse'
            : 'bg-[#011520] text-[#00d4ff] border-[#0d3347] hover:border-[#00d4ff]/50 active:scale-95'
        }`}
        title="Push to talk (ou pressione Ctrl+Espaço)"
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 text-[#ff3355]" />
            <span className="font-bold text-[11px] sm:text-xs">MIC LIVE</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4 text-[#3a8a9a]" />
            <span className="text-[11px] sm:text-xs font-semibold">PTT</span>
          </>
        )}
      </button>

      {/* Wake Word Badge (visible on tablets/desktops) */}
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          onToggleWakeWord();
        }}
        className={`hidden md:flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-lg font-mono text-[10px] tracking-wider border transition-colors shrink-0 ${
          wakeWordEnabled
            ? 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/40'
            : 'bg-[#010d14] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
        }`}
        title="Detecção contínua pelo comando 'Ei Jarvis'"
      >
        <Radio className={`w-3.5 h-3.5 ${wakeWordEnabled ? 'animate-pulse text-[#00ff88]' : 'text-[#3a8a9a]'}`} />
        <span>"EI JARVIS"</span>
      </button>

      {/* Input Form & Realtime Transcript */}
      <form onSubmit={handleSubmit} className="flex-1 flex items-center relative min-w-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            transcriptPreview
              ? `Ouvindo: "${transcriptPreview}"`
              : 'Fale (PTT) ou digite um comando...'
          }
          disabled={isThinking}
          className="w-full min-h-[44px] h-11 bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] rounded-lg px-3.5 text-xs font-mono text-[#8ffcff] placeholder-[#3a8a9a] outline-none transition-colors shadow-inner"
        />

        {transcriptPreview && (
          <div className="absolute left-3.5 pointer-events-none text-xs font-mono text-[#00ff88] flex items-center gap-1.5 truncate max-w-[85%]">
            <Sparkles className="w-3 h-3 animate-spin text-[#00ff88]" />
            <span className="truncate">{transcriptPreview}</span>
          </div>
        )}
      </form>

      {/* Send Button (touch target >= 44px) */}
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!inputText.trim() || isThinking}
        className={`min-h-[44px] min-w-[44px] px-3 sm:px-4 rounded-lg font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all shrink-0 ${
          inputText.trim() && !isThinking
            ? 'bg-[#00d4ff] hover:bg-[#33ddff] text-black shadow-[0_0_12px_rgba(0,212,255,0.4)] cursor-pointer active:scale-95'
            : 'bg-[#011520] text-[#3a8a9a] border border-[#0d3347] cursor-not-allowed opacity-60'
        }`}
        title="Transmitir comando"
      >
        <Send className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">TRANSMITIR</span>
      </button>
    </div>
  );
};
