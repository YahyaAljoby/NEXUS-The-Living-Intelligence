import { AnomalyInstance } from '../types/simulation';

export interface AnomalyDefinition {
  type: AnomalyInstance['type'];
  name: string;
  cost: number;
  duration: number;
  radius: number;
  description: string;
  icon: string;
}

export const ANOMALY_CATALOG: AnomalyDefinition[] = [
  {
    type: 'data_geyser',
    name: 'Data Geyser',
    cost: 50,
    duration: 300,
    radius: 35,
    description: 'Erupts with concentrated data packets, accelerating entity knowledge synthesis.',
    icon: '⚡',
  },
  {
    type: 'quantum_monolith',
    name: 'Quantum Monolith',
    cost: 80,
    duration: 500,
    radius: 40,
    description: 'An enigmatic cosmic obelisk inspiring awe, contemplation, and philosophical awakening.',
    icon: '◈',
  },
  {
    type: 'logic_flare',
    name: 'Logic Flare',
    cost: 65,
    duration: 250,
    radius: 50,
    description: 'A surge of empirical clarity, supercharging rationality and technological progress.',
    icon: '☼',
  },
  {
    type: 'genesis_seed',
    name: 'Genesis Seed',
    cost: 100,
    duration: 150,
    radius: 25,
    description: 'Seeds a clutch of new autonomous entities endowed with high genetic curiosity.',
    icon: '🌱',
  },
  {
    type: 'neural_beacon',
    name: 'Neural Resonance Beacon',
    cost: 90,
    duration: 400,
    radius: 45,
    description: 'Emits harmonic resonance that reconciles rival factions and promotes mutual trade.',
    icon: '📶',
  },
  {
    type: 'entropy_storm',
    name: 'Entropy Storm',
    cost: 120,
    duration: 200,
    radius: 30,
    description: 'A chaotic rupture in the simulation matrix, challenging entities to adapt or perish.',
    icon: '🌪',
  },
];
