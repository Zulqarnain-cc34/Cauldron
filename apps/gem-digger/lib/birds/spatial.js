/**
 * Uniform grid for fast nearby-bird queries (toroidal X, sky-band Y).
 */

import { wrapCoord, wrapSkyY } from './boundaries.js';

/** @typedef {import('./birds.js').Bird} Bird */
/** @typedef {import('./boundaries.js').SkyArena} SkyArena */

/** Match flock perception so most queries touch ≤9 cells. */
const CELL = 50;

/** @type {WeakMap<SkyArena, { buckets: Bird[][], cols: number, rows: number }>} */
const indexPools = new WeakMap();

/**
 * @param {SkyArena} arena
 */
function getIndexPool(arena) {
  let pool = indexPools.get(arena);
  const cols = Math.max(1, Math.ceil(arena.worldW / CELL));
  const rows = Math.max(1, Math.ceil(arena.skyH / CELL));
  const size = cols * rows;

  if (!pool || pool.cols !== cols || pool.rows !== rows) {
    const buckets = Array.from({ length: size }, () => []);
    pool = { buckets, cols, rows };
    indexPools.set(arena, pool);
  }

  for (const list of pool.buckets) {
    list.length = 0;
  }

  return pool;
}

/**
 * @param {Bird[]} birds
 * @param {SkyArena} arena
 */
export function buildBirdSpatialIndex(birds, arena) {
  const pool = getIndexPool(arena);
  const { buckets, cols, rows } = pool;
  const worldW = arena.worldW;
  const skyTop = arena.skyTop;
  const skyH = arena.skyH;
  const halfW = worldW * 0.5;
  const halfH = skyH * 0.5;

  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    bird._si = i;
    const gx = Math.min(cols - 1, Math.floor(wrapCoord(bird.x, worldW) / CELL));
    const gy = Math.min(rows - 1, Math.floor((wrapSkyY(bird.y, arena) - skyTop) / CELL));
    buckets[gy * cols + gx].push(bird);
  }

  pool.halfW = halfW;
  pool.halfH = halfH;
  pool.worldW = worldW;
  pool.skyH = skyH;
  return pool;
}

/**
 * Toroidal delta from other → bird (shortest wrap).
 * @param {Bird} bird
 * @param {Bird} other
 * @param {ReturnType<typeof buildBirdSpatialIndex>} index
 */
export function toroidalDeltaFast(bird, other, index) {
  let dx = other.x - bird.x;
  let dy = other.y - bird.y;
  const worldW = index.worldW;
  const skyH = index.skyH;

  if (worldW > 0) {
    if (dx > index.halfW) dx -= worldW;
    else if (dx < -index.halfW) dx += worldW;
  }
  if (skyH > 0) {
    if (dy > index.halfH) dy -= skyH;
    else if (dy < -index.halfH) dy += skyH;
  }

  return [dx, dy];
}

/**
 * @param {ReturnType<typeof buildBirdSpatialIndex>} index
 * @param {Bird} bird
 * @param {SkyArena} arena
 * @param {number} radius
 * @param {(other: Bird, dx: number, dy: number, d2: number) => void} fn
 */
export function forEachBirdNearby(index, bird, arena, radius, fn) {
  const { buckets, cols, rows } = index;
  const wx = wrapCoord(bird.x, arena.worldW);
  const wy = wrapSkyY(bird.y, arena) - arena.skyTop;
  const gx0 = Math.floor(wx / CELL);
  const gy0 = Math.floor(wy / CELL);
  const cells = Math.ceil(radius / CELL);
  const r2 = radius * radius;
  const worldW = index.worldW;
  const skyH = index.skyH;
  const halfW = index.halfW;
  const halfH = index.halfH;

  for (let dg = -cells; dg <= cells; dg++) {
    const gy = gy0 + dg;
    if (gy < 0 || gy >= rows) continue;

    for (let dgx = -cells; dgx <= cells; dgx++) {
      const gx = ((gx0 + dgx) % cols + cols) % cols;
      const list = buckets[gy * cols + gx];
      for (let i = 0; i < list.length; i++) {
        const other = list[i];
        if (other === bird) continue;

        let dx = other.x - bird.x;
        let dy = other.y - bird.y;
        if (worldW > 0) {
          if (dx > halfW) dx -= worldW;
          else if (dx < -halfW) dx += worldW;
        }
        if (skyH > 0) {
          if (dy > halfH) dy -= skyH;
          else if (dy < -halfH) dy += skyH;
        }

        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        fn(other, dx, dy, d2);
      }
    }
  }
}
