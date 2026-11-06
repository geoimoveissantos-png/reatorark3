import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Filter, Trash2, Copy, Check } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'speech_in' | 'speech_out' | 'tool' | 'system' | 'error';
  sender?: string;
  text: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogProps {
  logs: LogEntry[];
  onClear?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClear }) => {
  const [filter, setFilter] = useState<'ALL' | 'VOICE' | 'TOOLS' | 'SYSTEM'>('ALL');
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'VOICE') return log.type === 'speech_in' || log.type === 'speech_out';
    if (filter === 'TOOLS') return log.type === 'tool';
    if (filter === 'SYSTEM') return log.type === 'system' || log.type === 'error';
    return true;
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#010d14]/90 border border-[#0d3347] rounded overflow-hidden select-text">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#011520] border-b border-[#0d3347] select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase">
            HUD ACTIVITY LOG
          </span>
          <span className="text-[10px] text-[#3a8a9a] font-mono px-1.5 py-0.5 bg-[#001f2e] border border-[#0d3347] rounded">
            {filteredLogs.length} EVENTS
          </span>
        </div>

        {/* Filter & Actions */}
        <div className="flex items-center gap-1">
          {(['ALL', 'VOICE', 'TOOLS', 'SYSTEM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 text-[10px] tracking-wider rounded transition-colors ${
                filter === tab
                  ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 font-bold'
                  : 'text-[#3a8a9a] hover:text-[#8ffcff]'
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="h-3.5 w-px bg-[#0d3347] mx-1" />
          <button
            onClick={handleCopy}
            className="p-1 text-[#3a8a9a] hover:text-[#00d4ff] transition-colors rounded"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 text-[#3a8a9a] hover:text-[#ff3355] transition-colors rounded"
              title="Clear log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 scanlines">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#3a8a9a] text-[11px] tracking-widest">
            AWAITING TELEMETRY &amp; VOICE INPUT...
          </div>
        ) : (
          filteredLogs.map((log) => {
            let badgeBg = 'bg-[#001f2e] text-[#00d4ff] border-[#00d4ff]/30';
            let badgeText = 'SYS';
            let textColor = 'text-[#8ffcff]';

            if (log.type === 'speech_in') {
              badgeBg = 'bg-[#002b1f] text-[#00ff88] border-[#00ff88]/30';
              badgeText = 'USER';
              textColor = 'text-[#d8f8ff]';
            } else if (log.type === 'speech_out') {
              badgeBg = 'bg-[#1a0f30] text-[#a855f7] border-[#a855f7]/30';
              badgeText = 'JARVIS';
              textColor = 'text-[#8ffcff]';
            } else if (log.type === 'tool') {
              badgeBg = 'bg-[#2b1900] text-[#ffaa00] border-[#ffaa00]/30';
              badgeText = 'TOOL';
              textColor = 'text-[#ffcc00]';
            } else if (log.type === 'error') {
              badgeBg = 'bg-[#2b000a] text-[#ff3355] border-[#ff3355]/30';
              badgeText = 'ERR';
              textColor = 'text-[#ff3355]';
            }

            return (
              <div
                key={log.id}
                className="group flex items-start gap-2.5 p-1.5 rounded hover:bg-[#001420]/60 transition-colors"
              >
                <span className="text-[10px] text-[#3a8a9a] shrink-0 pt-0.5">
                  {log.timestamp}
                </span>
                <span
                  className={`text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${badgeBg}`}
                >
                  {badgeText}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`leading-relaxed break-words ${textColor}`}>
                    {log.text}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-1 p-1.5 bg-[#000d14] rounded border border-[#0d3347] text-[10px] text-[#3a8a9a] overflow-x-auto">
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
