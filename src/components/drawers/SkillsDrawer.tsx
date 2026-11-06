import React, { useState } from 'react';
import {
  Puzzle,
  Play,
  Activity,
  CloudSun,
  Search,
  Video,
  Plane,
  FileText,
  Clock,
  Code,
  Monitor,
  Gamepad2,
  Send,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface SkillItem {
  id: string;
  name: string;
  category: 'ACTIONS' | 'PLUGINS';
  description: string;
  icon: any;
  defaultParam: string;
  paramPlaceholder: string;
}

interface SkillsDrawerProps {
  onRunSkill: (skillId: string, param: string) => Promise<void>;
  onClose: () => void;
}

export const SkillsDrawer: React.FC<SkillsDrawerProps> = ({ onRunSkill, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIONS' | 'PLUGINS'>('ALL');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [paramInput, setParamInput] = useState('');
  const [running, setRunning] = useState(false);

  const skills: SkillItem[] = [
    {
      id: 'system_monitor',
      name: 'System Monitor',
      category: 'ACTIONS',
      description: 'Checks CPU load, RAM usage, thermal telemetry, and battery level.',
      icon: Activity,
      defaultParam: 'all',
      paramPlaceholder: 'Metric or all (e.g. cpu, ram, battery)',
    },
    {
      id: 'weather_report',
      name: 'Weather Report',
      category: 'ACTIONS',
      description: 'Fetches live conditions, temperature, humidity, and atmospheric pressure.',
      icon: CloudSun,
      defaultParam: 'Tokyo, Japan',
      paramPlaceholder: 'City or coordinates (e.g. London, New York)',
    },
    {
      id: 'web_search',
      name: 'Web Search',
      category: 'ACTIONS',
      description: 'Performs live internet queries with untrusted external content tags.',
      icon: Search,
      defaultParam: 'James Webb space telescope newest discoveries',
      paramPlaceholder: 'Search query string',
    },
    {
      id: 'video_player',
      name: 'HUD Video Player',
      category: 'ACTIONS',
      description: 'Plays YouTube streams or direct video URLs right in the central HUD display.',
      icon: Video,
      defaultParam: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      paramPlaceholder: 'YouTube link or video query',
    },
    {
      id: 'flight_finder',
      name: 'Flight Finder',
      category: 'ACTIONS',
      description: 'Tracks commercial aircraft status, origin, destination, ETA, and altitude.',
      icon: Plane,
      defaultParam: 'AA100',
      paramPlaceholder: 'Flight number (e.g. UA858, AF006)',
    },
    {
      id: 'code_helper',
      name: 'Code Diagnostics & Helper',
      category: 'ACTIONS',
      description: 'Inspects syntax, validates imports, and executes dev-agent code checks.',
      icon: Code,
      defaultParam: 'function verifyQuantumMesh() { return true; }',
      paramPlaceholder: 'Code snippet or function name',
    },
    {
      id: 'file_processor',
      name: 'File Controller',
      category: 'ACTIONS',
      description: 'Safely reads, organizes, and inspects files in the workspace with undo logs.',
      icon: FileText,
      defaultParam: 'workspace_manifest.json',
      paramPlaceholder: 'Target filename or path',
    },
    {
      id: 'reminder',
      name: 'Reminder & Timer',
      category: 'ACTIONS',
      description: 'Sets contextual alarms, countdowns, and schedule notifications.',
      icon: Clock,
      defaultParam: '10 minutes: Review telemetry logs',
      paramPlaceholder: 'Time and reminder description',
    },
    {
      id: 'computer_settings',
      name: 'Computer Settings',
      category: 'ACTIONS',
      description: 'Controls volume, brightness, power state, and reads back changes.',
      icon: Monitor,
      defaultParam: 'volume 85',
      paramPlaceholder: 'Setting (e.g. volume 75, dark_mode on)',
    },
    {
      id: 'game_updater',
      name: 'Game Updater',
      category: 'PLUGINS',
      description: 'Scans game libraries and updates patches in the background.',
      icon: Gamepad2,
      defaultParam: 'scan',
      paramPlaceholder: 'Action (scan, update, verify)',
    },
    {
      id: 'send_message',
      name: 'Send Message Guard',
      category: 'PLUGINS',
      description: 'Safe outbound dispatcher for notifications and message drafting.',
      icon: Send,
      defaultParam: 'All systems operational, Mark LVI online.',
      paramPlaceholder: 'Message payload',
    },
    {
      id: 'proactive',
      name: 'Proactive Alert Engine',
      category: 'PLUGINS',
      description: 'Autonomous health check monitor that advises before system thresholds trip.',
      icon: Sparkles,
      defaultParam: 'check_thresholds',
      paramPlaceholder: 'Check mode',
    },
  ];

  const filtered = skills.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.category === activeTab;
  });

  const handleSelectSkill = (s: SkillItem) => {
    sounds.playClick();
    setSelectedSkill(s);
    setParamInput(s.defaultParam);
  };

  const handleExecute = async () => {
    if (!selectedSkill || running) return;
    setRunning(true);
    sounds.playAcknowledge();
    try {
      await onRunSkill(selectedSkill.id, paramInput);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="absolute top-12 right-0 bottom-14 w-full sm:w-[420px] bg-[#010d14]/95 border-l border-[#0d3347] z-30 p-4 overflow-y-auto flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3347] mb-3">
          <div className="flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-[#ffaa00]" />
            <h2 className="text-xs font-bold tracking-widest text-[#ffaa00] uppercase font-mono">
              SKILLS &amp; PLUGINS CATALOG
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#3a8a9a] hover:text-[#8ffcff] font-mono"
          >
            [CLOSE]
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-3">
          {(['ALL', 'ACTIONS', 'PLUGINS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab);
              }}
              className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded border transition-colors ${
                activeTab === tab
                  ? 'bg-[#ffaa00]/20 text-[#ffaa00] border-[#ffaa00] font-bold'
                  : 'bg-[#000a10] text-[#3a8a9a] border-[#0d3347] hover:text-[#8ffcff]'
              }`}
            >
              {tab} ({skills.filter((s) => tab === 'ALL' || s.category === tab).length})
            </button>
          ))}
        </div>

        {/* Skill list */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((skill) => {
            const Icon = skill.icon;
            const isSelected = selectedSkill?.id === skill.id;
            return (
              <div
                key={skill.id}
                onClick={() => handleSelectSkill(skill)}
                className={`p-2.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#001f2e] border-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                    : 'bg-[#000a10] border-[#0d3347] hover:border-[#00d4ff]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#00d4ff]" />
                    <span className="text-xs font-bold text-[#ffffff] font-mono">
                      {skill.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    skill.category === 'ACTIONS' ? 'text-[#00d4ff] border-[#00d4ff]/30 bg-[#001f2e]' : 'text-[#ffaa00] border-[#ffaa00]/30 bg-[#2b1900]'
                  }`}>
                    {skill.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#3a8a9a] mt-1 leading-snug">
                  {skill.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution panel for selected skill */}
      {selectedSkill && (
        <div className="mt-4 p-3 rounded bg-[#000a10] border border-[#00d4ff]/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#00d4ff] font-mono uppercase">
              EXECUTE // {selectedSkill.name}
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-[#00ff88]" />
          </div>

          <label className="text-[10px] font-mono text-[#3a8a9a] block mb-1">
            PARAMETERS:
          </label>
          <input
            type="text"
            value={paramInput}
            onChange={(e) => setParamInput(e.target.value)}
            placeholder={selectedSkill.paramPlaceholder}
            className="w-full bg-[#010d14] border border-[#0d3347] focus:border-[#00d4ff] text-xs font-mono text-[#8ffcff] rounded p-2 outline-none mb-3"
          />

          <button
            onClick={handleExecute}
            disabled={running}
            className="w-full py-2 rounded bg-[#00d4ff] hover:bg-[#33ddff] text-black font-mono font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(0,212,255,0.3)] cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{running ? 'TRANSMITTING COMMAND...' : 'RUN ACTION'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
