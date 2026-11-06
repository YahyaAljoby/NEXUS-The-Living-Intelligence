import React from 'react';
import { SimulationStats } from '../types/simulation';
import { Volume2, VolumeX, Pause, Play, FastForward, RotateCcw, Save, Compass } from 'lucide-react';

interface GameHUDProps {
  stats: SimulationStats;
  architectPoints: number;
  simSpeed: number;
  onSetSpeed: (speed: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSaveModal: () => void;
  onResetCamera: () => void;
  onOpenPauseModal: () => void;
  activePlacementAnomaly: string | null;
  onCancelPlacement: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  architectPoints,
  simSpeed,
  onSetSpeed,
  isMuted,
  onToggleMute,
  onOpenSaveModal,
  onResetCamera,
  onOpenPauseModal,
  activePlacementAnomaly,
  onCancelPlacement,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 text-slate-100 select-none">
      {/* Top Bar Perimeter Clusters */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Civilization Tier & Epoch */}
        <div className="pointer-events-auto bg-slate-950/90 border border-slate-800 rounded px-4 py-2.5 shadow-lg flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
              {stats.civilizationTier}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-bold font-mono tracking-tight text-slate-100">
              EPOCH {stats.epoch}
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              Cycle {stats.cycle}
            </div>
          </div>
        </div>

        {/* Top-Center: Vitality Readouts */}
        <div className="pointer-events-auto hidden md:flex items-center gap-6 bg-slate-950/90 border border-slate-800 rounded px-5 py-2.5 shadow-lg">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Population</span>
            <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              {stats.population}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Matrix Energy</span>
            <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              {stats.totalEnergy}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Entropy</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    stats.entropyLevel > 60 ? 'bg-red-500' : stats.entropyLevel > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${stats.entropyLevel}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-300 tabular-nums">
                {stats.entropyLevel}%
              </span>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono tracking-wider text-purple-400 uppercase">Architect Power</span>
            <span className="text-lg font-bold font-mono text-purple-300 tabular-nums">
              {architectPoints}
            </span>
          </div>
        </div>

        {/* Top-Right: Simulation Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded p-1.5 shadow-lg">
          {/* Pause */}
          <button
            onClick={() => onSetSpeed(simSpeed === 0 ? 1 : 0)}
            title="Pause/Resume (Space)"
            className={`p-2 rounded transition-colors ${
              simSpeed === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {simSpeed === 0 ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* 1x Speed */}
          <button
            onClick={() => onSetSpeed(1)}
            title="Normal Speed"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
              simSpeed === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1x
          </button>

          {/* 2x Speed */}
          <button
            onClick={() => onSetSpeed(2)}
            title="Fast Forward"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
              simSpeed === 2 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2x
          </button>

          {/* 5x Speed */}
          <button
            onClick={() => onSetSpeed(5)}
            title="Hyper Speed"
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
              simSpeed === 5 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-0.5">
              <FastForward className="w-3 h-3" />
              <span>5x</span>
            </span>
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          {/* Reset Camera */}
          <button
            onClick={onResetCamera}
            title="Reset Camera View"
            className="p-2 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Mute Audio */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            className="p-2 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Save / Load */}
          <button
            onClick={onOpenSaveModal}
            title="Save / Load State"
            className="p-2 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* System Pause Menu */}
          <button
            onClick={onOpenPauseModal}
            title="Pause Menu (Esc)"
            className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition-colors"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Active Anomaly Placement Prompt Banner */}
      {activePlacementAnomaly && (
        <div className="pointer-events-auto self-center bg-cyan-950/90 border border-cyan-500 px-6 py-2.5 rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-4 animate-bounce">
          <span className="text-xs font-mono text-cyan-200">
            Click anywhere on the 3D terrain to plant <strong className="text-white uppercase">{activePlacementAnomaly.replace('_', ' ')}</strong>
          </span>
          <button
            onClick={onCancelPlacement}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
