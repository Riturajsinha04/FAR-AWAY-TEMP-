// src/utils/trackGraph.ts
// Graph-Grounded Track Model for 106km Ghaziabad (GZB) to Aligarh (ALJN) Trunk Corridor

export interface BlockSection {
  id: string;
  fromKm: number;
  toKm: number;
  status: 'CLEAR' | 'OCCUPIED' | 'RESTRICTED';
  occupiedByTrainId?: string;
}

export interface LoopLine {
  id: string;
  name: string;
  csrMeters: number; // Clear Standing Room (715m standard, 1500m Long-Haul)
  isAvailable: boolean;
  maxSpeedKmh: number;
}

export interface GraphStation {
  id: string;
  name: string;
  km: number;
  loopLines: LoopLine[];
  hasCrossover: boolean;
}

export interface TrackGraph {
  corridorName: string;
  lengthKm: number;
  stations: GraphStation[];
  blocks: BlockSection[];
}

// 106km Ghaziabad to Aligarh Railway Sector Graph
export const GZB_ALJN_GRAPH: TrackGraph = {
  corridorName: 'Ghaziabad (GZB) - Aligarh (ALJN) 106km Trunk Corridor',
  lengthKm: 106,
  stations: [
    {
      id: 'GZB',
      name: 'Ghaziabad Jn (GZB)',
      km: 0,
      hasCrossover: true,
      loopLines: [
        { id: 'GZB_L1', name: 'Loop Line 1', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 },
        { id: 'GZB_L2', name: 'Loop Line 2', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 }
      ]
    },
    {
      id: 'DER',
      name: 'Dadri (DER)',
      km: 20,
      hasCrossover: true,
      loopLines: [
        { id: 'DER_L1', name: 'Loop Line 1 (Standard)', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 },
        { id: 'DER_L2', name: 'DFCCIL Container Siding', csrMeters: 1500, isAvailable: true, maxSpeedKmh: 45 }
      ]
    },
    {
      id: 'SKQ',
      name: 'Sikandrabad (SKQ)',
      km: 42,
      hasCrossover: true,
      loopLines: [
        { id: 'SKQ_L1', name: 'Loop Line 1 (Short)', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 }
      ]
    },
    {
      id: 'KRJ',
      name: 'Khurja Jn (KRJ)',
      km: 64,
      hasCrossover: true,
      loopLines: [
        { id: 'KRJ_L1', name: 'Loop Line 1', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 },
        { id: 'KRJ_L2', name: 'Loop Line 2', csrMeters: 715, isAvailable: false, maxSpeedKmh: 30 },
        { id: 'KRJ_L3', name: 'Long-Haul Freight Loop', csrMeters: 1500, isAvailable: true, maxSpeedKmh: 40 }
      ]
    },
    {
      id: 'SOM',
      name: 'Somna (SOM)',
      km: 85,
      hasCrossover: false,
      loopLines: [
        { id: 'SOM_L1', name: 'Loop Line 1', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 }
      ]
    },
    {
      id: 'ALJN',
      name: 'Aligarh Jn (ALJN)',
      km: 106,
      hasCrossover: true,
      loopLines: [
        { id: 'ALJN_L1', name: 'Platform 1', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 },
        { id: 'ALJN_L2', name: 'Platform 2', csrMeters: 715, isAvailable: true, maxSpeedKmh: 30 },
        { id: 'ALJN_L3', name: 'Freight Terminal Yard', csrMeters: 1500, isAvailable: true, maxSpeedKmh: 30 }
      ]
    }
  ],
  // 53 automatic signaling blocks of 2km each
  blocks: Array.from({ length: 53 }, (_, i) => ({
    id: `BLK_${i * 2}_${(i + 1) * 2}`,
    fromKm: i * 2,
    toKm: (i + 1) * 2,
    status: 'CLEAR'
  }))
};

// Tool Functions Implementation
export function checkBlockStatus(graph: TrackGraph, kmStart: number, kmEnd: number): { isClear: boolean; occupiedBy?: string; blocks: BlockSection[] } {
  const matchingBlocks = graph.blocks.filter(b => b.toKm > kmStart && b.fromKm < kmEnd);
  const occupied = matchingBlocks.find(b => b.status !== 'CLEAR');
  return {
    isClear: !occupied,
    occupiedBy: occupied?.occupiedByTrainId,
    blocks: matchingBlocks
  };
}

export function getLoopCapacity(graph: TrackGraph, stationName: string): { stationFound: boolean; availableLoops: LoopLine[] } {
  const station = graph.stations.find(s => s.name.toLowerCase().includes(stationName.toLowerCase()) || s.id.toLowerCase() === stationName.toLowerCase());
  if (!station) return { stationFound: false, availableLoops: [] };
  return {
    stationFound: true,
    availableLoops: station.loopLines.filter(l => l.isAvailable)
  };
}

export function calculateBrakingDistance(trainWeightTons: number, currentSpeedKmh: number, gradientRatio: number = 0): { brakingDistanceKm: number; isGradientPenalty: boolean } {
  // Kinetic energy & braking distance model: D = (v^2) / (2 * a * 3.6^2)
  // Base deceleration for freight: 0.35 m/s^2, passenger: 0.75 m/s^2
  const isFreight = trainWeightTons >= 2000;
  const baseDecel = isFreight ? 0.35 : 0.75;
  // Gradient effect (1:100 uphill reduces braking dist, downhill increases it)
  const effectiveDecel = Math.max(0.15, baseDecel + gradientRatio * 0.1);
  const speedMs = currentSpeedKmh / 3.6;
  const distMeters = (speedMs * speedMs) / (2 * effectiveDecel);
  const distanceKm = Number((distMeters / 1000).toFixed(2));
  return {
    brakingDistanceKm: distanceKm,
    isGradientPenalty: isFreight && currentSpeedKmh === 0
  };
}
