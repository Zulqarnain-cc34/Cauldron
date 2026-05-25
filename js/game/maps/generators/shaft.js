import { Species } from '../../../catalog/species.js';
import { spawnGemPickups } from '../../gems/pickups.js';

/** @param {import('../../../world.js').World} world @param {number} x @param {number} y */
function setStone(world, x, y) {
  world.set(x, y, { species: Species.STONE, flags: 0, ra: 0, rb: 0 });
}

/** @param {import('../../../world.js').World} world @param {number} x @param {number} y */
function setSand(world, x, y) {
  world.set(x, y, {
    species: Species.SAND,
    flags: 0,
    ra: world.randInt(255),
    rb: 0,
  });
}

/**
 * Wavy surface height per column (Terraria-style 2D ground line).
 * @param {number} w
 * @param {number} baseY
 * @param {number} x
 */
function surfaceAt(w, baseY, x) {
  const wave =
    Math.sin(x * 0.07) * 4 + Math.sin(x * 0.019 + 1.2) * 6 + Math.sin(x * 0.003) * 3;
  return Math.max(8, Math.min(baseY + 12, Math.floor(baseY + wave)));
}

/**
 * Procedural mine: sky, surface, sand/stone strata, cellular-automata caves, central shaft, gem veins.
 * Deterministic from `world.seed` (set before call).
 *
 * @param {import('../../../world.js').World} world
 * @returns {{ shaftX: number, gemCount: number }}
 */
export function generateShaftWorld(world) {
  const w = world.width;
  const h = world.height;
  const skyRows = Math.floor(h * 0.1);
  const surfaceBase = skyRows + 10;

  /** @type {Int16Array} */
  const surfaceY = new Int16Array(w);
  for (let x = 0; x < w; x++) {
    surfaceY[x] = surfaceAt(w, surfaceBase, x);
  }

  // Bedrock floor
  for (let x = 0; x < w; x++) {
    setStone(world, x, h - 1);
  }

  // Fill underground by depth band
  for (let x = 0; x < w; x++) {
    const surf = surfaceY[x];
    for (let y = surf; y < h - 1; y++) {
      const depth = y - surf;
      if (depth < 22) {
        setSand(world, x, y);
      } else if (depth < 55) {
        if (world.randInt(100) < 55) setSand(world, x, y);
        else setStone(world, x, y);
      } else {
        setStone(world, x, y);
      }
    }
  }

  // Cave map (1 = solid to carve, 0 = keep / become air)
  const solid = new Uint8Array(w * h);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      if (y < surfaceY[x]) continue;
      const cell = world.get(x, y);
      if (cell.species !== Species.EMPTY) {
        solid[y * w + x] = 1;
      }
    }
  }

  // Random noise then smooth → organic caves
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      if (y < surfaceY[x]) continue;
      if (world.randInt(100) < 44) solid[y * w + x] = 0;
    }
  }

  const iterations = 5;
  for (let n = 0; n < iterations; n++) {
    const next = new Uint8Array(solid);
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w; x++) {
        if (y < surfaceY[x]) continue;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h - 1) {
              neighbors++;
              continue;
            }
            if (ny < surfaceY[nx]) neighbors++;
            else if (solid[ny * w + nx]) neighbors++;
          }
        }
        next[y * w + x] = neighbors >= 5 ? 1 : 0;
      }
    }
    solid.set(next);
  }

  // Open caves (carve air)
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      if (y < surfaceY[x]) continue;
      if (!solid[y * w + x]) {
        world.set(x, y, world.emptyCell());
      }
    }
  }

  // Main mine shaft — air column from surface
  const shaftX = Math.floor(w * 0.5) + world.randInt(17) - 8;
  for (let y = surfaceY[shaftX]; y < h - 1; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = shaftX + dx;
      if (x >= 0 && x < w) world.set(x, y, world.emptyCell());
    }
  }

  // Small water pocket deep (risk/reward)
  const waterY = Math.min(h - 8, surfaceY[shaftX] + 55 + world.randInt(20));
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = shaftX + dx + 12;
      const y = waterY + dy;
      if (world.inBounds(x, y) && y > surfaceY[x]) {
        world.set(x, y, {
          species: Species.WATER,
          flags: 0,
          ra: 128,
          rb: 0,
        });
      }
    }
  }

  /** @type {{ x: number, y: number, depth: number }[]} */
  const candidates = [];
  for (let x = 2; x < w - 2; x++) {
    const surf = surfaceY[x];
    for (let y = surf + 4; y < h - 6; y++) {
      const cell = world.get(x, y);
      if (cell.species !== Species.STONE && cell.species !== Species.SAND) continue;
      candidates.push({ x, y, depth: y - surf });
    }
  }

  /**
   * @param {number} minDepth
   * @param {number} maxDepth
   * @param {number} count
   * @param {string} itemId
   */
  function placeVein(minDepth, maxDepth, count, itemId) {
    const pool = candidates.filter((c) => c.depth >= minDepth && c.depth <= maxDepth);
    const picks = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = world.randInt(pool.length);
      const pick = pool.splice(idx, 1)[0];
      picks.push({ x: pick.x, y: pick.y, itemId });
    }
    return picks;
  }

  const gemPlacements = [
    ...placeVein(6, 28, 3, 'diamond'),
    ...placeVein(22, 55, 2, 'topaz'),
    ...placeVein(45, 95, 1, 'ruby'),
  ];

  spawnGemPickups(world, gemPlacements);

  return { shaftX, gemCount: gemPlacements.length };
}
