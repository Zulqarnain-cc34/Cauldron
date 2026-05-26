/**
 * Boids-style flocking — separation, alignment, cohesion.
 * Only birds of the same {@link BirdKind} interact.
 */

import { birdSimConfig } from './config.js';

/** @typedef {import('./birds.js').Bird} Bird */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} max
 */
function clampMag(x, y, max) {
  const m = Math.hypot(x, y);
  if (m <= max || m === 0) return [x, y];
  const s = max / m;
  return [x * s, y * s];
}

/**
 * @param {Bird} bird
 * @param {number} tx
 * @param {number} ty
 * @param {number} maxForce
 */
function steer(bird, tx, ty, maxForce) {
  let sx = tx - bird.vx;
  let sy = ty - bird.vy;
  [sx, sy] = clampMag(sx, sy, maxForce);
  return [sx, sy];
}

/**
 * @param {Bird} bird
 * @param {number} tx
 * @param {number} ty
 * @param {number} maxSpeed
 * @param {number} maxForce
 */
function seek(bird, tx, ty, maxSpeed, maxForce) {
  let dx = tx - bird.x;
  let dy = ty - bird.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return [0, 0];
  dx = (dx / d) * maxSpeed;
  dy = (dy / d) * maxSpeed;
  return steer(bird, dx, dy, maxForce);
}

/**
 * @param {Bird} bird
 * @param {Bird[]} neighbors
 * @param {number} maxSpeed
 * @param {number} maxForce
 * @returns {[number, number]}
 */
export function computeFlockAcceleration(bird, neighbors, maxSpeed, maxForce) {
  const {
    perception,
    separationRadius,
    minFlockSize,
    weightSep,
    weightAli,
    weightCoh,
    cohesionSpeed,
  } = birdSimConfig.flock;

  if (neighbors.length < minFlockSize) return [0, 0];

  let sepX = 0;
  let sepY = 0;
  let aliX = 0;
  let aliY = 0;
  let cohX = 0;
  let cohY = 0;
  let sepN = 0;
  let avgDist = 0;
  const n = neighbors.length;

  for (const other of neighbors) {
    const dx = bird.x - other.x;
    const dy = bird.y - other.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) continue;

    avgDist += d;

    if (d < separationRadius) {
      const w = 1 / (d * d);
      sepX += (dx / d) * w;
      sepY += (dy / d) * w;
      sepN++;
    }

    aliX += other.vx;
    aliY += other.vy;
    cohX += other.x;
    cohY += other.y;
  }

  avgDist /= n;
  const crowd = avgDist < 10 ? 2.5 : avgDist < 18 ? 1.4 : 1;

  let ax = 0;
  let ay = 0;

  if (sepN > 0) {
    const [sx, sy] = steer(bird, sepX / sepN, sepY / sepN, maxForce);
    ax += sx * weightSep * crowd;
    ay += sy * weightSep * crowd;
  }

  aliX /= n;
  aliY /= n;
  const [alx, aly] = steer(bird, aliX, aliY, maxForce);
  ax += alx * weightAli;
  ay += aly * weightAli;

  const centerX = cohX / n;
  const centerY = cohY / n;
  const [cx, cy] = seek(bird, centerX, centerY, maxSpeed * cohesionSpeed, maxForce);
  ax += cx * weightCoh;
  ay += cy * weightCoh;

  return clampMag(ax, ay, maxForce * 1.8);
}

/** @param {Bird} a @param {Bird} b */
export function withinPerception(a, b) {
  if (a.kind !== b.kind) return false;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const p = birdSimConfig.flock.perception;
  return dx * dx + dy * dy <= p * p;
}

export function getFlockMinSize() {
  return birdSimConfig.flock.minFlockSize;
}
