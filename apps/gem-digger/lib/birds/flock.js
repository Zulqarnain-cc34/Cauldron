/**
 * Boids flocking with metric OR topological neighbor rules (Vicsek / Ballerini-style).
 * Toroidal X + sky-band Y — see boundaries.js.
 */

import { birdSimConfig } from './config.js';
import { toroidalDelta, toroidalVectorTo } from './boundaries.js';

/** @typedef {import('./birds.js').Bird} Bird */
/** @typedef {import('./boundaries.js').SkyArena} SkyArena */

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

/**
 * Metric: all flockmates within perception radius.
 * Topological: k nearest neighbours (starling ~6–7, paper suggests 7–10).
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
 * @param {Bird[]} flockmates
 * @param {number} maxForce
 * @param {SkyArena} arena
 */
export function computeSeparationForce(bird, flockmates, maxForce, arena) {
  const { separationRadius, personalSpace, weightSep } = birdSimConfig.flock;

  let sx = 0;
  let sy = 0;
  let n = 0;

  for (const other of flockmates) {
    if (other === bird) continue;

    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
    const d = Math.hypot(dx, dy);
    if (d < 0.001) {
      const a = ((bird.x + bird.y * 3) % 628) / 100;
      sx += Math.cos(a) * 8;
      sy += Math.sin(a) * 8;
      n++;
      continue;
    }

    if (d > separationRadius) continue;

    const ux = dx / d;
    const uy = dy / d;

    if (d < personalSpace) {
      const push = ((personalSpace - d) / personalSpace) ** 2;
      sx += ux * push * 4;
      sy += uy * push * 4;
      n++;
    } else {
      const w = 1 / (d * d);
      sx += ux * w;
      sy += uy * w;
      n++;
    }
  }

  if (!n) return [0, 0];

  const [ax, ay] = steer(bird, sx / n, sy / n, maxForce);
  return [ax * weightSep, ay * weightSep];
}

/**
 * Alignment + cohesion over interaction neighbours (metric or topological).
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
  const crowd = avgDist < 12 ? 0.45 : avgDist < 22 ? 0.7 : 1;

  let ax = 0;
  let ay = 0;

  aliX /= n;
  aliY /= n;
  const [alx, aly] = steer(bird, aliX, aliY, maxForce);
  ax += alx * weightAli;
  ay += aly * weightAli;

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
