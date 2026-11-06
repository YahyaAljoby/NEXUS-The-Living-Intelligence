import React, { useState } from 'react';
import { EntityState } from '../types/simulation';
import { FACTION_DEFINITIONS } from '../simulation/factions';
import { Sparkles, Zap, Brain, MessageSquare, History, Users } from 'lucide-react';

interface EntityDetailCardProps {
  entity: EntityState;
  onWhisper: (entityId: string, message: string) => void;
  onFocus: (x: number, z: number) => void;
  onClose: () => void;
}

export const EntityDetailCard: React.FC<EntityDetailCardProps> = ({
  entity,
  onWhisper,
  onFocus,
  onClose,
}) => {
  const [whisperInput, setWhisperInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'mind' | 'memories' | 'social'>('mind');

  const faction = FACTION_DEFINITIONS[entity.factionId];

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperInput.trim()) return;
    onWhisper(entity.id, whisperInput.trim());
    setWhisperInput('');
  };

  const traitList = [
    { label: 'Curiosity', value: entity.traits.curiosity, color: 'bg-cyan-400' },
    { label: 'Altruism', value: entity.traits.altruism, color: 'bg-emerald-400' },
    { label: 'Aggression', value: entity.traits.aggression, color: 'bg-rose-400' },
    { label: 'Ambition', value: entity.traits.ambition, color: 'bg-amber-400' },
    { label: 'Rationality', value: entity.traits.rationality, color: 'bg-blue-400' },
    { label: 'Spiritualism', value: entity.traits.spiritualism, color: 'bg-purple-400' },
    { label: 'Adaptability', value: entity.traits.adaptability, color: 'bg-teal-400' },
  ];

  return (
    <div className="w-full text-slate-100 flex flex-col gap-3">
      {/* Header Profile */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center font-bold text-slate-950 font-mono text-base shadow"
            style={{ backgroundColor: faction?.color || '#38bdf8' }}
          >
            {faction?.emblem || '◈'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-wide text-white">{entity.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                Gen {entity.generation}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                {entity.role}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span style={{ color: faction?.color }}>{faction?.name}</span>
              <span>·</span>
              <span className="font-mono">Age: {entity.age}/{entity.lifespan}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onFocus(entity.x, entity.z)}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded transition-colors"
          >
            Center Cam
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Live Consciousness Stream */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 flex items-start gap-2.5">
        <Brain className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Thought</div>
          <div className="text-xs text-cyan-100 italic font-mono mt-0.5">
            "{entity.thoughtBubble}"
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase text-slate-400">Energy</div>
          <div className="text-xs font-mono font-bold text-amber-400 tabular-nums">
            {Math.round(entity.energy)}/{entity.maxEnergy}
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveSubTab('mind')}
          className={`flex items-center gap-1.5 py-1 px-3 border-b-2 transition-colors ${
            activeSubTab === 'mind' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Traits</span>
        </button>
        <button
          onClick={() => setActiveSubTab('memories')}
          className={`flex items-center gap-1.5 py-1 px-3 border-b-2 transition-colors ${
            activeSubTab === 'memories' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Memories ({entity.memories.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('social')}
          className={`flex items-center gap-1.5 py-1 px-3 border-b-2 transition-colors ${
            activeSubTab === 'social' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Social ({Object.keys(entity.relationships).length})</span>
        </button>
      </div>

      {/* Sub Tab Content */}
      <div className="max-h-36 overflow-y-auto pr-1">
        {activeSubTab === 'mind' && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {traitList.map((t) => (
              <div key={t.label} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>{t.label}</span>
                  <span className="tabular-nums">{(t.value * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color}`} style={{ width: `${t.value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'memories' && (
          <div className="flex flex-col gap-1.5">
            {entity.memories.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono">No episodic memories formed yet.</span>
            ) : (
              entity.memories.map((m) => (
                <div key={m.id} className="text-xs font-mono p-1.5 bg-slate-900/60 rounded border border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-slate-200">{m.description}</span>
                  <span className={`text-[10px] ml-2 shrink-0 ${m.valence >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.valence > 0 ? `+${(m.valence * 10).toFixed(0)}` : (m.valence * 10).toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'social' && (
          <div className="flex flex-col gap-1.5">
            {Object.keys(entity.relationships).length === 0 ? (
              <span className="text-xs text-slate-500 font-mono">Isolated node; has not formed mutual links.</span>
            ) : (
              Object.entries(entity.relationships).map(([targetId, rel]) => (
                <div key={targetId} className="text-xs font-mono p-1.5 bg-slate-900/60 rounded border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-300 truncate max-w-[150px]">Entity {targetId}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">Fam: {(rel.familiarity * 100).toFixed(0)}%</span>
                    <span className={`text-[10px] font-bold ${rel.trust >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      Trust: {(rel.trust * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Divine Whisper Interaction */}
      <form onSubmit={handleSendWhisper} className="flex items-center gap-2 pt-1 border-t border-slate-800">
        <input
          type="text"
          value={whisperInput}
          onChange={(e) => setWhisperInput(e.target.value)}
          placeholder="Whisper inspiration to this mind..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!whisperInput.trim()}
          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Whisper</span>
        </button>
      </form>
    </div>
  );
};
