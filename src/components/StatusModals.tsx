import React, { useRef } from 'react';
import { SimulationStats } from '../types/simulation';
import { Play, RotateCcw, Download, Upload, Check, Home, Award } from 'lucide-react';

interface PauseModalProps {
  stats: SimulationStats;
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onSaveToLocal: () => void;
  onLoadFromLocal: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  saveMessage?: string | null;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  onResume,
  onRestart,
  onReturnToTitle,
  onSaveToLocal,
  onLoadFromLocal,
  onExportJson,
  onImportJson,
  saveMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none text-slate-100 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-2xl flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Simulation Console
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-white">
              NEXUS PAUSED
            </div>
          </div>
          <button
            onClick={onResume}
            className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-3 rounded border border-slate-800 text-center font-mono">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Epoch</div>
            <div className="text-lg font-bold text-slate-100 tabular-nums">{stats.epoch}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Population</div>
            <div className="text-lg font-bold text-cyan-400 tabular-nums">{stats.population}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Cycles</div>
            <div className="text-lg font-bold text-amber-400 tabular-nums">{stats.cycle}</div>
          </div>
        </div>

        {saveMessage && (
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/50 px-3 py-1.5 rounded flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-2 font-mono text-xs">
          <button
            onClick={onResume}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Simulation</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onSaveToLocal}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Save Local</span>
            </button>
            <button
              onClick={onLoadFromLocal}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Load Local</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExportJson}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          <div className="border-t border-slate-800 my-1" />

          <button
            onClick={onRestart}
            className="w-full py-2 bg-slate-800 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 hover:border-rose-500/40 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart New World Seed</span>
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface MilestoneModalProps {
  epoch: number;
  title: string;
  onDismiss: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  epoch,
  title,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none text-slate-100 select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/60 rounded-lg p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <Award className="w-7 h-7" />
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Planetary Inflection Point
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            EPOCH {epoch} REACHED
          </div>
          <div className="text-sm font-mono text-amber-300 mt-1">
            "{title}"
          </div>
        </div>

        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          The digital biosphere has integrated accumulated generational knowledge. 
          New cognitive paradigms and architecture tier formulas are now available across all faction clusters.
        </p>

        <button
          onClick={onDismiss}
          className="mt-2 px-8 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
        >
          Proceed with Simulation
        </button>
      </div>
    </div>
  );
};
