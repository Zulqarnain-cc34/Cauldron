/**
 * Gem pickups — spawn in world vs collect into inventory are separate actions.
 * @module game/gems
 */

export {
  ensureGemPickups,
  spawnGemPickup,
  spawnGemPickups,
  removeGemPickup,
  findGemPickupAt,
  tickGemPickups,
  clearGemPickups,
  cloneGemPickups,
  setGemPickups,
} from './pickups.js';

export { tryCollectGem } from './collect.js';
export { renderGemPickups } from './render.js';
export { setupGemCollectInput } from './input.js';

import { setupGemCollectInput } from './input.js';
import { tickGemPickups } from './pickups.js';
import { renderGemPickups } from './render.js';

/**
 * @param {import('../../../../js/overlay.js').OverlayContext} overlay
 * @param {import('../../../../js/world.js').World} world
 * @param {HTMLElement} canvas
 * @param {{ onCollected?: (result: { collected: boolean, itemId?: string, count?: number, target?: string }) => void }} [opts]
 */
export function installGemSystem(overlay, world, canvas, opts = {}) {
  const teardown = setupGemCollectInput(world, canvas, opts);
  return {
    teardown,
    tick() {
      tickGemPickups(world);
    },
    render() {
      renderGemPickups(overlay, world);
    },
  };
}
