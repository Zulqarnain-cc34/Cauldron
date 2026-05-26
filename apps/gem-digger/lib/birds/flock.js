/**
 * Boids flocking with metric OR topological neighbor rules (Vicsek / Ballerini-style).
 * Toroidal X + sky-band Y — see boundaries.js.
 */

import { birdSimConfig } from './config.js';
import { toroidalDelta, toroidalVectorTo } from './boundaries.js';
import { forEachBirdNearby } from './spatial.js';

/** @typedef {import('./birds.js').Bird} Bird */
/** @typedef {import('./boundaries.js').SkyArena} SkyArena */
/** @typedef {ReturnType<import('./spatial.js').buildBirdSpatialIndex>} BirdSpatialIndex */

function flockQueryRadius() {
  const { interactionMode, perception, topologicalNeighbors } = birdSimConfig.flock;
  if (interactionMode === 'metric') return Math.max(perception, birdSimConfig.flock.separationRadius);
  return Math.max(birdSimConfig.flock.separationRadius, topologicalNeighbors * 8, 40);
}

function clampMag(x, y, max) {
  const m = Math.hypot(x, y);
  if (m <= max || m === 0) return [x, y];
  const s = max / m;
  return [x * s, y * s];
}

function steer(bird, tx, ty, maxForce) {
  let sx = tx - bird.vx;
  let sy = ty - bird.vy;
  return clampMag(sx, sy, maxForce);
}

function seek(bird, tx, ty, maxSpeed, maxForce, arena) {
  const [dx, dy] = toroidalVectorTo(bird.x, bird.y, tx, ty, arena);
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return [0, 0];
  const sx = (dx / d) * maxSpeed;
  const sy = (dy / d) * maxSpeed;
  return steer(bird, sx, sy, maxForce);
}

/** @param {{ other: Bird, d: number }[]} nearest @param {Bird} other @param {number} d @param {number} k */
function pushNearest(nearest, other, d, k) {
  if (nearest.length < k) {
    nearest.push({ other, d });
    return;
  }
  let worst = 0;
  for (let i = 1; i < nearest.length; i++) {
    if (nearest[i].d > nearest[worst].d) worst = i;
  }
  if (d < nearest[worst].d) nearest[worst] = { other, d };
}

/**
 * One spatial pass: separation + interaction neighbours.
 * @param {Bird} bird
 * @param {BirdSpatialIndex} spatial
 * @param {SkyArena} arena
 * @param {number} maxForce
 * @returns {{ neighbors: Bird[], sepAx: number, sepAy: number, crowded: boolean }}
 */
export function computeLocalFlockData(bird, spatial, arena, maxForce) {
  const { interactionMode, perception, topologicalNeighbors, separationRadius, personalSpace, weightSep } =
    birdSimConfig.flock;

  const queryR = flockQueryRadius();
  const sepR2 = separationRadius * separationRadius;
  const k = Math.max(1, Math.round(topologicalNeighbors));

  /** @type {{ other: Bird, d: number }[]} */
  const nearest = [];
  let sx = 0;
  let sy = 0;
  let sepN = 0;
  let crowded = false;

  forEachBirdNearby(spatial, bird, arena, queryR, (other, dx, dy, d) => {
    const d2 = d * d;
    if (d < personalSpace * 1.15) crowded = true;
    if (d2 <= sepR2) {
      if (d < 0.001) {
        const a = ((bird.x + bird.y * 3) % 628) / 100;
        sx += Math.cos(a) * 8;
        sy += Math.sin(a) * 8;
      } else {
        const ux = dx / d;
        const uy = dy / d;
        if (d < personalSpace) {
          const push = ((personalSpace - d) / personalSpace) ** 2;
          sx += ux * push * 5;
          sy += uy * push * 5;
        } else {
          const w = 1 / (d * d);
          sx += ux * w;
          sy += uy * w;
        }
      }
      sepN++;
    }

    if (interactionMode === 'metric' && d > perception) return;
    if (interactionMode === 'topological') {
      pushNearest(nearest, other, d, k);
    } else {
      nearest.push({ other, d });
    }
  });

  let sepAx = 0;
  let sepAy = 0;
  if (sepN > 0) {
    const [ax, ay] = steer(bird, sx / sepN, sy / sepN, maxForce);
    sepAx = ax * weightSep;
    sepAy = ay * weightSep;
  }

  if (interactionMode === 'topological') {
    nearest.sort((a, b) => a.d - b.d);
  }

  return {
    neighbors: nearest.map((c) => c.other),
    sepAx,
    sepAy,
    crowded,
  };
}

/**
 * @param {Bird} bird
 * @param {Bird[]} flockmates
 * @param {SkyArena} arena
 * @returns {Bird[]}
 */
export function getFlockNeighbors(bird, flockmates, arena) {
  const { interactionMode, perception, topologicalNeighbors } = birdSimConfig.flock;
  /** @type {{ other: Bird, d: number }[]} */
  const candidates = [];

  for (const other of flockmates) {
    if (other === bird) continue;
    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
    const d = Math.hypot(dx, dy);
    if (interactionMode === 'metric' && d > perception) continue;
    candidates.push({ other, d });
  }

  if (interactionMode === 'topological') {
    candidates.sort((a, b) => a.d - b.d);
    const k = Math.max(1, Math.round(topologicalNeighbors));
    return candidates.slice(0, k).map((c) => c.other);
  }

  return candidates.map((c) => c.other);
}

/**
 * @param {Bird} bird
 * @param {Bird[]} neighbors
 * @param {number} maxSpeed
 * @param {number} maxForce
 * @param {SkyArena} arena
 */
export function computeFlockAcceleration(bird, neighbors, maxSpeed, maxForce, arena) {
  const { minFlockSize, weightAli, weightCoh, cohesionSpeed } = birdSimConfig.flock;

  if (neighbors.length < minFlockSize) return [0, 0];

  let aliX = 0;
  let aliY = 0;
  let cohDx = 0;
  let cohDy = 0;
  let avgDist = 0;
  const n = neighbors.length;

  for (const other of neighbors) {
    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
    avgDist += Math.hypot(dx, dy);
    aliX += other.vx;
    aliY += other.vy;
    const [towardX, towardY] = toroidalVectorTo(bird.x, bird.y, other.x, other.y, arena);
    cohDx += towardX;
    cohDy += towardY;
  }

  avgDist /= n;
  const ps = birdSimConfig.flock.personalSpace;
  // Tight rings: weaken align/cohesion (main cause of "birds orbiting each other").
  const crowd =
    avgDist < ps * 1.2 ? 0.12 : avgDist < ps * 2 ? 0.35 : avgDist < ps * 3.5 ? 0.65 : 1;
  const alignScale =
    avgDist < ps * 1.2 ? 0.2 : avgDist < ps * 2 ? 0.45 : 1;

  let ax = 0;
  let ay = 0;

  aliX /= n;
  aliY /= n;
  const [alx, aly] = steer(bird, aliX, aliY, maxForce);
  ax += alx * weightAli * alignScale;
  ay += aly * weightAli * alignScale;

  const targetX = bird.x + cohDx / n;
  const targetY = bird.y + cohDy / n;
  const [cx, cy] = seek(bird, targetX, targetY, maxSpeed * cohesionSpeed, maxForce, arena);
  ax += cx * weightCoh * crowd;
  ay += cy * weightCoh * crowd;

  return clampMag(ax, ay, maxForce);
}

/** @deprecated use getFlockNeighbors */
export function withinPerception(a, b, arena) {
  return getFlockNeighbors(a, [b], arena).length > 0;
}

export function getFlockMinSize() {
  return birdSimConfig.flock.minFlockSize;
}

/**
 * Vicsek order parameter φ = |Σ v̂| / N (global flock alignment, 0–1).
 * @param {Bird[]} birds
 */
export function computeVicsekOrder(birds) {
  if (!birds.length) return 0;
  let sumVx = 0;
  let sumVy = 0;
  for (const b of birds) {
    const m = Math.hypot(b.vx, b.vy);
    if (m < 0.001) continue;
    sumVx += b.vx / m;
    sumVy += b.vy / m;
  }
  return Math.min(1, Math.hypot(sumVx, sumVy) / birds.length);
}
