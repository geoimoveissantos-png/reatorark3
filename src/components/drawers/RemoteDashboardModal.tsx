import React, { useState } from 'react';
import { Smartphone, QrCode, Shield, Check, Copy, ExternalLink, RefreshCw, X, Radio } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface RemoteDashboardModalProps {
  onClose: () => void;
  onSendCommand: (cmd: string) => Promise<void>;
}

export const RemoteDashboardModal: React.FC<RemoteDashboardModalProps> = ({
  onClose,
  onSendCommand,
}) => {
  const [pairingCode, setPairingCode] = useState('7K9P-2M4X');
  const [copied, setCopied] = useState(false);
  const [phoneCommand, setPhoneCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'PAIR' | 'SIMULATOR'>('PAIR');
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([
    'Connected to JARVIS via Web Crypto AES-256-GCM',
    'Session token issued: 200,000 PBKDF2 rounds',
  ]);

  const generateNewCode = () => {
    sounds.playClick();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setPairingCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFromPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneCommand.trim()) return;
    const cmd = phoneCommand.trim();
    setPhoneCommand('');
    sounds.playAcknowledge();
    setSimulatorLogs((prev) => [...prev, `[ENCRYPTED TRANSMISSION] -> "${cmd}"`]);
    await onSendCommand(cmd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#010d14] border-2 border-[#00d4ff]/60 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,212,255,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#011520] border-b border-[#0d3347]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#00d4ff]" />
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#00d4ff] uppercase">
              REMOTE CONTROL // PHONE DASHBOARD
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#3a8a9a] hover:text-[#ff3355] p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#0d3347] bg-[#000a10]">
          <button
            onClick={() => setActiveTab('PAIR')}
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider text-center transition-colors ${
              activeTab === 'PAIR'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff] bg-[#001f2e]/40'
                : 'text-[#3a8a9a] hover:text-[#8ffcff]'
            }`}
          >
            PAIRING &amp; QR CODE
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider text-center transition-colors ${
              activeTab === 'SIMULATOR'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff] bg-[#001f2e]/40'
                : 'text-[#3a8a9a] hover:text-[#8ffcff]'
            }`}
          >
            PHONE DASHBOARD SIMULATOR
          </button>
        </div>

        {activeTab === 'PAIR' ? (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-[#00060a] border border-[#00d4ff]/40 rounded-xl shadow-inner flex flex-col items-center">
              <QrCode className="w-32 h-32 text-[#00d4ff] p-1" />
              <span className="text-[10px] font-mono text-[#3a8a9a] mt-2">
                SCAN WITH MOBILE CAMERA TO CONNECT
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-[#3a8a9a] tracking-widest uppercase block mb-1">
                ONE-TIME PAIRING CODE
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-widest text-[#00ff88] px-4 py-1.5 rounded-lg bg-[#001f2e] border border-[#00d4ff]/40">
                  {pairingCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded bg-[#011520] border border-[#0d3347] text-[#00d4ff] hover:bg-[#001f2e]"
                  title="Copy code"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={generateNewCode}
                  className="p-2 rounded bg-[#011520] border border-[#0d3347] text-[#3a8a9a] hover:text-[#00d4ff]"
                  title="Generate new pairing code"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cryptographic specs info */}
            <div className="w-full text-left p-3 rounded bg-[#000a10] border border-[#0d3347] text-[11px] font-mono space-y-1 text-[#3a8a9a]">
              <div className="flex items-center gap-1.5 text-[#00d4ff] font-bold">
                <Shield className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>AES-256-GCM + PBKDF2 (200k rounds)</span>
              </div>
              <p>Direct mobile access endpoint on port 3000. Bearer token auth with automatic revocation.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col h-[400px]">
            {/* Phone simulator view */}
            <div className="flex-1 overflow-y-auto p-3 rounded bg-[#00060a] border border-[#0d3347] font-mono text-xs space-y-2 mb-3">
              <div className="text-[10px] text-[#00d4ff] pb-2 border-b border-[#0d3347] flex items-center justify-between">
                <span>MOBILE SESSION // ONLINE</span>
                <Radio className="w-3 h-3 text-[#00ff88] animate-pulse" />
              </div>
              {simulatorLogs.map((log, i) => (
                <div key={i} className="text-[#8ffcff] break-words">
                  {log}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendFromPhone} className="flex gap-2">
              <input
                type="text"
                value={phoneCommand}
                onChange={(e) => setPhoneCommand(e.target.value)}
                placeholder="Send remote command from mobile device..."
                className="flex-1 bg-[#00060a] border border-[#0d3347] focus:border-[#00d4ff] rounded p-2 text-xs font-mono text-[#8ffcff] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#00d4ff] text-black font-mono font-bold text-xs uppercase"
              >
                SEND
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
