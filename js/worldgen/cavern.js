import { Species } from '../catalog/species.js';
import { generateCellularAutomataMask } from './cellular-automata.js';
import {
  removeUnsupportedGranular,
  paintSupportedSurfaceSand,
} from './cave-stabilize.js';
import { buildSurfaceProfile } from './surface.js';

/**
 * @typedef {object} CavernWorldOptions
 * @property {number} [skyRatio=0.12] fraction of grid height reserved as sky
 * @property {number} [surfaceBaseOffset=14] rows below sky before surface hills
 * @property {number} [wallChance=0.52] CA initial wall density
 * @property {number} [caIterations=5]
 * @property {number} [surfaceSandDepth=3]
 * @property {boolean} [entryShaft=true] vertical air column + sand plug at center
 * @property {boolean} [waterPool=true]
 * @property {number} [stonePocketCount=180] diggable stone grains in supported wall
 */

/** @param {import('../world.js').World} world @param {number} x @param {number} y */
function setWall(world, x, y) {
  world.set(x, y, { species: Species.WALL, flags: 0, ra: 0, rb: 0 });
}

/**
 * CA cavern world — static WALL bedrock, carved air caves, gravity-safe surface sand.
 * Library algorithm; games/plugins compose via options (ore veins, etc.).
 *
 * @param {import('../world.js').World} world uses world.seed for determinism
 * @param {CavernWorldOptions} [opts]
 * @returns {{ surfaceY: Int16Array, surfaceBase: number, minSurface: number }}
 */
export function generateCavernWorld(world, opts = {}) {
  const w = world.width;
  const h = world.height;
  const skyRatio = opts.skyRatio ?? 0.12;
  const surfaceBase = Math.floor(h * skyRatio) + (opts.surfaceBaseOffset ?? 14);

  const surfaceY = buildSurfaceProfile(w, surfaceBase);
  let minSurface = h;
  for (let x = 0; x < w; x++) {
    if (surfaceY[x] < minSurface) minSurface = surfaceY[x];
  }

  for (let x = 0; x < w; x++) {
    setWall(world, x, h - 1);
  }

  for (let x = 0; x < w; x++) {
    const surf = surfaceY[x];
    for (let y = surf; y < h - 1; y++) {
      setWall(world, x, y);
    }
  }

  const caTop = minSurface;
  const caH = h - 1 - caTop;
  const caMask = generateCellularAutomataMask(w, caH, {
    seed: world.seed,
    wallChance: opts.wallChance ?? 0.52,
    iterations: opts.caIterations ?? 5,
    borderWallUntil: 5,
  });

  for (let y = 0; y < caH; y++) {
    for (let x = 0; x < w; x++) {
      if (caMask[y * w + x]) continue;
      const gy = caTop + y;
      if (gy <= surfaceY[x]) continue;
      world.set(x, gy, world.emptyCell());
    }
  }

  paintSupportedSurfaceSand(world, surfaceY, opts.surfaceSandDepth ?? 3);
  removeUnsupportedGranular(world);

  const spawnX = Math.floor(w * 0.5) + (world.randInt(9) - 4);

  if (opts.entryShaft !== false) {
    const shaftTop = surfaceY[spawnX];
    for (let y = shaftTop + 3; y < h - 1; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = spawnX + dx;
        if (world.inBounds(x, y)) world.set(x, y, world.emptyCell());
      }
    }
    for (let dx = -1; dx <= 1; dx++) {
      const x = spawnX + dx;
      if (!world.inBounds(x, shaftTop)) continue;
      if (world.get(x, shaftTop + 1).species === Species.WALL) {
        world.set(x, shaftTop, {
          species: Species.SAND,
          flags: 0,
          ra: world.randInt(255),
          rb: 0,
        });
      }
    }
  }

  const pocketCount = opts.stonePocketCount ?? 180;
  for (let i = 0; i < pocketCount; i++) {
    const x = 20 + world.randInt(w - 40);
    const y = minSurface + 25 + world.randInt(h - minSurface - 35);
    if (!world.inBounds(x, y)) continue;
    if (world.get(x, y).species !== Species.WALL) continue;
    if (world.get(x, y + 1).species === Species.EMPTY) continue;
    world.set(x, y, {
      species: Species.STONE,
      flags: 0,
      ra: world.randInt(255),
      rb: 0,
    });
  }
  removeUnsupportedGranular(world);

  if (opts.waterPool !== false) {
    const poolX = Math.min(w - 8, spawnX + 24 + world.randInt(20));
    const poolY = Math.min(h - 6, caTop + Math.floor(caH * 0.55) + world.randInt(12));
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = poolX + dx;
        const y = poolY + dy;
        if (!world.inBounds(x, y) || y <= surfaceY[x]) continue;
        if (world.get(x, y).species === Species.EMPTY) {
          world.set(x, y, {
            species: Species.WATER,
            flags: 0,
            ra: 128,
            rb: 0,
          });
        }
      }
    }
  }

  return { surfaceY, surfaceBase, minSurface };
}
