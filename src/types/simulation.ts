/**
 * Types and interfaces for NEXUS: The Living Intelligence simulation.
 */

export type FactionId = 
  | 'techno_monks' 
  | 'algorithmic_hive' 
  | 'cyber_nomads' 
  | 'biosynthetic_shapers' 
  | 'quantum_merchants' 
  | 'void_seekers';

export interface PersonalityTraits {
  curiosity: number;    // 0 - 1: Desire to explore, investigate anomalies, discover tech
  altruism: number;     // 0 - 1: Willingness to share energy, assist peers, build communal nodes
  aggression: number;   // 0 - 1: Competitive drive, territorial disputes, resource hoarding
  ambition: number;     // 0 - 1: Desire to lead, build monuments, accumulate influence
  rationality: number;  // 0 - 1: Empirical vs intuitive decision weighting
  spiritualism: number; // 0 - 1: Reverence for the Architect/Prime Operator and abstract memes
  adaptability: number; // 0 - 1: Speed of learning and updating memory biases
}

export interface MemoryRecord {
  id: string;
  timestamp: number;
  type: 'discovery' | 'trade' | 'conflict' | 'monument' | 'anomaly_witnessed' | 'whisper' | 'reproduction' | 'crisis';
  description: string;
  valence: number; // -1 (negative) to +1 (positive)
  targetEntityId?: string;
  location?: [number, number];
}

export type EntityRole = 
  | 'Seeker' 
  | 'Architect' 
  | 'Synthesizer' 
  | 'Merchant' 
  | 'Prophet' 
  | 'Warden' 
  | 'Philosopher';

export interface EntityRelationship {
  targetId: string;
  trust: number;       // -1 to +1
  familiarity: number; // 0 to 1
  isKin: boolean;
}

export interface EntityState {
  id: string;
  name: string;
  generation: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  rotation: number;
  energy: number;       // 0 - 100
  maxEnergy: number;
  age: number;          // simulation cycles
  lifespan: number;
  traits: PersonalityTraits;
  role: EntityRole;
  factionId: FactionId;
  memories: MemoryRecord[];
  relationships: Record<string, EntityRelationship>;
  currentGoal: string;
  thoughtBubble: string;
  thoughtTimer: number;
  dataBits: number;     // knowledge tokens collected
  structuresBuilt: number;
  color: string;
  scale: number;
}

export interface FactionInfo {
  id: FactionId;
  name: string;
  philosophy: string;
  color: string;
  emblem: string;
  motto: string;
  memberCount: number;
  totalEnergy: number;
  dominantTrait: keyof PersonalityTraits;
  structuresCount: number;
}

export interface StructureNode {
  id: string;
  type: 'energy_relay' | 'data_monolith' | 'synthesis_sanctuary' | 'defense_spike' | 'quantum_gateway';
  name: string;
  x: number;
  z: number;
  factionId: FactionId;
  level: number;
  energyCapacity: number;
  currentEnergy: number;
  builtByEntityId: string;
  constructedAtEpoch: number;
}

export interface AnomalyInstance {
  id: string;
  type: 'quantum_monolith' | 'data_geyser' | 'entropy_storm' | 'logic_flare' | 'genesis_seed' | 'neural_beacon';
  name: string;
  x: number;
  z: number;
  radius: number;
  intensity: number; // 0 - 1
  duration: number;  // remaining cycles
  description: string;
}

export type PrimeDirectiveId = 
  | 'syntropic_harmony' 
  | 'darwinian_acceleration' 
  | 'transcendence_protocol' 
  | 'open_knowledge' 
  | 'monolithic_order';

export interface PrimeDirective {
  id: PrimeDirectiveId;
  name: string;
  description: string;
  effectLabel: string;
  active: boolean;
}

export interface ChronicleEntry {
  id: string;
  epoch: number;
  cycle: number;
  category: 'epoch' | 'breakthrough' | 'schism' | 'monument' | 'intervention' | 'crisis' | 'eden';
  title: string;
  description: string;
  affectedFaction?: FactionId;
  relatedEntityName?: string;
  importance: 'low' | 'medium' | 'high' | 'legendary';
}

export interface TechnologyItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  discovered: boolean;
  discoveredAtEpoch?: number;
  discoveredByFaction?: FactionId;
  unlockedEffects: string;
}

export interface SimulationStats {
  cycle: number;
  epoch: number;
  population: number;
  totalEnergy: number;
  averageCuriosity: number;
  averageAltruism: number;
  averageAggression: number;
  structuresTotal: number;
  anomaliesActive: number;
  activeDirective: PrimeDirectiveId;
  entropyLevel: number; // 0 to 100
  civilizationTier: string;
}
