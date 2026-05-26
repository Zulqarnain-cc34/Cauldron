/**
 * Gem Digger runtime state attached to a library World.
 * The sim kernel (js/world.js) does not declare these fields — only this game kit does.
 */

/** @typedef {import('./inventory/slot-inventory.js').SlotInventory} SlotInventory */
/** @typedef {import('./gems/pickups.js').GemPickup} GemPickup */
/** @typedef {import('./birds/birds.js').Bird} Bird */

/**
 * @typedef {object} GemDiggerWorldState
 * @property {SlotInventory | null} backpack
 * @property {SlotInventory | null} jar
 * @property {GemPickup[]} gemPickups
 * @property {Bird[]} birds
 */

const STATE = Symbol('gemDiggerWorldState');

/**
 * @param {import('../../../js/world.js').World} world
 * @returns {GemDiggerWorldState}
 */
export function getGameState(world) {
  if (!world[STATE]) {
    world[STATE] = {
      backpack: null,
      jar: null,
      gemPickups: [],
      birds: [],
    };
  }
  if (!state.birds) state.birds = [];
  return world[STATE];
}

/** @param {import('../../../js/world.js').World} world */
export function clearGameState(world) {
  const state = getGameState(world);
  state.backpack = null;
  state.jar = null;
  state.gemPickups = [];
  state.birds = [];
}
