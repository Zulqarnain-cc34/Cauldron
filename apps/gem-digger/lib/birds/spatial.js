/**
 * Uniform grid for fast nearby-bird queries (toroidal X, sky-band Y).
 */

import { toroidalDelta, wrapCoord, wrapSkyY } from './boundaries.js';

/** @typedef {import('./birds.js').Bird} Bird */
/** @typedef {import('./boundaries.js').SkyArena} SkyArena */

const CELL = 36;

/**
 * @param {Bird[]} birds
 * @param {SkyArena} arena
 */
export function buildBirdSpatialIndex(birds, arena) {
  const cols = Math.max(1, Math.ceil(arena.worldW / CELL));
  const rows = Math.max(1, Math.ceil(arena.skyH / CELL));
  /** @type {Bird[][]} */
  const buckets = Array.from({ length: cols * rows }, () => []);

  for (const bird of birds) {
    const gx = Math.min(cols - 1, Math.floor(wrapCoord(bird.x, arena.worldW) / CELL));
    const gy = Math.min(
      rows - 1,
      Math.floor((wrapSkyY(bird.y, arena) - arena.skyTop) / CELL)
    );
    buckets[gy * cols + gx].push(bird);
  }

  return { buckets, cols, rows };
}

/**
 * @param {ReturnType<typeof buildBirdSpatialIndex>} index
 * @param {Bird} bird
 * @param {SkyArena} arena
 * @param {number} radius
 * @param {(other: Bird, dx: number, dy: number, d: number) => void} fn
 */
export function forEachBirdNearby(index, bird, arena, radius, fn) {
  const { buckets, cols, rows } = index;
  const wx = wrapCoord(bird.x, arena.worldW);
  const wy = wrapSkyY(bird.y, arena) - arena.skyTop;
  const gx0 = Math.floor(wx / CELL);
  const gy0 = Math.floor(wy / CELL);
  const cells = Math.ceil(radius / CELL);
  const r2 = radius * radius;

  for (let dg = -cells; dg <= cells; dg++) {
    const gy = gy0 + dg;
    if (gy < 0 || gy >= rows) continue;

    for (let dgx = -cells; dgx <= cells; dgx++) {
      const gx = ((gx0 + dgx) % cols + cols) % cols;
      const list = buckets[gy * cols + gx];
      for (const other of list) {
        if (other === bird) continue;
        const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        fn(other, dx, dy, Math.sqrt(d2));
      }
    }
  }
}
