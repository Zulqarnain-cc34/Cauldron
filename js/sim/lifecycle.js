/**
 * L3 Lifecycle — global reset hooks (kernel stays plugin-agnostic).
 * @module sim/lifecycle
 */

/** @type {((world: import('../world.js').World) => void)[]} */
const resetHooks = [];

/**
 * Register a callback invoked after grid state is cleared on world.reset().
 * @param {(world: import('../world.js').World) => void} fn
 */
export function onWorldReset(fn) {
  resetHooks.push(fn);
}

/** @param {import('../world.js').World} world */
export function runWorldResetHooks(world) {
  for (const fn of resetHooks) fn(world);
}

/** Clear all hooks (tests). */
export function clearWorldResetHooks() {
  resetHooks.length = 0;
}
