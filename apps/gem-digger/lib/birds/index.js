/**
 * Flocking birds — game-only (not Cauldron library).
 */

export { BIRD_DEF, getBirdDef } from './catalog.js';
export {
  birdSimConfig,
  BIRD_SIM_PRESETS,
  BIRD_PRESET_LABELS,
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
export {
  getFlockMinSize,
  getFlockNeighbors,
  computeVicsekOrder,
} from './flock.js';
export { flowVelocity, windSteer } from './wind.js';
export {
  sampleBirdMetrics,
  getBirdMetricsSnapshot,
  getBirdMetricsHistory,
  resetBirdMetrics,
  sparklineAscii,
} from './metrics.js';

import { tickBirds, spawnDemoFlocks, ensureBirds } from './birds.js';
import { renderBirds } from './render.js';
import { renderWindField, resetWindParticles } from './wind-viz.js';
import {
  sampleBirdMetrics,
  resetBirdMetrics,
  getBirdMetricsSnapshot,
} from './metrics.js';

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
      sampleBirdMetrics(world, ensureBirds(world));
    },
    render() {
      renderWindField(overlay, world);
      renderBirds(overlay, world);
    },
    respawnDemo() {
      resetWindParticles();
      resetBirdMetrics();
      spawnDemoFlocks(world);
    },
    getMetrics() {
      return getBirdMetricsSnapshot();
    },
  };
}
