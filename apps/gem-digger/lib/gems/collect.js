import { addStack } from '../inventory/slot-inventory.js';
import { findGemPickupAt, removeGemPickup } from './pickups.js';

/**
 * Collect gem at grid cell into backpack or jar (store — separate from spawn).
 * @param {import('../../world.js').World} world
 * @param {number} gx
 * @param {number} gy
 * @param {{ target?: 'backpack' | 'jar', radius?: number }} [opts]
 */
export function tryCollectGem(world, gx, gy, opts = {}) {
  const target = opts.target ?? 'backpack';
  const gem = findGemPickupAt(world, gx, gy, opts.radius);
  if (!gem) return { collected: false };

  const inv = target === 'jar' ? world.jar : world.backpack;
  if (!inv) return { collected: false };

  const leftover = addStack(inv, gem.itemId, gem.count);
  const stored = gem.count - leftover;

  if (stored <= 0) return { collected: false };

  if (stored >= gem.count) {
    removeGemPickup(world, gem.id);
  } else {
    gem.count -= stored;
  }

  return { collected: true, itemId: gem.itemId, count: stored, target };
}
