/**
 * Flocking birds — game-only (not Cauldron library).
 * Same bird kind flocks together (sparrows with sparrows, etc.).
 */

export { BIRD_KINDS, getBirdKindDef } from './catalog.js';
export {
  ensureBirds,
  clearBirds,
  cloneBirds,
  setBirds,
  spawnFlock,
  spawnDemoFlocks,
  tickBirds,
} from './birds.js';
export { renderBirds } from './render.js';
export { FLOCK_PERCEPTION, FLOCK_MIN_SIZE } from './flock.js';

import { tickBirds, spawnDemoFlocks } from './birds.js';
import { renderBirds } from './render.js';

/**
 * @param {import('../../../../js/overlay.js').OverlayContext} overlay
 * @param {import('../../../../js/world.js').World} world
 * @param {{ spawnDemo?: boolean }} [opts]
 */
export function installBirdSystem(overlay, world, opts = {}) {
  if (opts.spawnDemo !== false) {
    spawnDemoFlocks(world);
  }

  return {
    tick() {
      tickBirds(world);
    },
    render() {
      renderBirds(overlay, world);
    },
    respawnDemo() {
      spawnDemoFlocks(world);
    },
  };
}
