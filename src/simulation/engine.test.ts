import test from 'node:test';
import assert from 'node:assert/strict';
import { PRNG } from './prng';
import { SimulationEngine } from './engine';
import { createInitialPersonality, determineRole, evaluateUtility } from './personality';
import { recordMemory, updateRelationship } from './memories';
import { calculateFactionAffinity } from './factions';

test('PRNG produces deterministic outputs given same seed', () => {
  const prngA = new PRNG(12345);
  const prngB = new PRNG(12345);

  const seqA = [prngA.next(), prngA.next(), prngA.range(10, 50)];
  const seqB = [prngB.next(), prngB.next(), prngB.range(10, 50)];

  assert.deepEqual(seqA, seqB);
});

test('Role and faction affinity correctly resolve from personality traits', () => {
  const traits = {
    curiosity: 0.95,
    altruism: 0.2,
    aggression: 0.1,
    ambition: 0.3,
    rationality: 0.5,
    spiritualism: 0.1,
    adaptability: 0.4,
  };

  const role = determineRole(traits);
  assert.equal(role, 'Seeker');

  const faction = calculateFactionAffinity(traits);
  assert.equal(faction, 'void_seekers');
});

test('Utility evaluation prioritizes recharge when energy is critically low', () => {
  const prng = new PRNG(99);
  const dummyEntity = {
    id: 'test_1',
    name: 'Test-01',
    generation: 1,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    rotation: 0,
    energy: 5, // Extremely low
    maxEnergy: 100,
    age: 10,
    lifespan: 500,
    traits: createInitialPersonality(prng),
    role: 'Seeker' as const,
    factionId: 'algorithmic_hive' as const,
    memories: [],
    relationships: {},
    currentGoal: '',
    thoughtBubble: '',
    thoughtTimer: 0,
    dataBits: 0,
    structuresBuilt: 0,
    color: '#06b6d4',
    scale: 1,
  };

  const decision = evaluateUtility(dummyEntity, [], [], [], 'syntropic_harmony', prng);
  assert.equal(decision.action, 'recharge');
});

test('Memories adapt personality neuroplasticity and update relationships', () => {
  const prng = new PRNG(101);
  const entity = {
    id: 'agent_a',
    name: 'Agent-A',
    generation: 1,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    rotation: 0,
    energy: 80,
    maxEnergy: 100,
    age: 20,
    lifespan: 500,
    traits: {
      curiosity: 0.5,
      altruism: 0.5,
      aggression: 0.5,
      ambition: 0.5,
      rationality: 0.5,
      spiritualism: 0.5,
      adaptability: 0.8,
    },
    role: 'Synthesizer' as const,
    factionId: 'algorithmic_hive' as const,
    memories: [],
    relationships: {} as Record<string, any>,
    currentGoal: '',
    thoughtBubble: '',
    thoughtTimer: 0,
    dataBits: 0,
    structuresBuilt: 0,
    color: '#06b6d4',
    scale: 1,
  };

  const initialCuriosity = entity.traits.curiosity;
  recordMemory(entity, 'discovery', 'Decrypted quantum lattice fragment', 0.9, 100);

  assert.equal(entity.memories.length, 1);
  assert.ok(entity.traits.curiosity > initialCuriosity, 'Curiosity should increase after discovery memory');

  updateRelationship(entity, 'agent_b', 0.3);
  assert.equal(entity.relationships['agent_b'].trust, 0.4);
});

test('SimulationEngine initializes world, steps physics, and handles serialize/deserialize', () => {
  const engine = new SimulationEngine(424242);

  assert.ok(engine.entities.length >= 300, 'Engine should spawn initial entities');
  assert.ok(engine.structures.length >= 5, 'Engine should spawn initial structures');
  assert.equal(engine.epoch, 1);

  // Step simulation 10 cycles
  for (let i = 0; i < 10; i++) {
    engine.step(0.016);
  }
  assert.equal(engine.cycle, 10);

  // Spawn anomaly
  const success = engine.spawnAnomaly('data_geyser', 20, 20, 50);
  assert.equal(success, true);
  assert.equal(engine.anomalies.length, 1);

  // Test serialization & restore
  const json = engine.serialize();
  const engine2 = new SimulationEngine(1);
  const deserialized = engine2.deserialize(json);

  assert.equal(deserialized, true);
  assert.equal(engine2.cycle, 10);
  assert.equal(engine2.entities.length, engine.entities.length);
  assert.equal(engine2.anomalies.length, 1);
  assert.equal(engine2.anomalies[0].type, 'data_geyser');
});
