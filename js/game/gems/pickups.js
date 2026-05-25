import { Species } from '../../catalog/species.js';
import { getItemDef, isStorableItem } from '../inventory/item-catalog.js';

/** @typedef {{ id: string, itemId: string, x: number, y: number, count: number }} GemPickup */

/** @param {import('../../world.js').World} world */
export function ensureGemPickups(world) {
  if (!world.gemPickups) world.gemPickups = [];
  return world.gemPickups;
}

/**
 * Place a gem pickup in the world (spawn — separate from collect).
 * @param {import('../../world.js').World} world
 * @param {number} x grid x
 * @param {number} y grid y
 * @param {string} [itemId]
 * @param {number} [count]
 * @returns {GemPickup | null}
 */
export function spawnGemPickup(world, x, y, itemId = 'diamond', count = 1) {
  if (!isStorableItem(itemId) || !getItemDef(itemId)) return null;
  if (!world.inBounds(x, y)) return null;

  const gx = Math.floor(x);
  const gy = Math.floor(y);
  const pickup = {
    id: `gem-${itemId}-${gx}-${gy}-${world.tick}-${world.randInt(1_000_000)}`,
    itemId,
    x: gx,
    y: gy,
    count: Math.max(1, count),
  };

  ensureGemPickups(world).push(pickup);
  return pickup;
}

/**
 * @param {import('../../world.js').World} world
 * @param {{ x: number, y: number, itemId?: string, count?: number }[]} placements
 */
export function spawnGemPickups(world, placements) {
  const spawned = [];
  for (const p of placements) {
    const gem = spawnGemPickup(world, p.x, p.y, p.itemId ?? 'diamond', p.count ?? 1);
    if (gem) spawned.push(gem);
  }
  return spawned;
}

/** @param {import('../../world.js').World} world @param {string} id */
export function removeGemPickup(world, id) {
  const list = world.gemPickups;
  if (!list) return false;
  const i = list.findIndex((g) => g.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

/**
 * @param {import('../../world.js').World} world
 * @param {number} gx
 * @param {number} gy
 * @param {number} [radius] grid cells
 * @returns {GemPickup | null}
 */
export function findGemPickupAt(world, gx, gy, radius = 0.85) {
  const list = world.gemPickups;
  if (!list?.length) return null;

  let best = null;
  let bestD = radius * radius;

  for (const gem of list) {
    const dx = gem.x + 0.5 - gx;
    const dy = gem.y + 0.5 - gy;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD) {
      bestD = d2;
      best = gem;
    }
  }

  return best;
}

/** @param {import('../../world.js').World} world */
function canGemOccupy(world, x, y) {
  if (!world.inBounds(x, y)) return false;
  const cell = world.get(x, y);
  return cell.species === Species.EMPTY || cell.species === Species.WATER;
}

/** Gravity — gems fall through air/water. */
export function tickGemPickups(world) {
  const list = world.gemPickups;
  if (!list?.length) return;

  for (const gem of list) {
    const below = gem.y + 1;
    if (!world.inBounds(gem.x, below)) continue;
    if (!canGemOccupy(world, gem.x, below)) continue;
    gem.y = below;
  }
}

/** @param {import('../../world.js').World} world */
export function clearGemPickups(world) {
  if (world.gemPickups) world.gemPickups.length = 0;
}

/** @param {import('../../world.js').World} world @returns {GemPickup[]} */
export function cloneGemPickups(world) {
  return structuredClone(world.gemPickups ?? []);
}

/** @param {import('../../world.js').World} world @param {GemPickup[]} pickups */
export function setGemPickups(world, pickups) {
  world.gemPickups = structuredClone(pickups ?? []);
}
