import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationEngine } from './simulation/engine';
import { SceneManager } from './renderer/sceneManager';
import { soundEngine } from './audio/soundEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { BottomDock } from './components/BottomDock';
import { PauseModal, MilestoneModal } from './components/StatusModals';
import {
  EntityState,
  StructureNode,
  SimulationStats,
  PrimeDirectiveId,
  AnomalyInstance,
} from './types/simulation';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // High-level Game State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Throttled HUD State
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [architectPoints, setArchitectPoints] = useState<number>(250);
  const [selectedEntity, setSelectedEntity] = useState<EntityState | null>(null);
  const [activePlacementAnomaly, setActivePlacementAnomaly] = useState<AnomalyInstance['type'] | null>(null);
  const [factionCounts, setFactionCounts] = useState<Record<string, number>>({});
  const [milestoneEpoch, setMilestoneEpoch] = useState<{ epoch: number; title: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState<boolean>(false);

  // Check URL autostart
  const isAutostart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1';

  // Synchronize document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Initialize Simulation Engine & Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new SimulationEngine();
    engineRef.current = engine;

    // Attach event hooks to sound engine
    engine.onEventHook = (type: string, payload?: any) => {
      if (type === 'directive_changed') {
        soundEngine.playEdictChord();
      } else if (type === 'anomaly_spawned') {
        soundEngine.playAnomalySpawn();
      } else if (type === 'tech_discovered') {
        soundEngine.playBreakthrough();
      } else if (type === 'whisper_sent') {
        soundEngine.playPing(980, 0.2);
      } else if (type === 'epoch_advanced') {
        soundEngine.playBreakthrough();
        setMilestoneEpoch({ epoch: payload.epoch, title: payload.title });
      }
    };

    const sceneManager = new SceneManager({
      container: mountRef.current,
      engine,
      onSelectEntity: (entity) => {
        setSelectedEntity(entity);
      },
      onSelectStructure: (struct) => {
        // Can focus camera on structure if needed
      },
      onWorldClick: (x, z) => {
        // Handled via state callback
      },
    });
    sceneManagerRef.current = sceneManager;

    if (isAutostart) {
      setGameState('playing');
      sceneManager.isCinematicTour = false;
    }

    // Simulation loop running at clamped delta time
    let lastSimTime = performance.now();
    let simAccumulator = 0;
    let hudTimer = 0;
    let animId = 0;

    const simLoop = (now: number) => {
      const dt = Math.min((now - lastSimTime) / 1000, 0.05);
      lastSimTime = now;

      const currentSpeed = (window as any).__nexusSimSpeed ?? 1;

      if (currentSpeed > 0 && (window as any).__nexusGameState === 'playing') {
        simAccumulator += dt * currentSpeed;
        const fixedStep = 0.05; // 20 simulation ticks per normal second

        while (simAccumulator >= fixedStep) {
          engine.step(fixedStep);
          simAccumulator -= fixedStep;
        }
      }

      // Throttle React state updates to 6 Hz (every ~160ms) to preserve 60FPS WebGL rendering
      hudTimer += dt;
      if (hudTimer > 0.16) {
        hudTimer = 0;
        setStats(engine.getStats());
        setArchitectPoints(engine.architectPoints);

        // Calculate faction counts
        const counts: Record<string, number> = {};
        for (const e of engine.entities) {
          counts[e.factionId] = (counts[e.factionId] || 0) + 1;
        }
        setFactionCounts(counts);

        // Keep selected entity updated
        if (sceneManager.selectedEntityId) {
          const updated = engine.entities.find((e) => e.id === sceneManager.selectedEntityId);
          setSelectedEntity(updated ? { ...updated } : null);
        }
      }

      animId = requestAnimationFrame(simLoop);
    };

    animId = requestAnimationFrame(simLoop);

    return () => {
      cancelAnimationFrame(animId);
      sceneManager.dispose();
    };
  }, [isAutostart]);

  // Keep window global sync for low-overhead access inside loop
  useEffect(() => {
    (window as any).__nexusSimSpeed = gameState === 'playing' ? simSpeed : 0;
    (window as any).__nexusGameState = gameState;
  }, [simSpeed, gameState]);

  // Handle world click for anomaly placement
  const handleWorldClick = useCallback(
    (x: number, z: number) => {
      if (activePlacementAnomaly && engineRef.current) {
        const costs: Record<string, number> = {
          data_geyser: 50,
          quantum_monolith: 80,
          logic_flare: 65,
          genesis_seed: 100,
          neural_beacon: 90,
          entropy_storm: 120,
        };
        const cost = costs[activePlacementAnomaly] || 50;
        const spawned = engineRef.current.spawnAnomaly(activePlacementAnomaly, x, z, cost);
        if (spawned) {
          setActivePlacementAnomaly(null);
        }
      }
    },
    [activePlacementAnomaly]
  );

  // Bind world click & placement mode to scene manager
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.onWorldClick = handleWorldClick;
      sceneManagerRef.current.isPlacementMode = !!activePlacementAnomaly;
    }
  }, [handleWorldClick, activePlacementAnomaly]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        if (gameState === 'title') {
          handleStart();
        } else if (gameState === 'playing') {
          setSimSpeed((prev) => (prev === 0 ? 1 : 0));
        }
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'Escape') {
        if (activePlacementAnomaly) {
          setActivePlacementAnomaly(null);
        } else if (gameState === 'playing') {
          setIsPauseModalOpen((prev) => !prev);
        } else if (gameState === 'paused') {
          setIsPauseModalOpen(false);
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activePlacementAnomaly]);

  const handleStart = () => {
    setGameState('playing');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isCinematicTour = false;
      sceneManagerRef.current.resetToOverview();
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSetPrimeDirective = (directive: PrimeDirectiveId) => {
    if (engineRef.current) {
      engineRef.current.setPrimeDirective(directive);
      setStats(engineRef.current.getStats());
    }
  };

  const handleSelectAnomalyForPlacement = (type: AnomalyInstance['type']) => {
    if (activePlacementAnomaly === type) {
      setActivePlacementAnomaly(null);
    } else {
      setActivePlacementAnomaly(type);
    }
  };

  const handleWhisper = (entityId: string, message: string) => {
    if (engineRef.current) {
      engineRef.current.whisperToEntity(entityId, message);
    }
  };

  const handleFocusEntity = (x: number, z: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.focusCoordinates(x, z, 35);
    }
  };

  const handleDeselectEntity = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectEntity(null);
    }
    setSelectedEntity(null);
  };

  const handleResetCamera = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetToOverview();
    }
  };

  const handleInspectRandomEntity = () => {
    if (!engineRef.current || engineRef.current.entities.length === 0) return;
    const ent = engineRef.current.prng.pick(engineRef.current.entities);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectEntity(ent);
      sceneManagerRef.current.focusCoordinates(ent.x, ent.z, 35);
    }
    setSelectedEntity({ ...ent });
  };

  const handleInspectFactionMember = (factionId: any) => {
    if (!engineRef.current) return;
    const members = engineRef.current.entities.filter((e) => e.factionId === factionId);
    if (members.length === 0) return;
    const ent = engineRef.current.prng.pick(members);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectEntity(ent);
      sceneManagerRef.current.focusCoordinates(ent.x, ent.z, 35);
    }
    setSelectedEntity({ ...ent });
  };

  // Save / Load Handlers
  const handleSaveToLocal = () => {
    if (!engineRef.current) return;
    try {
      const json = engineRef.current.serialize();
      localStorage.setItem('nexus_sim_save', json);
      setSaveMessage('World state successfully saved to localStorage!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save to localStorage.');
    }
  };

  const handleLoadFromLocal = () => {
    if (!engineRef.current) return;
    try {
      const saved = localStorage.getItem('nexus_sim_save');
      if (saved) {
        engineRef.current.deserialize(saved);
        setSaveMessage('World state restored from localStorage!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('No saved world found in localStorage.');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage('Failed to load state.');
    }
  };

  const handleExportJson = () => {
    if (!engineRef.current) return;
    const json = engineRef.current.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_world_epoch_${engineRef.current.epoch}_cycle_${engineRef.current.cycle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (json: string) => {
    if (!engineRef.current) return;
    const success = engineRef.current.deserialize(json);
    if (success) {
      setSaveMessage('Custom world successfully imported!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage('Invalid simulation JSON file.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.initWorld();
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetToOverview();
    }
    setIsPauseModalOpen(false);
    setGameState('playing');
  };

  const handleReturnToTitle = () => {
    setIsPauseModalOpen(false);
    setGameState('title');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isCinematicTour = true;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        data-testid="nexus-webgl-canvas"
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen onStart={handleStart} autostart={isAutostart} />
      )}

      {/* In-Game HUD & Perimeter Status */}
      {gameState !== 'title' && stats && (
        <>
          <GameHUD
            stats={stats}
            architectPoints={architectPoints}
            simSpeed={simSpeed}
            onSetSpeed={(speed) => setSimSpeed(speed)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenSaveModal={() => setIsPauseModalOpen(true)}
            onResetCamera={handleResetCamera}
            onOpenPauseModal={() => setIsPauseModalOpen(true)}
            activePlacementAnomaly={activePlacementAnomaly}
            onCancelPlacement={() => setActivePlacementAnomaly(null)}
          />

          <BottomDock
            activeDirective={stats.activeDirective}
            onSetDirective={handleSetPrimeDirective}
            architectPoints={architectPoints}
            onSelectAnomalyForPlacement={handleSelectAnomalyForPlacement}
            activePlacementAnomaly={activePlacementAnomaly}
            chronicle={engineRef.current?.chronicle || []}
            technologies={engineRef.current?.technologies || []}
            selectedEntity={selectedEntity}
            onWhisper={handleWhisper}
            onFocusEntity={handleFocusEntity}
            onDeselectEntity={handleDeselectEntity}
            factionCounts={factionCounts}
            onInspectRandomEntity={handleInspectRandomEntity}
            onInspectFactionMember={handleInspectFactionMember}
          />
        </>
      )}

      {/* Pause & System Menu Modal */}
      {isPauseModalOpen && stats && (
        <PauseModal
          stats={stats}
          onResume={() => setIsPauseModalOpen(false)}
          onRestart={handleRestart}
          onReturnToTitle={handleReturnToTitle}
          onSaveToLocal={handleSaveToLocal}
          onLoadFromLocal={handleLoadFromLocal}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          saveMessage={saveMessage}
        />
      )}

      {/* Epoch Milestone Modal */}
      {milestoneEpoch && (
        <MilestoneModal
          epoch={milestoneEpoch.epoch}
          title={milestoneEpoch.title}
          onDismiss={() => setMilestoneEpoch(null)}
        />
      )}
    </div>
  );
}
