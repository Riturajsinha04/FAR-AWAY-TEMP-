// src/utils/trackGeometry.ts
// Mathematical bezier and track path calculation for realistic railway simulation

export interface TrackPoint {
  x: number;
  y: number;
  angleDeg: number;
}

// Coordinate space bounds
export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 440;

// Track Y-coordinates
export const Y_UP_MAIN = 220;
export const Y_DOWN_MAIN = 330;
export const Y_LOOP_2 = 130;
export const Y_LOOP_1 = 90;
export const Y_PANIPAT_SIDING = 390;
export const Y_AMBALA_SIDING = 160;

// Station X-coordinates
export const X_AMBALA = 100;
export const X_KURUKSHETRA = 600;
export const X_PANIPAT = 1100;

// Kilometer to base X coordinate (0 km -> 100, 100 km -> 1100)
export function kmToX(km: number): number {
  const minX = 80;
  const maxX = 1120;
  return minX + (km / 100) * (maxX - minX);
}

// Convert X coordinate back to approximate km
export function xToKm(x: number): number {
  const minX = 80;
  const maxX = 1120;
  return Math.max(0, Math.min(100, ((x - minX) / (maxX - minX)) * 100));
}

// Cubic bezier evaluator: B(t) for t in [0, 1]
function cubicBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number; dx: number; dy: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  // Position
  const x = mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x;
  const y = mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y;

  // First derivative (tangent)
  const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
  const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);

  return { x, y, dx, dy };
}

// Compute the exact physical track position and rotation angle for any train
export function getTrainTrackPoint(
  positionKm: number,
  track: 'UP_MAIN' | 'DOWN_MAIN' | 'LOOP_1' | 'LOOP_2' | 'LOOP_3',
  direction: 'UP' | 'DOWN'
): TrackPoint {
  if (direction === 'DOWN') {
    // DOWN line runs right to left (100km -> 0km)
    const x = kmToX(positionKm);
    
    // Check if on Panipat Siding
    if (track === 'LOOP_3' && positionKm >= 80 && positionKm <= 96) {
      const switchInX = kmToX(96);
      const loopStartX = kmToX(92);
      const loopEndX = kmToX(84);
      const switchOutX = kmToX(80);

      if (x > loopStartX) {
        // Entering siding curve (from 96k to 92k)
        const t = (switchInX - x) / (switchInX - loopStartX);
        const b = cubicBezier(
          { x: switchInX, y: Y_DOWN_MAIN },
          { x: switchInX - 20, y: Y_DOWN_MAIN },
          { x: loopStartX + 20, y: Y_PANIPAT_SIDING },
          { x: loopStartX, y: Y_PANIPAT_SIDING },
          t
        );
        return { x: b.x, y: b.y, angleDeg: 180 + (Math.atan2(b.dy, -b.dx) * 180) / Math.PI };
      } else if (x < loopEndX) {
        // Exiting siding curve (from 84k to 80k)
        const t = (loopEndX - x) / (loopEndX - switchOutX);
        const b = cubicBezier(
          { x: loopEndX, y: Y_PANIPAT_SIDING },
          { x: loopEndX - 20, y: Y_PANIPAT_SIDING },
          { x: switchOutX + 20, y: Y_DOWN_MAIN },
          { x: switchOutX, y: Y_DOWN_MAIN },
          t
        );
        return { x: b.x, y: b.y, angleDeg: 180 + (Math.atan2(b.dy, -b.dx) * 180) / Math.PI };
      } else {
        return { x, y: Y_PANIPAT_SIDING, angleDeg: 180 };
      }
    }

    return { x, y: Y_DOWN_MAIN, angleDeg: 180 };
  }

  // UP line runs left to right (0km -> 100km)
  const x = kmToX(positionKm);

  // If routed on Kurukshetra Loop 2 (Branch Track)
  if (track === 'LOOP_2') {
    const switchInX = kmToX(42); // 516.8px
    const loopStartX = kmToX(48); // 579.2px
    const loopEndX = kmToX(56); // 662.4px
    const switchOutX = kmToX(64); // 745.6px

    if (x < switchInX) {
      // Approach before switch
      return { x, y: Y_UP_MAIN, angleDeg: 0 };
    } else if (x <= loopStartX) {
      // Turnout curve climbing into Loop 2
      const t = Math.max(0, Math.min(1, (x - switchInX) / (loopStartX - switchInX)));
      const b = cubicBezier(
        { x: switchInX, y: Y_UP_MAIN },
        { x: switchInX + 30, y: Y_UP_MAIN },
        { x: loopStartX - 30, y: Y_LOOP_2 },
        { x: loopStartX, y: Y_LOOP_2 },
        t
      );
      const angle = (Math.atan2(b.dy, b.dx) * 180) / Math.PI;
      return { x: b.x, y: b.y, angleDeg: angle };
    } else if (x <= loopEndX) {
      // Platform loop line
      return { x, y: Y_LOOP_2, angleDeg: 0 };
    } else if (x <= switchOutX) {
      // Turnout curve descending back to UP Main
      const t = Math.max(0, Math.min(1, (x - loopEndX) / (switchOutX - loopEndX)));
      const b = cubicBezier(
        { x: loopEndX, y: Y_LOOP_2 },
        { x: loopEndX + 30, y: Y_LOOP_2 },
        { x: switchOutX - 30, y: Y_UP_MAIN },
        { x: switchOutX, y: Y_UP_MAIN },
        t
      );
      const angle = (Math.atan2(b.dy, b.dx) * 180) / Math.PI;
      return { x: b.x, y: b.y, angleDeg: angle };
    } else {
      // Rejoined main line
      return { x, y: Y_UP_MAIN, angleDeg: 0 };
    }
  }

  // Default UP Main track
  return { x, y: Y_UP_MAIN, angleDeg: 0 };
}

// Pre-calculated SVG path strings for static track rendering
export const TRACK_PATHS = {
  // UP Main Line (Extended 2x further off screen boundaries)
  upMain: `M -800,${Y_UP_MAIN} L 2000,${Y_UP_MAIN}`,

  // DOWN Main Line (Extended 2x further off screen boundaries)
  downMain: `M 2000,${Y_DOWN_MAIN} L -800,${Y_DOWN_MAIN}`,

  // Kurukshetra Loop 2 (Upper bypass line)
  krlLoop2: `M ${kmToX(42)},${Y_UP_MAIN} C ${kmToX(42) + 30},${Y_UP_MAIN} ${kmToX(48) - 30},${Y_LOOP_2} ${kmToX(48)},${Y_LOOP_2} L ${kmToX(56)},${Y_LOOP_2} C ${kmToX(56) + 30},${Y_LOOP_2} ${kmToX(64) - 30},${Y_UP_MAIN} ${kmToX(64)},${Y_UP_MAIN}`,

  // Kurukshetra Loop 1 (Inner loop siding)
  krlLoop1: `M ${kmToX(46)},${Y_LOOP_2} C ${kmToX(48)},${Y_LOOP_2} ${kmToX(49)},${Y_LOOP_1} ${kmToX(51)},${Y_LOOP_1} L ${kmToX(57)},${Y_LOOP_1} C ${kmToX(59)},${Y_LOOP_1} ${kmToX(60)},${Y_LOOP_2} ${kmToX(62)},${Y_LOOP_2}`,

  // Panipat DOWN Siding
  pnpSiding: `M ${kmToX(96)},${Y_DOWN_MAIN} C ${kmToX(94)},${Y_DOWN_MAIN} ${kmToX(93)},${Y_PANIPAT_SIDING} ${kmToX(91)},${Y_PANIPAT_SIDING} L ${kmToX(85)},${Y_PANIPAT_SIDING} C ${kmToX(83)},${Y_PANIPAT_SIDING} ${kmToX(82)},${Y_DOWN_MAIN} ${kmToX(80)},${Y_DOWN_MAIN}`,

  // Ambala Yard Siding
  ambSiding: `M ${kmToX(8)},${Y_UP_MAIN} C ${kmToX(11)},${Y_UP_MAIN} ${kmToX(12)},${Y_AMBALA_SIDING} ${kmToX(14)},${Y_AMBALA_SIDING} L ${kmToX(22)},${Y_AMBALA_SIDING} C ${kmToX(24)},${Y_AMBALA_SIDING} ${kmToX(25)},${Y_UP_MAIN} ${kmToX(28)},${Y_UP_MAIN}`,

  // 1. Ambala Junction Scissors Crossover (X-Crossing)
  ambCrossover1: `M ${kmToX(10)},${Y_UP_MAIN} C ${kmToX(13)},${Y_UP_MAIN} ${kmToX(17)},${Y_DOWN_MAIN} ${kmToX(20)},${Y_DOWN_MAIN}`,
  ambCrossover2: `M ${kmToX(10)},${Y_DOWN_MAIN} C ${kmToX(13)},${Y_DOWN_MAIN} ${kmToX(17)},${Y_UP_MAIN} ${kmToX(20)},${Y_UP_MAIN}`,

  // 2. Kurukshetra Junction Scissors Crossover (X-Crossing)
  krlCrossover1: `M ${kmToX(34)},${Y_UP_MAIN} C ${kmToX(37)},${Y_UP_MAIN} ${kmToX(40)},${Y_DOWN_MAIN} ${kmToX(43)},${Y_DOWN_MAIN}`,
  krlCrossover2: `M ${kmToX(34)},${Y_DOWN_MAIN} C ${kmToX(37)},${Y_DOWN_MAIN} ${kmToX(40)},${Y_UP_MAIN} ${kmToX(43)},${Y_UP_MAIN}`,

  // 3. Panipat Junction Scissors Crossover (X-Crossing)
  pnpCrossover1: `M ${kmToX(72)},${Y_UP_MAIN} C ${kmToX(75)},${Y_UP_MAIN} ${kmToX(79)},${Y_DOWN_MAIN} ${kmToX(82)},${Y_DOWN_MAIN}`,
  pnpCrossover2: `M ${kmToX(72)},${Y_DOWN_MAIN} C ${kmToX(75)},${Y_DOWN_MAIN} ${kmToX(79)},${Y_UP_MAIN} ${kmToX(82)},${Y_UP_MAIN}`
};
