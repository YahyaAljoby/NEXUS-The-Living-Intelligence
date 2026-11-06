import React, { useState } from 'react';
import {
  PrimeDirectiveId,
  AnomalyInstance,
  ChronicleEntry,
  TechnologyItem,
  EntityState,
  FactionInfo,
  FactionId,
} from '../types/simulation';
import { ANOMALY_CATALOG } from '../simulation/anomalies';
import { FACTION_DEFINITIONS } from '../simulation/factions';
import { EntityDetailCard } from './EntityDetailCard';
import {
  Compass,
  Zap,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Brain,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BottomDockProps {
  activeDirective: PrimeDirectiveId;
  onSetDirective: (directive: PrimeDirectiveId) => void;
  architectPoints: number;
  onSelectAnomalyForPlacement: (type: AnomalyInstance['type']) => void;
  activePlacementAnomaly: string | null;
  chronicle: ChronicleEntry[];
  technologies: TechnologyItem[];
  selectedEntity: EntityState | null;
  onWhisper: (entityId: string, message: string) => void;
  onFocusEntity: (x: number, z: number) => void;
  onDeselectEntity: () => void;
  factionCounts: Record<string, number>;
  onInspectRandomEntity: () => void;
  onInspectFactionMember: (factionId: FactionId) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeDirective,
  onSetDirective,
  architectPoints,
  onSelectAnomalyForPlacement,
  activePlacementAnomaly,
  chronicle,
  technologies,
  selectedEntity,
  onWhisper,
  onFocusEntity,
  onDeselectEntity,
  factionCounts,
  onInspectRandomEntity,
  onInspectFactionMember,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'directives' | 'anomalies' | 'chronicle' | 'societies' | 'inspector'>(
    selectedEntity ? 'inspector' : 'directives'
  );
  const [chronicleFilter, setChronicleFilter] = useState<string>('all');

  // Auto switch to inspector when an entity is selected
  React.useEffect(() => {
    if (selectedEntity) {
      setActiveTab('inspector');
      setIsCollapsed(false);
    }
  }, [selectedEntity]);

  const directivesList: { id: PrimeDirectiveId; name: string; desc: string; icon: string }[] = [
    {
      id: 'syntropic_harmony',
      name: 'Syntropic Harmony',
      desc: 'Minimizes energy decay (-40%) and encourages mutual aid, trade, and communal structures.',
      icon: '🌿',
    },
    {
      id: 'darwinian_acceleration',
      name: 'Darwinian Pressure',
      desc: 'Elevates energy scarcity and territorial competition, driving radical survival mutation.',
      icon: '⚡',
    },
    {
      id: 'transcendence_protocol',
      name: 'Transcendence Protocol',
      desc: 'Supercharges spiritual contemplation, drawing entities to monoliths for cosmic ascension.',
      icon: '✨',
    },
    {
      id: 'open_knowledge',
      name: 'Open Knowledge Grid',
      desc: 'Accelerates data bit synthesis (+35%) and promotes cross-faction meme discovery.',
      icon: '🧠',
    },
    {
      id: 'monolithic_order',
      name: 'Monolithic Order',
      desc: 'Architects and Wardens prioritize heavy structure construction and boundary anchoring.',
      icon: '🏛',
    },
  ];

  const filteredChronicle = chronicle.filter((entry) => {
    if (chronicleFilter === 'all') return true;
    return entry.category === chronicleFilter;
  });

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-transform duration-300 w-full max-w-[940px] px-3 select-none ${
        isCollapsed ? 'translate-y-[calc(100%-38px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Bar */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono rounded-t shadow cursor-pointer transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Expand Architect Console [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Collapse to Zen View [H]</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 shadow-2xl text-slate-100">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('directives')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'directives'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Directives</span>
            </button>

            <button
              onClick={() => setActiveTab('anomalies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'anomalies'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Anomalies</span>
            </button>

            <button
              onClick={() => setActiveTab('chronicle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'chronicle'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chronicle ({chronicle.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('societies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'societies'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Societies & Tech</span>
            </button>

            {selectedEntity ? (
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  activeTab === 'inspector'
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'text-cyan-400 hover:bg-slate-900'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Inspect: {selectedEntity.name}</span>
              </button>
            ) : (
              <button
                onClick={onInspectRandomEntity}
                title="Select and inspect an autonomous entity"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 border border-cyan-500/30 transition-colors"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Inspect Mind</span>
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-purple-400 hidden sm:block">
            Power: <span className="text-purple-200 font-bold tabular-nums">{architectPoints} AP</span>
          </div>
        </div>

        {/* Tab 1: Prime Directives */}
        {activeTab === 'directives' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {directivesList.map((dir) => {
              const isActive = activeDirective === dir.id;
              return (
                <button
                  key={dir.id}
                  onClick={() => onSetDirective(dir.id)}
                  className={`flex flex-col text-left p-2.5 rounded border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base">{dir.icon}</span>
                    {isActive && (
                      <span className="text-[9px] font-mono uppercase bg-cyan-400 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-100 mb-1">{dir.name}</div>
                  <div className="text-[11px] text-slate-400 leading-tight line-clamp-3">{dir.desc}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Cosmic Anomalies & Seeds */}
        {activeTab === 'anomalies' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ANOMALY_CATALOG.map((anom) => {
              const canAfford = architectPoints >= anom.cost;
              const isSelected = activePlacementAnomaly === anom.type;
              return (
                <button
                  key={anom.type}
                  disabled={!canAfford}
                  onClick={() => onSelectAnomalyForPlacement(anom.type)}
                  className={`flex flex-col text-left p-2 rounded border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base">{anom.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-purple-300 tabular-nums">
                      {anom.cost} AP
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-100 mb-1 truncate">{anom.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">{anom.description}</div>
                  <div className="mt-2 text-[9px] font-mono text-cyan-400 uppercase">
                    {isSelected ? 'Click World to Plant' : 'Plant Seed'}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Living Chronicle */}
        {activeTab === 'chronicle' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase">Filter:</span>
              {['all', 'breakthrough', 'monument', 'epoch', 'schism', 'intervention'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setChronicleFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                    chronicleFilter === cat ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-1.5">
              {filteredChronicle.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 py-4 text-center">
                  No chronicle events matching filter.
                </div>
              ) : (
                filteredChronicle.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded shrink-0">
                      Ep.{entry.epoch} / C.{entry.cycle}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono font-bold text-xs text-slate-100">{entry.title}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{entry.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Societies & Tech Tree */}
        {activeTab === 'societies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Factions Overview */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Active Factions</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.values(FACTION_DEFINITIONS) as FactionInfo[]).map((f) => {
                  const count = factionCounts[f.id] || 0;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onInspectFactionMember(f.id)}
                      title={`Inspect member of ${f.name}`}
                      className="p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-left flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: f.color }}>
                          {f.emblem}
                        </span>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200 truncate max-w-[105px]">{f.name}</div>
                          <div className="text-[9px] text-slate-400">Trait: {f.dominantTrait}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emerging Paradigm Memes & Technologies */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Civilization Tech Tree</div>
              <div className="max-h-36 overflow-y-auto pr-1 flex flex-col gap-1.5">
                {technologies.map((tech) => (
                  <div
                    key={tech.id}
                    className={`p-2 rounded border flex items-center justify-between text-xs font-mono ${
                      tech.discovered
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{tech.name}</span>
                        {tech.discovered && (
                          <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1 rounded uppercase">
                            Discovered
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tech.unlockedEffects}</div>
                    </div>
                    {!tech.discovered && (
                      <span className="text-[10px] text-amber-400 tabular-nums shrink-0">
                        {tech.cost} bits
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Entity Inspector */}
        {activeTab === 'inspector' && (
          <div>
            {selectedEntity ? (
              <EntityDetailCard
                entity={selectedEntity}
                onWhisper={onWhisper}
                onFocus={onFocusEntity}
                onClose={onDeselectEntity}
              />
            ) : (
              <div className="text-center py-4 text-xs font-mono text-slate-500">
                Click any floating entity in the 3D world to inspect its cognitive neural state.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
