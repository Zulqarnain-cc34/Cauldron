/**
 * Boids flocking — separation (always), alignment + cohesion (when flock is large enough).
 * Same {@link BirdKind} only. Uses toroidal distance across wrap edges.
 */

import { birdSimConfig } from './config.js';
import { toroidalDelta, toroidalVectorTo } from './boundaries.js';

/** @typedef {import('./birds.js').Bird} Bird */

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

function seek(bird, tx, ty, maxSpeed, maxForce) {
  const dx = tx - bird.x;
  const dy = ty - bird.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return [0, 0];
  const sx = (dx / d) * maxSpeed;
  const sy = (dy / d) * maxSpeed;
  return steer(bird, sx, sy, maxForce);
}

/**
 * @param {Bird} bird
 * @param {Bird[]} flockmates
 * @param {number} maxForce
 * @param {number} worldW
 * @param {number} worldH
 * @returns {[number, number]}
 */
export function computeSeparationForce(bird, flockmates, maxForce, worldW, worldH) {
  const { separationRadius, personalSpace, weightSep } = birdSimConfig.flock;

  let sx = 0;
  let sy = 0;
  let n = 0;

  for (const other of flockmates) {
    if (other === bird) continue;

    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, worldW, worldH);
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
 * @param {Bird} bird
 * @param {Bird[]} neighbors
 * @param {number} maxSpeed
 * @param {number} maxForce
 * @param {number} worldW
 * @param {number} worldH
 * @returns {[number, number]}
 */
export function computeFlockAcceleration(
  bird,
  neighbors,
  maxSpeed,
  maxForce,
  worldW,
  worldH
) {
  const { minFlockSize, weightAli, weightCoh, cohesionSpeed } = birdSimConfig.flock;

  if (neighbors.length < minFlockSize) return [0, 0];

  let aliX = 0;
  let aliY = 0;
  let cohDx = 0;
  let cohDy = 0;
  let avgDist = 0;
  const n = neighbors.length;

  for (const other of neighbors) {
    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, worldW, worldH);
    avgDist += Math.hypot(dx, dy);
    aliX += other.vx;
    aliY += other.vy;
    const [towardX, towardY] = toroidalVectorTo(
      bird.x,
      bird.y,
      other.x,
      other.y,
      worldW,
      worldH
    );
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
  const [cx, cy] = seek(bird, targetX, targetY, maxSpeed * cohesionSpeed, maxForce);
  ax += cx * weightCoh * crowd;
  ay += cy * weightCoh * crowd;

  return clampMag(ax, ay, maxForce);
}

/** @param {Bird} a @param {Bird} b @param {number} worldW @param {number} worldH */
export function withinPerception(a, b, worldW, worldH) {
  if (a.kind !== b.kind) return false;
  const [dx, dy] = toroidalDelta(a.x, a.y, b.x, b.y, worldW, worldH);
  const p = birdSimConfig.flock.perception;
  return dx * dx + dy * dy <= p * p;
}

export function getFlockMinSize() {
  return birdSimConfig.flock.minFlockSize;
}
