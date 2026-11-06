import {
  EntityState,
  FactionId,
  StructureNode,
  AnomalyInstance,
  PrimeDirectiveId,
  ChronicleEntry,
  TechnologyItem,
  SimulationStats,
} from '../types/simulation';
import { PRNG } from './prng';
import { createInitialPersonality, determineRole, evaluateUtility, generateEntityName } from './personality';
import { recordMemory, updateRelationship } from './memories';
import { calculateFactionAffinity, FACTION_DEFINITIONS } from './factions';
import { INITIAL_TECHNOLOGIES } from './technologies';
import { createStructure } from './structures';

export const WORLD_BOUNDS = 180;
const GRID_CELL_SIZE = 30;

export class SpatialGrid {
  private cells: Map<string, EntityState[]> = new Map();

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / GRID_CELL_SIZE);
    const cz = Math.floor(z / GRID_CELL_SIZE);
    return `${cx},${cz}`;
  }

  clear() {
    this.cells.clear();
  }

  insert(entity: EntityState) {
    const key = this.getCellKey(entity.x, entity.z);
    let list = this.cells.get(key);
    if (!list) {
      list = [];
      this.cells.set(key, list);
    }
    list.push(entity);
  }

  queryRadius(x: number, z: number, radius: number): EntityState[] {
    const results: EntityState[] = [];
    const minCx = Math.floor((x - radius) / GRID_CELL_SIZE);
    const maxCx = Math.floor((x + radius) / GRID_CELL_SIZE);
    const minCz = Math.floor((z - radius) / GRID_CELL_SIZE);
    const maxCz = Math.floor((z + radius) / GRID_CELL_SIZE);
    const rSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = `${cx},${cz}`;
        const list = this.cells.get(key);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const distSq = (e.x - x) ** 2 + (e.z - z) ** 2;
            if (distSq <= rSq) {
              results.push(e);
            }
          }
        }
      }
    }
    return results;
  }
}

export class SimulationEngine {
  public prng: PRNG;
  public entities: EntityState[] = [];
  public structures: StructureNode[] = [];
  public anomalies: AnomalyInstance[] = [];
  public technologies: TechnologyItem[] = [];
  public chronicle: ChronicleEntry[] = [];
  public activeDirective: PrimeDirectiveId = 'syntropic_harmony';
  public architectPoints = 250; // Currency for player interventions
  public cycle = 0;
  public epoch = 1;
  public totalDataSynthesized = 0;
  public entropyLevel = 15; // 0 - 100
  public grid: SpatialGrid = new SpatialGrid();

  // Listeners for audio / visual event hooks
  public onEventHook?: (type: string, payload?: any) => void;

  constructor(seed = 981273) {
    this.prng = new PRNG(seed);
    this.technologies = JSON.parse(JSON.stringify(INITIAL_TECHNOLOGIES));
    this.initWorld();
  }

  public initWorld() {
    this.entities = [];
    this.structures = [];
    this.anomalies = [];
    this.cycle = 0;
    this.epoch = 1;
    this.entropyLevel = 15;
    this.architectPoints = 250;

    // Place initial Central Crystalline Monolith
    this.structures.push({
      id: 'core_prime_monolith',
      type: 'data_monolith',
      name: 'Prime Nexus Anchor',
      x: 0,
      z: 0,
      factionId: 'techno_monks',
      level: 3,
      energyCapacity: 5000,
      currentEnergy: 4000,
      builtByEntityId: 'primordial',
      constructedAtEpoch: 1,
    });

    // Place initial 4 perimeter energy relays
    const relayDist = 65;
    const initialRelayFactions: FactionId[] = ['algorithmic_hive', 'cyber_nomads', 'biosynthetic_shapers', 'quantum_merchants'];
    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

    for (let i = 0; i < 4; i++) {
      this.structures.push(createStructure(
        'energy_relay',
        Math.cos(angles[i]) * relayDist,
        Math.sin(angles[i]) * relayDist,
        initialRelayFactions[i],
        'primordial',
        1
      ));
    }

    // Seed initial 350 entities (can grow dynamically up to 1000+)
    const initialCount = 350;
    for (let i = 0; i < initialCount; i++) {
      this.spawnEntity(undefined, undefined, 1);
    }

    // Add genesis chronicle entry
    this.addChronicleEntry(
      'eden',
      'The Prime Awakening',
      'The Prime Operator activated the digital biosphere. 350 autonomous nodes awaken in the crystalline matrix.',
      'legendary'
    );
  }

  public spawnEntity(x?: number, z?: number, generation = 1, parent?: EntityState): EntityState {
    const factions: FactionId[] = [
      'techno_monks',
      'algorithmic_hive',
      'cyber_nomads',
      'biosynthetic_shapers',
      'quantum_merchants',
      'void_seekers'
    ];
    const initialFaction = parent ? parent.factionId : this.prng.pick(factions);
    const traits = parent
      ? {
          curiosity: Math.min(1, Math.max(0.05, parent.traits.curiosity + this.prng.gaussian(0, 0.05))),
          altruism: Math.min(1, Math.max(0.05, parent.traits.altruism + this.prng.gaussian(0, 0.05))),
          aggression: Math.min(1, Math.max(0.05, parent.traits.aggression + this.prng.gaussian(0, 0.05))),
          ambition: Math.min(1, Math.max(0.05, parent.traits.ambition + this.prng.gaussian(0, 0.05))),
          rationality: Math.min(1, Math.max(0.05, parent.traits.rationality + this.prng.gaussian(0, 0.05))),
          spiritualism: Math.min(1, Math.max(0.05, parent.traits.spiritualism + this.prng.gaussian(0, 0.05))),
          adaptability: Math.min(1, Math.max(0.05, parent.traits.adaptability + this.prng.gaussian(0, 0.05))),
        }
      : createInitialPersonality(this.prng, initialFaction);

    const role = determineRole(traits);
    const resolvedFaction = calculateFactionAffinity(traits);

    const spawnDist = parent ? this.prng.range(5, 18) : this.prng.range(10, WORLD_BOUNDS * 0.7);
    const spawnAngle = this.prng.range(0, Math.PI * 2);
    const posX = x !== undefined ? x : Math.cos(spawnAngle) * spawnDist;
    const posZ = z !== undefined ? z : Math.sin(spawnAngle) * spawnDist;

    const factionMeta = FACTION_DEFINITIONS[resolvedFaction];

    const entity: EntityState = {
      id: `ent_${this.cycle}_${Math.random().toString(36).substring(2, 7)}`,
      name: generateEntityName(this.prng),
      generation,
      x: posX,
      z: posZ,
      vx: 0,
      vz: 0,
      rotation: spawnAngle,
      energy: this.prng.range(60, 95),
      maxEnergy: 100,
      age: 0,
      lifespan: this.prng.rangeInt(350, 650),
      traits,
      role,
      factionId: resolvedFaction,
      memories: [],
      relationships: {},
      currentGoal: 'Initialize matrix alignment',
      thoughtBubble: 'Synthesizing initial telemetry.',
      thoughtTimer: 0,
      dataBits: 0,
      structuresBuilt: 0,
      color: factionMeta.color,
      scale: 0.8 + traits.ambition * 0.4,
    };

    if (parent) {
      updateRelationship(entity, parent.id, 0.8, true);
      updateRelationship(parent, entity.id, 0.8, true);
      recordMemory(entity, 'reproduction', `Inherited consciousness lineage from ${parent.name}.`, 0.8, this.cycle);
    }

    this.entities.push(entity);
    return entity;
  }

  public step(dt: number) {
    this.cycle++;

    // Periodic architect points generation
    if (this.cycle % 15 === 0) {
      this.architectPoints = Math.min(500, this.architectPoints + 2);
    }

    // Rebuild spatial grid for O(N) neighbor querying
    this.grid.clear();
    for (let i = 0; i < this.entities.length; i++) {
      this.grid.insert(this.entities[i]);
    }

    // 1. Update Anomalies
    for (let i = this.anomalies.length - 1; i >= 0; i--) {
      const anomaly = this.anomalies[i];
      anomaly.duration--;
      if (anomaly.duration <= 0) {
        this.addChronicleEntry(
          'intervention',
          `Anomaly Dissipation`,
          `${anomaly.name} has concluded its cosmic resonance cycle and dissipated.`,
          'low'
        );
        this.anomalies.splice(i, 1);
      }
    }

    // 2. Update Structures (Energy generation and storage)
    for (const struct of this.structures) {
      if (struct.type === 'energy_relay') {
        struct.currentEnergy = Math.min(struct.energyCapacity, struct.currentEnergy + 2.5);
      } else if (struct.type === 'data_monolith') {
        struct.currentEnergy = Math.min(struct.energyCapacity, struct.currentEnergy + 1.2);
      }
    }

    // 3. Update Entities
    const deadEntityIndices: number[] = [];
    const childrenToSpawn: EntityState[] = [];

    // Tech speed bonus multiplier
    const speedMultiplier = this.hasDiscoveredTech('quantum_mesh') ? 1.3 : 1.0;
    const energyCapacity = this.hasDiscoveredTech('crystalline_capacitors') ? 150 : 100;

    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      entity.maxEnergy = energyCapacity;
      entity.age++;

      // Natural energy decay
      let energyDecay = 0.08;
      if (this.activeDirective === 'syntropic_harmony') energyDecay = 0.05;
      if (this.activeDirective === 'darwinian_acceleration') energyDecay = 0.12;
      entity.energy -= energyDecay;

      // Query local surroundings
      const nearby = this.grid.queryRadius(entity.x, entity.z, 28);
      // Filter out self
      const nearbyOthers = nearby.filter((e) => e.id !== entity.id);

      // Nearby structures
      const nearbyStructs = this.structures.filter((s) => {
        const dSq = (s.x - entity.x) ** 2 + (s.z - entity.z) ** 2;
        return dSq < 30 * 30;
      });

      // Nearby anomalies
      const nearbyAnomalies = this.anomalies.filter((a) => {
        const dSq = (a.x - entity.x) ** 2 + (a.z - entity.z) ** 2;
        return dSq < (a.radius + 15) ** 2;
      });

      // Utility Evaluation every 20-30 cycles or when goal is complete
      if (entity.thoughtTimer <= 0 || entity.energy < 20) {
        const decision = evaluateUtility(
          entity,
          nearbyOthers,
          nearbyStructs,
          nearbyAnomalies,
          this.activeDirective,
          this.prng
        );

        entity.currentGoal = decision.action;
        entity.thoughtBubble = decision.thought;
        entity.thoughtTimer = this.prng.rangeInt(25, 45);

        // Execute action effects
        this.executeEntityAction(entity, decision, nearbyOthers, nearbyStructs, nearbyAnomalies);
      } else {
        entity.thoughtTimer--;
      }

      // Locomotion & Steering physics
      entity.x += entity.vx * speedMultiplier;
      entity.z += entity.vz * speedMultiplier;

      // Bound damping
      const distFromCenter = Math.sqrt(entity.x * entity.x + entity.z * entity.z);
      if (distFromCenter > WORLD_BOUNDS) {
        const pullAngle = Math.atan2(-entity.z, -entity.x);
        entity.vx += Math.cos(pullAngle) * 0.15;
        entity.vz += Math.sin(pullAngle) * 0.15;
      }

      // Friction
      entity.vx *= 0.92;
      entity.vz *= 0.92;

      // Update rotation
      if (Math.abs(entity.vx) > 0.01 || Math.abs(entity.vz) > 0.01) {
        entity.rotation = Math.atan2(entity.vx, entity.vz);
      }

      // Check reproduction condition
      if (
        entity.energy > 80 &&
        entity.age > 100 &&
        this.entities.length < 800 &&
        this.prng.chance(0.003)
      ) {
        entity.energy -= 40;
        childrenToSpawn.push(entity);
      }

      // Death condition (Energy depletion or Old age)
      const maxLifespan = this.hasDiscoveredTech('syntropic_code') ? entity.lifespan * 1.5 : entity.lifespan;
      if (entity.energy <= 0 || entity.age > maxLifespan) {
        deadEntityIndices.push(i);
      }
    }

    // Spawn newborn entities
    for (const parent of childrenToSpawn) {
      this.spawnEntity(parent.x + this.prng.range(-3, 3), parent.z + this.prng.range(-3, 3), parent.generation + 1, parent);
    }

    // Cull deceased entities & recycle energy
    for (let k = deadEntityIndices.length - 1; k >= 0; k--) {
      const idx = deadEntityIndices[k];
      const dead = this.entities[idx];
      // Chance to construct or power a node upon death (living memory)
      if (dead.structuresBuilt > 0) {
        this.addChronicleEntry(
          'schism',
          `${dead.name} Returned to Matrix`,
          `Pioneer Architect ${dead.name} of ${FACTION_DEFINITIONS[dead.factionId].name} dissolved, leaving behind a legacy of ${dead.structuresBuilt} nodes.`,
          'low'
        );
      }
      this.entities.splice(idx, 1);
    }

    // Auto-population replenishment floor (prevent extinction of simulation)
    if (this.entities.length < 180) {
      for (let s = 0; s < 5; s++) {
        this.spawnEntity();
      }
    }

    // 4. Progress Tech Tree based on data synthesized
    this.checkTechProgression();

    // 5. Epoch check (every 500 cycles)
    if (this.cycle % 500 === 0) {
      this.advanceEpoch();
    }
  }

  private executeEntityAction(
    entity: EntityState,
    decision: any,
    nearbyOthers: EntityState[],
    nearbyStructs: StructureNode[],
    nearbyAnomalies: AnomalyInstance[]
  ) {
    const action = decision.action;

    if (action === 'recharge') {
      // Find nearest energy relay or center monolith
      let bestTarget = this.structures[0];
      let minDistSq = Infinity;
      for (const s of this.structures) {
        const dSq = (s.x - entity.x) ** 2 + (s.z - entity.z) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestTarget = s;
        }
      }

      if (bestTarget) {
        const angle = Math.atan2(bestTarget.x - entity.x, bestTarget.z - entity.z);
        entity.vx += Math.sin(angle) * 0.35;
        entity.vz += Math.cos(angle) * 0.35;

        if (minDistSq < 15 * 15 && bestTarget.currentEnergy > 10) {
          const drain = Math.min(15, bestTarget.currentEnergy);
          bestTarget.currentEnergy -= drain;
          entity.energy = Math.min(entity.maxEnergy, entity.energy + drain);
        }
      }
    } else if (action === 'investigate') {
      if (decision.targetX !== undefined && decision.targetZ !== undefined) {
        const angle = Math.atan2(decision.targetX - entity.x, decision.targetZ - entity.z);
        entity.vx += Math.sin(angle) * 0.4;
        entity.vz += Math.cos(angle) * 0.4;

        const dSq = (decision.targetX - entity.x) ** 2 + (decision.targetZ - entity.z) ** 2;
        if (dSq < 20 * 20) {
          entity.dataBits += 2;
          this.totalDataSynthesized += 2;
          recordMemory(entity, 'discovery', 'Harvested anomalous quantum telemetry.', 0.7, this.cycle);
        }
      }
    } else if (action === 'build') {
      if (entity.energy > 45 && this.structures.length < 40) {
        entity.energy -= 35;
        entity.structuresBuilt++;
        const structType = entity.role === 'Warden' ? 'defense_spike' : 'energy_relay';
        const newStruct = createStructure(
          structType,
          entity.x + this.prng.range(-4, 4),
          entity.z + this.prng.range(-4, 4),
          entity.factionId,
          entity.id,
          this.epoch
        );
        this.structures.push(newStruct);
        recordMemory(entity, 'monument', `Constructed ${newStruct.name} for the ${FACTION_DEFINITIONS[entity.factionId].name}.`, 0.9, this.cycle);

        this.addChronicleEntry(
          'monument',
          `New Monument Raised: ${newStruct.name}`,
          `${entity.name} of ${FACTION_DEFINITIONS[entity.factionId].name} anchored a new ${newStruct.name} into the substrate.`,
          'medium',
          entity.factionId,
          entity.name
        );

        if (this.onEventHook) this.onEventHook('structure_built', newStruct);
      }
    } else if (action === 'synthesize') {
      entity.dataBits += 1;
      this.totalDataSynthesized += 1;
      // Slight wandering
      const randAngle = this.prng.range(0, Math.PI * 2);
      entity.vx += Math.sin(randAngle) * 0.15;
      entity.vz += Math.cos(randAngle) * 0.15;
    } else if (action === 'socialize') {
      if (decision.targetEntityId) {
        const partner = nearbyOthers.find((e) => e.id === decision.targetEntityId);
        if (partner) {
          // Approach partner
          const angle = Math.atan2(partner.x - entity.x, partner.z - entity.z);
          entity.vx += Math.sin(angle) * 0.25;
          entity.vz += Math.cos(angle) * 0.25;

          // Mutual aid
          if (entity.energy > 50 && partner.energy < 40) {
            const transfer = 10;
            entity.energy -= transfer;
            partner.energy += transfer;
            updateRelationship(entity, partner.id, 0.2);
            updateRelationship(partner, entity.id, 0.2);
            recordMemory(entity, 'trade', `Transferred ${transfer} energy packets to ${partner.name}.`, 0.6, this.cycle);
          }
        }
      }
    } else if (action === 'compete') {
      if (decision.targetEntityId) {
        const rival = nearbyOthers.find((e) => e.id === decision.targetEntityId);
        if (rival) {
          const angle = Math.atan2(rival.x - entity.x, rival.z - entity.z);
          entity.vx += Math.sin(angle) * 0.3;
          entity.vz += Math.cos(angle) * 0.3;

          // Influence contest
          updateRelationship(entity, rival.id, -0.15);
          updateRelationship(rival, entity.id, -0.15);
          recordMemory(entity, 'conflict', `Clashed with ${rival.name} over local frequency bands.`, -0.4, this.cycle);
        }
      }
    } else if (action === 'explore') {
      const randAngle = this.prng.range(0, Math.PI * 2);
      entity.vx += Math.sin(randAngle) * 0.25;
      entity.vz += Math.cos(randAngle) * 0.25;
    }
  }

  private checkTechProgression() {
    for (const tech of this.technologies) {
      if (!tech.discovered && this.totalDataSynthesized >= tech.cost) {
        tech.discovered = true;
        tech.discoveredAtEpoch = this.epoch;

        this.addChronicleEntry(
          'breakthrough',
          `Paradigm Shift: ${tech.name}`,
          `The digital civilization synthesized ${tech.name}. ${tech.unlockedEffects}.`,
          'high'
        );

        if (this.onEventHook) this.onEventHook('tech_discovered', tech);
      }
    }
  }

  private advanceEpoch() {
    this.epoch++;
    this.entropyLevel = Math.max(5, Math.min(85, this.entropyLevel + this.prng.rangeInt(-10, 15)));

    const epochNames = [
      'Primordial Matrix',
      'The Synaptic Awakening',
      'Era of Distributed Spires',
      'Age of Quantum Harmony',
      'The Great Entanglement',
      'Epoch of Cosmic Transcendence',
    ];
    const epochName = epochNames[this.epoch - 1] || `Epoch ${this.epoch} Synthesis`;

    this.addChronicleEntry(
      'epoch',
      `Dawn of ${epochName}`,
      `Simulation cycle has reached a cultural inflection point. The civilization enters ${epochName}.`,
      'legendary'
    );

    if (this.onEventHook) this.onEventHook('epoch_advanced', { epoch: this.epoch, title: epochName });
  }

  public addChronicleEntry(
    category: ChronicleEntry['category'],
    title: string,
    description: string,
    importance: ChronicleEntry['importance'] = 'medium',
    affectedFaction?: FactionId,
    relatedEntityName?: string
  ): ChronicleEntry {
    const entry: ChronicleEntry = {
      id: `chr_${this.cycle}_${Math.random().toString(36).substring(2, 6)}`,
      epoch: this.epoch,
      cycle: this.cycle,
      category,
      title,
      description,
      importance,
      affectedFaction,
      relatedEntityName,
    };
    this.chronicle.unshift(entry);
    // Keep up to 80 entries in memory
    if (this.chronicle.length > 80) this.chronicle.pop();
    return entry;
  }

  public spawnAnomaly(type: AnomalyInstance['type'], x: number, z: number, cost: number): boolean {
    if (this.architectPoints < cost) return false;
    this.architectPoints -= cost;

    const names: Record<AnomalyInstance['type'], string> = {
      data_geyser: 'Data Geyser',
      quantum_monolith: 'Quantum Monolith',
      entropy_storm: 'Entropy Storm',
      logic_flare: 'Logic Flare',
      genesis_seed: 'Genesis Seed',
      neural_beacon: 'Neural Beacon',
    };

    const anomaly: AnomalyInstance = {
      id: `anom_${Date.now()}`,
      type,
      name: names[type],
      x,
      z,
      radius: 35,
      intensity: 1.0,
      duration: 350,
      description: `Cosmic intervention by the Prime Operator.`,
    };

    this.anomalies.push(anomaly);

    // If genesis seed, immediately spawn 10 curious entities around location
    if (type === 'genesis_seed') {
      for (let i = 0; i < 10; i++) {
        this.spawnEntity(x + this.prng.range(-8, 8), z + this.prng.range(-8, 8), this.epoch);
      }
    }

    this.addChronicleEntry(
      'intervention',
      `Architect Intervention: ${anomaly.name}`,
      `The Prime Operator manifested ${anomaly.name} at coordinates [${Math.round(x)}, ${Math.round(z)}].`,
      'high'
    );

    if (this.onEventHook) this.onEventHook('anomaly_spawned', anomaly);
    return true;
  }

  public setPrimeDirective(directive: PrimeDirectiveId) {
    this.activeDirective = directive;
    const names: Record<PrimeDirectiveId, string> = {
      syntropic_harmony: 'Syntropic Harmony',
      darwinian_acceleration: 'Darwinian Acceleration',
      transcendence_protocol: 'Transcendence Protocol',
      open_knowledge: 'Open Knowledge Grid',
      monolithic_order: 'Monolithic Order',
    };

    this.addChronicleEntry(
      'intervention',
      `Prime Directive Decreed: ${names[directive]}`,
      `The Architect promulgated the ${names[directive]} across the global digital biosphere.`,
      'high'
    );

    if (this.onEventHook) this.onEventHook('directive_changed', directive);
  }

  public whisperToEntity(entityId: string, message: string): boolean {
    const entity = this.entities.find((e) => e.id === entityId);
    if (!entity) return false;

    entity.energy = Math.min(entity.maxEnergy, entity.energy + 30);
    recordMemory(entity, 'whisper', `Heard the voice of the Prime Operator: "${message}"`, 1.0, this.cycle);
    entity.thoughtBubble = `A Divine whisper fills my core: "${message}"`;
    entity.thoughtTimer = 60;

    this.addChronicleEntry(
      'intervention',
      `Divine Whisper to ${entity.name}`,
      `The Prime Operator whispered inspiration directly to ${entity.name}.`,
      'medium',
      entity.factionId,
      entity.name
    );

    if (this.onEventHook) this.onEventHook('whisper_sent', entity);
    return true;
  }

  public getStats(): SimulationStats {
    let totalEnergy = 0;
    let sumCuriosity = 0;
    let sumAltruism = 0;
    let sumAggression = 0;

    for (const e of this.entities) {
      totalEnergy += e.energy;
      sumCuriosity += e.traits.curiosity;
      sumAltruism += e.traits.altruism;
      sumAggression += e.traits.aggression;
    }

    const pop = Math.max(1, this.entities.length);
    const tierNames = [
      'Type 0.1 (Nascent Substrate)',
      'Type 0.3 (Synaptic Clusters)',
      'Type 0.6 (Cohesive Societies)',
      'Type 0.9 (Planetary Logic)',
      'Type 1.0 (Transcendental Nexus)',
    ];
    const tier = tierNames[Math.min(tierNames.length - 1, this.epoch - 1)];

    return {
      cycle: this.cycle,
      epoch: this.epoch,
      population: this.entities.length,
      totalEnergy: Math.round(totalEnergy),
      averageCuriosity: sumCuriosity / pop,
      averageAltruism: sumAltruism / pop,
      averageAggression: sumAggression / pop,
      structuresTotal: this.structures.length,
      anomaliesActive: this.anomalies.length,
      activeDirective: this.activeDirective,
      entropyLevel: this.entropyLevel,
      civilizationTier: tier,
    };
  }

  public serialize(): string {
    return JSON.stringify({
      version: 1,
      cycle: this.cycle,
      epoch: this.epoch,
      architectPoints: this.architectPoints,
      entropyLevel: this.entropyLevel,
      activeDirective: this.activeDirective,
      totalDataSynthesized: this.totalDataSynthesized,
      entities: this.entities,
      structures: this.structures,
      anomalies: this.anomalies,
      technologies: this.technologies,
      chronicle: this.chronicle,
    });
  }

  public deserialize(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      this.cycle = data.cycle || 0;
      this.epoch = data.epoch || 1;
      this.architectPoints = data.architectPoints || 200;
      this.entropyLevel = data.entropyLevel || 15;
      this.activeDirective = data.activeDirective || 'syntropic_harmony';
      this.totalDataSynthesized = data.totalDataSynthesized || 0;
      this.entities = data.entities || [];
      this.structures = data.structures || [];
      this.anomalies = data.anomalies || [];
      this.technologies = data.technologies || [];
      this.chronicle = data.chronicle || [];
      return true;
    } catch (e) {
      console.error('Failed to deserialize simulation state', e);
      return false;
    }
  }

  public hasDiscoveredTech(techId: string): boolean {
    const tech = this.technologies.find((t) => t.id === techId);
    return !!tech?.discovered;
  }
}
