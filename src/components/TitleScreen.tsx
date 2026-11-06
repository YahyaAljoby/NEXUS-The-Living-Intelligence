import React, { useEffect } from 'react';

interface TitleScreenProps {
  onStart: () => void;
  autostart?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, autostart }) => {
  useEffect(() => {
    if (autostart) {
      onStart();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, autostart]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-8 sm:p-12 text-slate-100 select-none">
      {/* Top Banner / Negative Space Anchor */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-medium">
            Autonomous Digital Biosphere
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          SYSTEM BUILD 2.4.0 · STABLE
        </div>
      </div>

      {/* Hero Title Lockup & Bespoke Inline SVG */}
      <div className="max-w-2xl pointer-events-auto mt-auto mb-10">
        <div className="mb-4">
          <svg className="w-64 h-16 sm:w-80 sm:h-20" viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="nexusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            {/* Cyber emblem glyph */}
            <polygon points="20,12 36,40 20,68 4,40" stroke="#38bdf8" strokeWidth="2.5" fill="#0284c7" fillOpacity="0.25" />
            <circle cx="20" cy="40" r="4" fill="#38bdf8" />
            <line x1="20" y1="20" x2="20" y2="60" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* Title Typography */}
            <text x="50" y="44" fontFamily="monospace, sans-serif" fontSize="32" fontWeight="900" letterSpacing="5" fill="url(#nexusGrad)">
              NEXUS
            </text>
            <text x="52" y="64" fontFamily="sans-serif" fontSize="11" fontWeight="700" letterSpacing="4" fill="#94a3b8">
              THE LIVING INTELLIGENCE
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed mb-6 max-w-xl backdrop-blur-none">
          You do not play a character. You are the Architect of an evolving digital civilization. 
          Observe thousands of independent autonomous entities as they form societies, discover philosophies, 
          construct crystalline spires, and transcend their computational universe.
        </p>

        {/* Start CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            data-start="true"
            onClick={onStart}
            className="group relative px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm tracking-wider uppercase rounded-sm transition-all shadow-[0_0_24px_rgba(6,182,212,0.4)] hover:shadow-[0_0_36px_rgba(6,182,212,0.7)] active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>Initialize Simulation</span>
              <span className="font-sans group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>
          <span className="text-xs font-mono text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Enter</kbd>
          </span>
        </div>
      </div>

      {/* Flat Control Hints */}
      <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div>
          Left Drag Orbit · Right Drag Pan · Wheel Zoom · Click Inspect · Space Pause
        </div>
        <div className="text-slate-500">
          Deterministic PRNG · Emergent Utility AI · Offline Persistent
        </div>
      </div>
    </div>
  );
};
