import { Species } from '../../../../../js/catalog/species.js';
import { DEFAULT_BIRD_SIM_CONFIG } from '../../birds/config.js';
import { spawnDemoFlocks } from '../../birds/birds.js';
import { spawnGemPickups } from '../../gems/pickups.js';

/** Intro level — open sky over a floor (no central mound). */
export function bootstrapSandbox(world) {
  const floorY = world.height - 1;
  const left = 16;
  const right = world.width - 16;

  for (let x = left; x <= right; x++) {
    world.set(x, floorY, {
      species: Species.WALL,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }

  const midX = Math.floor(world.width * 0.5);
  spawnGemPickups(world, [
    { x: midX - 40, y: floorY - 14, itemId: 'diamond' },
    { x: midX + 30, y: floorY - 14, itemId: 'diamond' },
    { x: midX - 8, y: floorY - 22, itemId: 'topaz' },
    { x: midX + 50, y: floorY - 22, itemId: 'ruby' },
  ]);
}

/** @type {import('../../maps/registry.js').MapDefinition} */
export const sandboxMap = {
  id: 'sandbox',
  label: 'Tutorial',
  description: 'Open sky — dig the floor, collect gems (Alt+click), watch flocks in the wind.',
  seed: 42,
  bootstrap: bootstrapSandbox,
  goals: { gems: { diamond: 2, topaz: 1, ruby: 1 } },
  defaultRules: { grenade: true },
  hooks: {
    initialCustom() {
      return { birdSimConfig: structuredClone(DEFAULT_BIRD_SIM_CONFIG) };
    },
    afterBootstrap(world) {
      spawnDemoFlocks(world);
    },
  },
};
