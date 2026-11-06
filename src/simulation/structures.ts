import { FactionId, StructureNode } from '../types/simulation';

export function createStructure(
  type: StructureNode['type'],
  x: number,
  z: number,
  factionId: FactionId,
  builderId: string,
  epoch: number
): StructureNode {
  const names: Record<StructureNode['type'], string> = {
    energy_relay: 'Energy Relay Tower',
    data_monolith: 'Crystalline Data Monolith',
    synthesis_sanctuary: 'Synthesis Sanctuary',
    defense_spike: 'Resonance Defense Spike',
    quantum_gateway: 'Transcendence Gateway',
  };

  const capacity: Record<StructureNode['type'], number> = {
    energy_relay: 500,
    data_monolith: 800,
    synthesis_sanctuary: 1200,
    defense_spike: 400,
    quantum_gateway: 3000,
  };

  return {
    id: `struct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    name: names[type],
    x,
    z,
    factionId,
    level: 1,
    energyCapacity: capacity[type],
    currentEnergy: capacity[type] * 0.5,
    builtByEntityId: builderId,
    constructedAtEpoch: epoch,
  };
}
