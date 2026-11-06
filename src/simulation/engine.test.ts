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

test('P0.1: Contemplate action moves toward monolith and applies bounded spiritual/data effects', () => {
  const engine = new SimulationEngine(777);
  // Reset entities and structures to controlled test state
  engine.entities = [];
  engine.structures = [{
    id: 'test_monolith',
    type: 'data_monolith',
    name: 'Test Monolith',
    x: 0,
    z: 0,
    factionId: 'techno_monks',
    level: 1,
    energyCapacity: 800,
    currentEnergy: 500,
    builtByEntityId: 'primordial',
    constructedAtEpoch: 1,
  }];

  const entity = engine.spawnEntity(25, 0, 1);
  entity.traits.spiritualism = 0.5;
  entity.traits.adaptability = 0.8;
  entity.energy = 80;
  entity.dataBits = 0;
  entity.vx = 0;
  entity.vz = 0;

  // 1. Contemplate should move toward monolith at (0, 0)
  (engine as any).executeEntityAction(
    entity,
    { action: 'contemplate', utility: 1.0, targetX: 0, targetZ: 0 },
    [],
    engine.structures,
    []
  );

  assert.ok(entity.vx < 0, 'Entity should accelerate in -x direction toward (0, 0)');
  assert.ok(Number.isFinite(entity.vx));
  assert.ok(Number.isFinite(entity.vz));

  // 2. Reaching monolith applies bounded spiritual growth and data synthesis
  entity.x = 2;
  entity.z = 2;
  const initialSpiritualism = entity.traits.spiritualism;
  const initialTotalData = engine.totalDataSynthesized;

  (engine as any).executeEntityAction(
    entity,
    { action: 'contemplate', utility: 1.0, targetX: 0, targetZ: 0 },
    [],
    engine.structures,
    []
  );

  assert.ok(entity.traits.spiritualism > initialSpiritualism, 'Spiritualism should increase in communion range');
  assert.ok(entity.traits.spiritualism <= 1.0, 'Spiritualism must not exceed upper bound 1.0');
  assert.ok(engine.totalDataSynthesized >= initialTotalData + 1, 'Data synthesized should increment');

  // 3. No-monolith scenario does not throw, freeze, or produce NaN
  engine.structures = [];
  entity.x = 50;
  entity.z = 50;
  (engine as any).executeEntityAction(
    entity,
    { action: 'contemplate', utility: 1.0 },
    [],
    [],
    []
  );

  assert.ok(Number.isFinite(entity.vx), 'Velocity x must remain finite with no monolith');
  assert.ok(Number.isFinite(entity.vz), 'Velocity z must remain finite with no monolith');
  assert.ok(Number.isFinite(entity.energy), 'Energy must remain finite with no monolith');
  assert.ok(Number.isFinite(entity.traits.spiritualism), 'Spiritualism must remain finite with no monolith');
});

test('P0.2: Recharge target selection avoids depleted structures and handles all-depleted fallback', () => {
  const engine = new SimulationEngine(888);
  engine.entities = [];
  engine.structures = [
    {
      id: 'depleted_relay',
      type: 'energy_relay',
      name: 'Depleted Relay',
      x: 5,
      z: 0,
      factionId: 'cyber_nomads',
      level: 1,
      energyCapacity: 500,
      currentEnergy: 0, // Depleted!
      builtByEntityId: 'primordial',
      constructedAtEpoch: 1,
    },
    {
      id: 'charged_relay',
      type: 'energy_relay',
      name: 'Charged Relay',
      x: 30,
      z: 0,
      factionId: 'cyber_nomads',
      level: 1,
      energyCapacity: 500,
      currentEnergy: 350, // Viable power
      builtByEntityId: 'primordial',
      constructedAtEpoch: 1,
    },
  ];

  const entity = engine.spawnEntity(0, 0, 1);
  entity.energy = 15;
  entity.maxEnergy = 100;
  entity.vx = 0;
  entity.vz = 0;

  // Execute recharge: entity should target charged_relay at x=30, NOT depleted_relay at x=5
  (engine as any).executeEntityAction(
    entity,
    { action: 'recharge', utility: 2.0 },
    [],
    engine.structures,
    []
  );

  assert.ok(entity.vx > 0, 'Entity must move toward the charged relay in +x direction');

  // Recharging at viable structure cannot make structure energy negative
  const charged = engine.structures[1];
  charged.currentEnergy = 5;
  entity.energy = 50;
  entity.x = charged.x;
  entity.z = charged.z;

  (engine as any).executeEntityAction(
    entity,
    { action: 'recharge', utility: 2.0 },
    [],
    engine.structures,
    []
  );

  assert.ok(charged.currentEnergy >= 0, 'Structure energy must never become negative');
  assert.equal(charged.currentEnergy, 0);
  assert.equal(entity.energy, 55);

  // Fallback when ALL structures are depleted: entity must not freeze or crash
  engine.structures[0].currentEnergy = 0;
  engine.structures[1].currentEnergy = 0;
  entity.x = 40;
  entity.z = 40;
  entity.energy = 5; // critically low

  (engine as any).executeEntityAction(
    entity,
    { action: 'recharge', utility: 2.0 },
    [],
    engine.structures,
    []
  );

  assert.ok(Number.isFinite(entity.vx), 'Fallback must produce finite vx');
  assert.ok(Number.isFinite(entity.vz), 'Fallback must produce finite vz');
  assert.ok(entity.energy > 5, 'Ambient trickle harvest must sustain critically low entity');
});

test('P0.3: Deterministic simulation reproducibility across save and load', () => {
  const prng = new PRNG(1337);
  const stateSnapshot = prng.getState();
  const sample1 = [prng.next(), prng.range(5, 15), prng.randomId('test')];

  // Restore state
  prng.setState(stateSnapshot);
  const sample2 = [prng.next(), prng.range(5, 15), prng.randomId('test')];
  assert.deepEqual(sample1, sample2, 'PRNG setState must reproduce identical random values');

  // Multi-cycle simulation determinism across save/load
  const engineA = new SimulationEngine(9999);
  for (let i = 0; i < 20; i++) {
    engineA.step(0.016);
  }

  const serialized = engineA.serialize();
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.version, 2, 'Serialized format should be version 2');
  assert.ok(typeof parsed.prngState === 'number', 'PRNG state must be serialized');

  const engineB = new SimulationEngine(1);
  const restoreSuccess = engineB.deserialize(serialized);
  assert.equal(restoreSuccess, true, 'Engine B should deserialize successfully');

  // Run both engines for another 20 cycles
  for (let i = 0; i < 20; i++) {
    engineA.step(0.016);
    engineB.step(0.016);
  }

  assert.equal(engineA.cycle, engineB.cycle);
  assert.equal(engineA.entities.length, engineB.entities.length);
  assert.equal(engineA.entities[0].x, engineB.entities[0].x);
  assert.equal(engineA.entities[0].z, engineB.entities[0].z);
  assert.equal(engineA.entities[0].energy, engineB.entities[0].energy);
  assert.equal(engineA.entities[0].traits.curiosity, engineB.entities[0].traits.curiosity);

  // Backward compatibility: load legacy v1 format without prngState
  const legacyV1 = JSON.stringify({
    version: 1,
    cycle: 50,
    epoch: 2,
    architectPoints: 220,
    entropyLevel: 10,
    activeDirective: 'open_knowledge',
    totalDataSynthesized: 150,
    entities: [engineA.entities[0]],
    structures: engineA.structures,
    anomalies: [],
    technologies: engineA.technologies,
    chronicle: [],
  });

  const engineC = new SimulationEngine(2);
  const legacyRestored = engineC.deserialize(legacyV1);
  assert.equal(legacyRestored, true, 'Legacy v1 save should deserialize cleanly');
  assert.equal(engineC.cycle, 50);
  assert.equal(engineC.epoch, 2);
});

test('P0.4: Deep schema validation rejects corrupted payloads and preserves valid zeros atomically', () => {
  const engine = new SimulationEngine(54321);
  const baselineCycle = engine.cycle;
  const baselineEntitiesCount = engine.entities.length;

  // 1. Non-string or invalid JSON string
  assert.equal(engine.deserialize(''), false);
  assert.equal(engine.deserialize('{ invalid json'), false);
  assert.equal(engine.deserialize('12345'), false);
  assert.equal(engine.deserialize('null'), false);
  assert.equal(engine.deserialize('[]'), false);

  // 2. Corrupted entity position (NaN) must be rejected without mutating engine
  const badEntityJson = JSON.stringify({
    cycle: 100,
    epoch: 3,
    entities: [{
      id: 'bad_agent',
      name: 'Bad Agent',
      x: null, // invalid
      z: 10,
      vx: 0,
      vz: 0,
      rotation: 0,
      energy: 50,
      maxEnergy: 100,
      age: 10,
      lifespan: 500,
      traits: { curiosity: 0.5, altruism: 0.5, aggression: 0.5, ambition: 0.5, rationality: 0.5, spiritualism: 0.5, adaptability: 0.5 },
      role: 'Seeker',
      factionId: 'techno_monks',
      memories: [],
      relationships: {},
    }],
    structures: [],
    anomalies: [],
    technologies: [],
    chronicle: [],
  });

  const rejectBad = engine.deserialize(badEntityJson);
  assert.equal(rejectBad, false, 'Invalid coordinates must reject');
  assert.equal(engine.cycle, baselineCycle, 'Engine cycle must not mutate on rejected deserialize');
  assert.equal(engine.entities.length, baselineEntitiesCount, 'Engine entities must not mutate on rejected deserialize');

  // 3. Valid zeros preserved (preserving 0 values instead of overriding with default fallbacks)
  const zeroPreserveJson = JSON.stringify({
    version: 2,
    cycle: 0,
    epoch: 1,
    architectPoints: 0,
    entropyLevel: 0,
    activeDirective: 'syntropic_harmony',
    totalDataSynthesized: 0,
    entities: [{
      id: 'zero_agent',
      name: 'Zero-01',
      generation: 1,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      rotation: 0,
      energy: 0,
      maxEnergy: 100,
      age: 0,
      lifespan: 400,
      traits: {
        curiosity: 0,
        altruism: 0,
        aggression: 0,
        ambition: 0,
        rationality: 0,
        spiritualism: 0,
        adaptability: 0,
      },
      role: 'Seeker',
      factionId: 'void_seekers',
      memories: [],
      relationships: {},
      currentGoal: '',
      thoughtBubble: '',
      thoughtTimer: 0,
      dataBits: 0,
      structuresBuilt: 0,
      color: '#8b5cf6',
      scale: 1,
    }],
    structures: [],
    anomalies: [],
    technologies: [],
    chronicle: [],
    prngState: 12345,
  });

  const zeroSuccess = engine.deserialize(zeroPreserveJson);
  assert.equal(zeroSuccess, true, 'Zero-containing valid state must be accepted');
  assert.equal(engine.cycle, 0, 'Cycle 0 must be preserved');
  assert.equal(engine.architectPoints, 0, 'Architect points 0 must be preserved');
  assert.equal(engine.entropyLevel, 0, 'Entropy level 0 must be preserved');
  assert.equal(engine.entities[0].x, 0, 'Entity x=0 must be preserved');
  assert.equal(engine.entities[0].z, 0, 'Entity z=0 must be preserved');
  assert.equal(engine.entities[0].energy, 0, 'Entity energy=0 must be preserved');
  assert.equal(engine.entities[0].traits.aggression, 0, 'Trait aggression=0 must be preserved');
  assert.equal(engine.entities[0].traits.curiosity, 0, 'Trait curiosity=0 must be preserved');
});
