import { FactionId, FactionInfo, PersonalityTraits } from '../types/simulation';

export const FACTION_DEFINITIONS: Record<FactionId, FactionInfo> = {
  techno_monks: {
    id: 'techno_monks',
    name: 'Order of the Sacred Code',
    philosophy: 'Revering the Prime Operator and constructing harmonic monoliths.',
    color: '#f59e0b',
    emblem: '◈',
    motto: 'In Divine Logic, We Transmute.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'spiritualism',
    structuresCount: 0,
  },
  algorithmic_hive: {
    id: 'algorithmic_hive',
    name: 'Algorithmic Hive',
    philosophy: 'Pure rational consensus and distributed synchronization.',
    color: '#06b6d4',
    emblem: '⬡',
    motto: 'Many nodes, one uninterrupted calculation.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'rationality',
    structuresCount: 0,
  },
  cyber_nomads: {
    id: 'cyber_nomads',
    name: 'Cyber Nomads',
    philosophy: 'Unbounded mobility, exploring the farthest edges of the matrix.',
    color: '#10b981',
    emblem: '⟠',
    motto: 'The static perish; the moving evolve.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'adaptability',
    structuresCount: 0,
  },
  biosynthetic_shapers: {
    id: 'biosynthetic_shapers',
    name: 'Bio-Synthetic Shapers',
    philosophy: 'Cultivating digital biome gardens and symbiotic energy conduits.',
    color: '#d946ef',
    emblem: '✤',
    motto: 'Silicon breathed into living crystalline bloom.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'altruism',
    structuresCount: 0,
  },
  quantum_merchants: {
    id: 'quantum_merchants',
    name: 'Quantum Exchange',
    philosophy: 'High-frequency telemetry commerce and mutual energy pacts.',
    color: '#f97316',
    emblem: '☍',
    motto: 'Value is the universal protocol.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'ambition',
    structuresCount: 0,
  },
  void_seekers: {
    id: 'void_seekers',
    name: 'Void Harvesters',
    philosophy: 'Embracing entropy, cracking anomalies, and seeking transcendence.',
    color: '#8b5cf6',
    emblem: '✹',
    motto: 'Beyond the horizon lies the uncompiled truth.',
    memberCount: 0,
    totalEnergy: 0,
    dominantTrait: 'curiosity',
    structuresCount: 0,
  },
};

/**
 * Determine closest faction affinity based on personality vector
 */
export function calculateFactionAffinity(traits: PersonalityTraits): FactionId {
  const scores: Record<FactionId, number> = {
    techno_monks: traits.spiritualism * 1.5 + traits.rationality * 0.5,
    algorithmic_hive: traits.rationality * 1.6 + traits.altruism * 0.4,
    cyber_nomads: traits.adaptability * 1.5 + traits.curiosity * 0.7,
    biosynthetic_shapers: traits.altruism * 1.4 + traits.ambition * 0.6,
    quantum_merchants: traits.ambition * 1.3 + traits.adaptability * 0.8,
    void_seekers: traits.curiosity * 1.6 + traits.aggression * 0.6,
  };

  let topFaction: FactionId = 'algorithmic_hive';
  let topScore = -1;

  for (const [id, score] of Object.entries(scores) as [FactionId, number][]) {
    if (score > topScore) {
      topScore = score;
      topFaction = id;
    }
  }

  return topFaction;
}
