import { Species } from '../../../../js/catalog/species.js';
import { spawnGemPickups } from '../gems/pickups.js';

/**
 * @typedef {object} OreVeinSpec
 * @property {number} minDepth depth below surface column
 * @property {number} maxDepth
 * @property {number} count
 * @property {string} itemId
 */

/**
 * Place gem pickups inside solid cells (wall/stone) by depth band.
 * @param {import('../../world.js').World} world
 * @param {Int16Array} surfaceY
 * @param {OreVeinSpec[]} veins
 * @returns {number} placements made
 */
export function placeOreVeins(world, surfaceY, veins) {
  /** @type {{ x: number, y: number, depth: number }[]} */
  const oreCells = [];
  for (let x = 4; x < world.width - 4; x++) {
    const surf = surfaceY[x];
    for (let y = surf + 5; y < world.height - 4; y++) {
      const sp = world.get(x, y).species;
      if (sp === Species.WALL || sp === Species.STONE) {
        oreCells.push({ x, y, depth: y - surf });
      }
    }
  }

  const placements = [];
  for (const vein of veins) {
    const pool = oreCells.filter(
      (c) => c.depth >= vein.minDepth && c.depth <= vein.maxDepth
    );
    for (let i = 0; i < vein.count && pool.length > 0; i++) {
      const idx = world.randInt(pool.length);
      const pick = pool.splice(idx, 1)[0];
      placements.push({ x: pick.x, y: pick.y, itemId: vein.itemId });
    }
  }

  spawnGemPickups(world, placements);
  return placements.length;
}
