/**
 * Flocking birds — game-only (not Cauldron library).
 */

export { BIRD_KINDS, getBirdKindDef } from './catalog.js';
export {
  birdSimConfig,
  BIRD_SIM_PRESETS,
  applyBirdSimPreset,
  resetBirdSimConfig,
} from './config.js';
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
export { renderWindField, resetWindParticles } from './wind-viz.js';
export { getFlockMinSize } from './flock.js';
export { flowVelocity, windSteer } from './wind.js';

import { tickBirds, spawnDemoFlocks } from './birds.js';
import { renderBirds } from './render.js';
import { renderWindField, resetWindParticles } from './wind-viz.js';

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
      renderWindField(overlay, world);
      renderBirds(overlay, world);
    },
    respawnDemo() {
      resetWindParticles();
      spawnDemoFlocks(world);
    },
  };
}
