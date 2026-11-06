import { EntityState, MemoryRecord, EntityRelationship } from '../types/simulation';
import { PRNG, defaultPrng } from './prng';

const MAX_MEMORIES_PER_ENTITY = 12;

export function recordMemory(
  entity: EntityState,
  type: MemoryRecord['type'],
  description: string,
  valence: number,
  timestamp: number,
  targetEntityId?: string,
  location?: [number, number],
  prng?: PRNG
): void {
  const generator = prng || defaultPrng;
  const record: MemoryRecord = {
    id: generator.randomId(`mem_${timestamp}`),
    timestamp,
    type,
    description,
    valence: Math.max(-1, Math.min(1, valence)),
    targetEntityId,
    location,
  };

  entity.memories.unshift(record);
  if (entity.memories.length > MAX_MEMORIES_PER_ENTITY) {
    entity.memories.pop();
  }

  // Affective feedback on personality traits (Neuroplastic adaptation)
  if (type === 'discovery' && valence > 0) {
    entity.traits.curiosity = Math.min(1, entity.traits.curiosity + 0.02 * entity.traits.adaptability);
  } else if (type === 'conflict') {
    if (valence < 0) {
      entity.traits.aggression = Math.min(1, entity.traits.aggression + 0.03 * (1 - entity.traits.altruism));
    }
  } else if (type === 'trade' && valence > 0) {
    entity.traits.altruism = Math.min(1, entity.traits.altruism + 0.02 * entity.traits.adaptability);
  } else if (type === 'whisper') {
    entity.traits.spiritualism = Math.min(1, entity.traits.spiritualism + 0.1);
  } else if (type === 'monument') {
    entity.traits.ambition = Math.min(1, entity.traits.ambition + 0.03);
  }
}

export function updateRelationship(
  source: EntityState,
  targetId: string,
  trustDelta: number,
  isKin = false
): void {
  let rel: EntityRelationship = source.relationships[targetId];
  if (!rel) {
    rel = {
      targetId,
      trust: 0.1,
      familiarity: 0.1,
      isKin,
    };
    source.relationships[targetId] = rel;
  }

  rel.trust = Math.max(-1, Math.min(1, rel.trust + trustDelta));
  rel.familiarity = Math.min(1, rel.familiarity + 0.08);
}
