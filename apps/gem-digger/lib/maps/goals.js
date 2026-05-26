import { countItem } from '../inventory/slot-inventory.js';
import { getItemDef } from '../inventory/item-catalog.js';
import { getGameState } from '../game-state.js';

/**
 * @typedef {object} GemGoalProgress
 * @property {string} itemId
 * @property {string} label
 * @property {string | null} icon
 * @property {number} collected
 * @property {number} target
 * @property {boolean} complete
 */

/**
 * @typedef {object} MapGoalProgress
 * @property {string} mapLabel
 * @property {string} mapDescription
 * @property {GemGoalProgress[] | null} gems
 * @property {boolean} allComplete
 */

/** @param {import('../../../js/world.js').World} world @param {string} itemId */
export function countGemsInWorld(world, itemId) {
  return getGameState(world).gemPickups
    .filter((g) => g.itemId === itemId)
    .reduce((sum, g) => sum + g.count, 0);
}

/** @param {import('../../../js/world.js').World} world @param {string} itemId */
export function countGemsInInventory(world, itemId) {
  const state = getGameState(world);
  const backpack = state.backpack ? countItem(state.backpack, itemId) : 0;
  const jar = state.jar ? countItem(state.jar, itemId) : 0;
  return backpack + jar;
}

/**
 * @param {import('../../../js/world.js').World} world
 * @param {import('./registry.js').MapDefinition} def
 * @returns {MapGoalProgress}
 */
export function computeMapGoalProgress(world, def) {
  const gemGoals = def.goals?.gems;
  /** @type {GemGoalProgress[] | null} */
  let gems = null;

  if (gemGoals && Object.keys(gemGoals).length > 0) {
    gems = [];
    for (const [itemId, target] of Object.entries(gemGoals)) {
      const itemDef = getItemDef(itemId);
      const inInventory = countGemsInInventory(world, itemId);
      const inWorld = countGemsInWorld(world, itemId);

      gems.push({
        itemId,
        label: itemDef?.label ?? itemId,
        icon: itemDef?.icon ?? null,
        collected: Math.min(target, inInventory),
        target,
        complete: inWorld === 0 && inInventory >= target,
      });
    }
  }

  return {
    mapLabel: def.label,
    mapDescription: def.description ?? '',
    gems,
    allComplete: gems != null && gems.length > 0 && gems.every((g) => g.complete),
  };
}
