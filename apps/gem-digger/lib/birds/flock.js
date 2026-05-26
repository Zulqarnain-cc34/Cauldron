/**
 * Boids-style flocking — separation, alignment, cohesion.
 * Only birds of the same {@link BirdKind} interact.
 */

/** @typedef {import('./birds.js').Bird} Bird */

const PERCEPTION = 42;
const SEPARATION = 14;
const MIN_FLOCK = 3;

const WEIGHT_SEP = 1.6;
const WEIGHT_ALI = 1.0;
const WEIGHT_COH = 0.85;

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
 * Steer toward desired velocity.
 * @param {Bird} bird
 * @param {number} tx target vx
 * @param {number} ty target vy
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
 * @param {Bird[]} neighbors same kind, within perception
 * @param {number} maxForce
 * @returns {[number, number]} acceleration
 */
export function computeFlockAcceleration(bird, neighbors, maxForce) {
  if (neighbors.length < MIN_FLOCK) return [0, 0];

  let sepX = 0;
  let sepY = 0;
  let aliX = 0;
  let aliY = 0;
  let cohX = 0;
  let cohY = 0;
  let sepN = 0;
  const n = neighbors.length;

  for (const other of neighbors) {
    const dx = bird.x - other.x;
    const dy = bird.y - other.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) continue;

    if (d < SEPARATION) {
      const w = 1 / d;
      sepX += (dx / d) * w;
      sepY += (dy / d) * w;
      sepN++;
    }

    aliX += other.vx;
    aliY += other.vy;
    cohX += other.x;
    cohY += other.y;
  }

  let ax = 0;
  let ay = 0;

  if (sepN > 0) {
    const [sx, sy] = steer(bird, sepX / sepN, sepY / sepN, maxForce);
    ax += sx * WEIGHT_SEP;
    ay += sy * WEIGHT_SEP;
  }

  aliX /= n;
  aliY /= n;
  const [alx, aly] = steer(bird, aliX, aliY, maxForce);
  ax += alx * WEIGHT_ALI;
  ay += aly * WEIGHT_ALI;

  cohX = cohX / n - bird.x;
  cohY = cohY / n - bird.y;
  const [cx, cy] = steer(bird, cohX, cohY, maxForce);
  ax += cx * WEIGHT_COH;
  ay += cy * WEIGHT_COH;

  return clampMag(ax, ay, maxForce * 2.2);
}

/** @param {Bird} a @param {Bird} b */
export function withinPerception(a, b) {
  if (a.kind !== b.kind) return false;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= PERCEPTION * PERCEPTION;
}

export const FLOCK_PERCEPTION = PERCEPTION;
export const FLOCK_MIN_SIZE = MIN_FLOCK;
