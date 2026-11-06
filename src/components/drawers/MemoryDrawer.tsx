import React, { useState } from 'react';
import { Brain, Search, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export interface MemoryFact {
  id: string;
  category: 'IDENTITY' | 'PREFERENCE' | 'PROJECT' | 'SYSTEM';
  key: string;
  value: string;
  updatedAt: string;
}

interface MemoryDrawerProps {
  facts: MemoryFact[];
  onAddFact: (fact: Omit<MemoryFact, 'id' | 'updatedAt'>) => void;
  onDeleteFact: (id: string) => void;
  onClose: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  facts,
  onAddFact,
  onDeleteFact,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<'IDENTITY' | 'PREFERENCE' | 'PROJECT' | 'SYSTEM'>('PREFERENCE');
  const [factKey, setFactKey] = useState('');
  const [factValue, setFactValue] = useState('');

  const filtered = facts.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.key.toLowerCase().includes(q) ||
      f.value.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!factKey.trim() || !factValue.trim()) return;
    sounds.playAcknowledge();
    onAddFact({
      category,
      key: factKey.trim(),
      value: factValue.trim(),
    });
    setFactKey('');
    setFactValue('');
    setShowAddForm(false);
  };

  const totalChars = facts.reduce((acc, curr) => acc + curr.key.length + curr.value.length, 0);

  return (
    <div className="absolute top-12 right-0 bottom-14 w-full sm:w-[420px] bg-[#010d14]/95 border-l border-[#0d3347] z-30 p-4 overflow-y-auto flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md select-none">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3347] mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#a855f7]" />
            <h2 className="text-xs font-bold tracking-widest text-[#a855f7] uppercase font-mono">
              MEMORY VAULT &amp; RECALL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#3a8a9a] hover:text-[#8ffcff] font-mono"
          >
            [CLOSE]
          </button>
        </div>

        {/* Telemetry stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 rounded bg-[#000a10] border border-[#0d3347]">
            <span className="text-[9px] font-mono text-[#3a8a9a] uppercase block">STORED FACTS</span>
            <span className="text-sm font-mono font-bold text-[#a855f7]">{facts.length} ITEMS</span>
          </div>
          <div className="p-2 rounded bg-[#000a10] border border-[#0d3347]">
            <span className="text-[9px] font-mono text-[#3a8a9a] uppercase block">PROMPT BUDGET</span>
            <span className="text-sm font-mono font-bold text-[#00d4ff]">{totalChars} BYTES</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#3a8a9a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recallable facts..."
            className="w-full bg-[#000a10] border border-[#0d3347] focus:border-[#a855f7] text-xs font-mono text-[#8ffcff] rounded-lg pl-9 pr-3 py-1.5 outline-none"
          />
        </div>

        {/* Add Fact Button */}
        <button
          onClick={() => {
            sounds.playClick();
            setShowAddForm(!showAddForm);
          }}
          className="w-full py-1.5 mb-3 rounded border border-[#a855f7]/40 bg-[#1a0f30]/40 text-[#a855f7] hover:bg-[#1a0f30] text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'CANCEL' : 'RECORD NEW FACT'}</span>
        </button>

        {showAddForm && (
          <form onSubmit={handleCreate} className="p-3 mb-3 rounded bg-[#000a10] border border-[#a855f7]/40 space-y-2">
            <div>
              <label className="text-[10px] font-mono text-[#3a8a9a] block mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#010d14] border border-[#0d3347] text-xs font-mono text-[#8ffcff] rounded p-1.5 outline-none"
              >
                <option value="PREFERENCE">PREFERENCE</option>
                <option value="IDENTITY">IDENTITY</option>
                <option value="PROJECT">PROJECT</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#3a8a9a] block mb-1">KEY / TOPIC</label>
              <input
                type="text"
                value={factKey}
                onChange={(e) => setFactKey(e.target.value)}
                placeholder="e.g. favorite_ide, primary_project"
                className="w-full bg-[#010d14] border border-[#0d3347] text-xs font-mono text-[#8ffcff] rounded p-1.5 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#3a8a9a] block mb-1">FACT VALUE</label>
              <textarea
                value={factValue}
                onChange={(e) => setFactValue(e.target.value)}
                placeholder="e.g. VS Code with high-contrast cyan theme"
                rows={2}
                className="w-full bg-[#010d14] border border-[#0d3347] text-xs font-mono text-[#8ffcff] rounded p-1.5 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-[#a855f7] hover:bg-[#b866ff] text-black font-mono font-bold text-xs uppercase"
            >
              SAVE TO MEMORY VAULT
            </button>
          </form>
        )}

        {/* Fact List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[#3a8a9a]">
              NO MATCHING MEMORY ENTRIES
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded bg-[#000a10] border border-[#0d3347] hover:border-[#a855f7]/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-[#8ffcff]">
                    {item.key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-[#1a0f30] text-[#a855f7] border-[#a855f7]/30">
                      {item.category}
                    </span>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onDeleteFact(item.id);
                      }}
                      className="text-[#3a8a9a] hover:text-[#ff3355] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete fact"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-mono text-[#3a8a9a] leading-relaxed break-words">
                  {item.value}
                </p>
                <span className="text-[9px] font-mono text-[#1a5c7a] block mt-1">
                  Learned: {item.updatedAt}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[#0d3347] flex items-center justify-between text-[10px] font-mono text-[#3a8a9a]">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#a855f7]" />
          Persistent storage active
        </span>
        <span>Mark LVI recall</span>
      </div>
    </div>
  );
};
