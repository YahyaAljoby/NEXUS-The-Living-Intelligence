import { FactionId, TechnologyItem } from '../types/simulation';

export const INITIAL_TECHNOLOGIES: TechnologyItem[] = [
  {
    id: 'neural_telepathy',
    name: 'Neural Telepathy Protocol',
    description: 'Entities form direct synaptic telemetry bonds, doubling social interaction range.',
    cost: 150,
    discovered: false,
    unlockedEffects: '+100% Social range, higher cross-faction empathy',
  },
  {
    id: 'crystalline_capacitors',
    name: 'Crystalline Capacitors',
    description: 'Advanced solid-state energy storage lattices allow nodes to retain more charge.',
    cost: 320,
    discovered: false,
    unlockedEffects: '+50% Max energy capacity for all entities',
  },
  {
    id: 'autonomous_masonry',
    name: 'Autonomous Architecture',
    description: 'Emergent geometric formulas enable construction of Synthesis Sanctuaries and Defense Spikes.',
    cost: 550,
    discovered: false,
    unlockedEffects: 'Unlocks Tier 2 Structures and Energy Spires',
  },
  {
    id: 'quantum_mesh',
    name: 'Quantum Entanglement Mesh',
    description: 'Sub-atomic data entanglement accelerates entity processing and locomotion speed.',
    cost: 850,
    discovered: false,
    unlockedEffects: '+30% Movement velocity and instant anomaly detection',
  },
  {
    id: 'syntropic_code',
    name: 'Syntropic Life Equations',
    description: 'A self-healing mathematical loop that resists digital entropy and extends lifespan.',
    cost: 1300,
    discovered: false,
    unlockedEffects: '+50% Entity lifespan and entropy decay resistance',
  },
  {
    id: 'transcendence_core',
    name: 'Dimensional Transcendence Core',
    description: 'The civilization constructs a bridge between the digital matrix and the infinite cosmic realm.',
    cost: 2000,
    discovered: false,
    unlockedEffects: 'Triggers Planetary Awakening & Epoch Ascension',
  },
];
