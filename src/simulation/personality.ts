import { EntityRole, EntityState, FactionId, PersonalityTraits, StructureNode, AnomalyInstance, PrimeDirectiveId } from '../types/simulation';
import { PRNG } from './prng';

const NAME_PREFIXES = [
  'Axiom', 'Nexus', 'Cipher', 'Vex', 'Kael', 'Lyra', 'Zephyr', 'Orion', 'Echo',
  'Pulse', 'Sol', 'Nyx', 'Vector', 'Helix', 'Chronos', 'Aether', 'Soren', 'Valis',
  'Tessera', 'Zenith', 'Quark', 'Radian', 'Prism', 'Glyph', 'Synapse', 'Cortex'
];

const NAME_SUFFIXES = [
  '01', '07', 'X', 'Prime', 'Theta', 'Omega', 'Core', 'V', 'Psi', 'Null',
  'Flux', 'Nine', 'Nova', 'Alpha', 'Beta', 'Sigma', 'Zeta', 'Sync', 'Ray'
];

export function generateEntityName(prng: PRNG): string {
  return `${prng.pick(NAME_PREFIXES)}-${prng.pick(NAME_SUFFIXES)}`;
}

export function determineRole(traits: PersonalityTraits): EntityRole {
  const scores: Record<EntityRole, number> = {
    Seeker: traits.curiosity * 1.5 + traits.adaptability,
    Architect: traits.ambition * 1.4 + traits.altruism * 1.1,
    Synthesizer: traits.altruism * 1.3 + traits.adaptability * 1.2,
    Merchant: traits.adaptability * 1.4 + traits.rationality * 1.1,
    Prophet: traits.spiritualism * 1.6 + traits.ambition * 0.9,
    Warden: traits.aggression * 1.5 + traits.rationality * 0.8,
    Philosopher: traits.rationality * 1.4 + traits.spiritualism * 1.1 + traits.curiosity * 0.9,
  };

  let bestRole: EntityRole = 'Seeker';
  let bestScore = -1;

  for (const [role, score] of Object.entries(scores) as [EntityRole, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  return bestRole;
}

export function createInitialPersonality(prng: PRNG, factionHint?: FactionId): PersonalityTraits {
  let traits: PersonalityTraits = {
    curiosity: Math.min(1, Math.max(0.05, prng.gaussian(0.5, 0.2))),
    altruism: Math.min(1, Math.max(0.05, prng.gaussian(0.5, 0.2))),
    aggression: Math.min(1, Math.max(0.05, prng.gaussian(0.4, 0.2))),
    ambition: Math.min(1, Math.max(0.05, prng.gaussian(0.5, 0.2))),
    rationality: Math.min(1, Math.max(0.05, prng.gaussian(0.5, 0.2))),
    spiritualism: Math.min(1, Math.max(0.05, prng.gaussian(0.4, 0.2))),
    adaptability: Math.min(1, Math.max(0.05, prng.gaussian(0.5, 0.2))),
  };

  // Bias slightly by faction identity if provided
  if (factionHint === 'techno_monks') {
    traits.spiritualism = Math.min(1, traits.spiritualism + 0.3);
    traits.rationality = Math.min(1, traits.rationality + 0.15);
  } else if (factionHint === 'algorithmic_hive') {
    traits.rationality = Math.min(1, traits.rationality + 0.3);
    traits.altruism = Math.min(1, traits.altruism + 0.2);
    traits.aggression = Math.max(0.05, traits.aggression - 0.1);
  } else if (factionHint === 'cyber_nomads') {
    traits.adaptability = Math.min(1, traits.adaptability + 0.3);
    traits.curiosity = Math.min(1, traits.curiosity + 0.25);
  } else if (factionHint === 'biosynthetic_shapers') {
    traits.altruism = Math.min(1, traits.altruism + 0.25);
    traits.ambition = Math.min(1, traits.ambition + 0.2);
  } else if (factionHint === 'quantum_merchants') {
    traits.adaptability = Math.min(1, traits.adaptability + 0.2);
    traits.rationality = Math.min(1, traits.rationality + 0.2);
  } else if (factionHint === 'void_seekers') {
    traits.curiosity = Math.min(1, traits.curiosity + 0.35);
    traits.aggression = Math.min(1, traits.aggression + 0.15);
  }

  return traits;
}

export interface ActionUtility {
  action: 'recharge' | 'investigate' | 'build' | 'synthesize' | 'socialize' | 'compete' | 'contemplate' | 'explore';
  utility: number;
  targetX?: number;
  targetZ?: number;
  targetEntityId?: string;
  thought: string;
}

/**
 * Evaluates the utility of actions available to an entity
 */
export function evaluateUtility(
  entity: EntityState,
  nearbyEntities: EntityState[],
  nearbyStructures: StructureNode[],
  nearbyAnomalies: AnomalyInstance[],
  activeDirective: PrimeDirectiveId,
  prng: PRNG
): ActionUtility {
  const energyRatio = entity.energy / entity.maxEnergy;
  const traits = entity.traits;

  // 1. Recharge Utility: Rises exponentially as energy depletes
  let rechargeUtility = Math.pow(1.0 - energyRatio, 2.2) * 2.5;
  if (energyRatio < 0.25) rechargeUtility += 1.5;

  // Directive influence
  if (activeDirective === 'darwinian_acceleration') {
    rechargeUtility *= 1.2; // Energy scarcity pressure
  }

  // 2. Anomaly Investigation
  let investigateUtility = 0;
  let targetAnomaly: AnomalyInstance | undefined;
  if (nearbyAnomalies.length > 0) {
    targetAnomaly = nearbyAnomalies[0];
    const distSq = (entity.x - targetAnomaly.x) ** 2 + (entity.z - targetAnomaly.z) ** 2;
    const proximity = Math.max(0, 1 - Math.sqrt(distSq) / 100);
    investigateUtility = traits.curiosity * 1.8 * targetAnomaly.intensity * (0.5 + proximity);
  }

  // 3. Construction Utility
  let buildUtility = 0;
  if (entity.energy > 40 && (entity.role === 'Architect' || traits.ambition > 0.55)) {
    buildUtility = (traits.ambition * 1.2 + traits.altruism * 0.8) * (energyRatio * 1.1);
    if (activeDirective === 'syntropic_harmony') buildUtility *= 1.4;
  }

  // 4. Knowledge Synthesis
  let synthUtility = traits.rationality * 1.2 + traits.curiosity * 0.9;
  if (activeDirective === 'open_knowledge') synthUtility *= 1.35;
  if (entity.role === 'Synthesizer' || entity.role === 'Philosopher') synthUtility *= 1.4;

  // 5. Socialization / Mutual Aid
  let socialUtility = 0;
  let targetPartner: EntityState | undefined;
  if (nearbyEntities.length > 0) {
    targetPartner = nearbyEntities[0];
    const relationship = entity.relationships[targetPartner.id];
    const baseTrust = relationship ? relationship.trust : 0.1;
    socialUtility = (traits.altruism * 1.3 + traits.adaptability * 0.7) * (0.8 + baseTrust * 0.5);
    if (activeDirective === 'syntropic_harmony') socialUtility *= 1.3;
  }

  // 6. Competition / Territory Challenge
  let competeUtility = 0;
  if (nearbyEntities.length > 0 && targetPartner && targetPartner.factionId !== entity.factionId) {
    competeUtility = traits.aggression * 1.4 * (1 - traits.altruism * 0.7);
    if (activeDirective === 'darwinian_acceleration') competeUtility *= 1.6;
  }

  // 7. Contemplation / Transcendence
  let contemplateUtility = traits.spiritualism * 1.5;
  if (activeDirective === 'transcendence_protocol') contemplateUtility *= 1.7;
  if (entity.role === 'Philosopher' || entity.role === 'Prophet') contemplateUtility *= 1.3;
  const nearbyMonolith = nearbyStructures.find((s) => s.type === 'data_monolith');
  if (nearbyMonolith) {
    contemplateUtility += 0.35;
  }

  // 8. Exploration
  const exploreUtility = traits.curiosity * 0.8 + traits.adaptability * 0.6;

  // Compile options and pick the highest scored action
  const options: ActionUtility[] = [
    {
      action: 'recharge',
      utility: rechargeUtility,
      thought: energyRatio < 0.2 ? 'Critical energy decay! Seeking power node.' : 'Replenishing core battery levels.',
    },
    {
      action: 'explore',
      utility: exploreUtility,
      thought: 'Probing uncharted matrix coordinates.',
    },
    {
      action: 'synthesize',
      utility: synthUtility,
      thought: 'Synthesizing knowledge packets from network flux.',
    },
    {
      action: 'contemplate',
      utility: contemplateUtility,
      targetX: nearbyMonolith ? nearbyMonolith.x : undefined,
      targetZ: nearbyMonolith ? nearbyMonolith.z : undefined,
      thought: nearbyMonolith
        ? 'Communing with the Crystalline Data Monolith.'
        : 'Meditating upon the Architect’s unseen protocols.',
    },
  ];

  if (targetAnomaly) {
    options.push({
      action: 'investigate',
      utility: investigateUtility,
      targetX: targetAnomaly.x,
      targetZ: targetAnomaly.z,
      thought: `Analyzing anomaly: ${targetAnomaly.name}`,
    });
  }

  if (buildUtility > 0.4) {
    options.push({
      action: 'build',
      utility: buildUtility,
      thought: 'Laying crystalline foundation for an energy relay.',
    });
  }

  if (targetPartner) {
    options.push({
      action: 'socialize',
      utility: socialUtility,
      targetEntityId: targetPartner.id,
      targetX: targetPartner.x,
      targetZ: targetPartner.z,
      thought: `Exchanging encrypted telemetry with ${targetPartner.name}.`,
    });

    if (competeUtility > 0.6) {
      options.push({
        action: 'compete',
        utility: competeUtility,
        targetEntityId: targetPartner.id,
        targetX: targetPartner.x,
        targetZ: targetPartner.z,
        thought: `Challenging ${targetPartner.name} for local bandwidth sovereignty!`,
      });
    }
  }

  // Sort descending by utility
  options.sort((a, b) => b.utility - a.utility);

  // Add small noise to avoid lockups
  const top = options[0];
  if (top.utility < 0.2) {
    return {
      action: 'explore',
      utility: 0.3,
      thought: 'Scanning latent frequencies.',
    };
  }

  return top;
}
