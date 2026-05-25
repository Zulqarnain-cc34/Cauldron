import { Species } from '../../../catalog/species.js';

import { spawnGemPickups } from '../../gems/pickups.js';

/** Classic sand-on-floor demo. */
export function bootstrapSandbox(world) {
  for (let x = 40; x < 240; x++) {
    world.set(x, world.height - 1, {
      species: Species.WALL,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }
  for (let i = 0; i < 400; i++) {
    const x = 80 + world.randInt(120);
    const y = 20 + world.randInt(60);
    world.set(x, y, {
      species: Species.SAND,
      flags: 0,
      ra: world.randInt(255),
      rb: 0,
    });
  }

  spawnGemPickups(world, [
    { x: 120, y: 40, itemId: 'diamond' },
    { x: 145, y: 55, itemId: 'diamond' },
    { x: 165, y: 35, itemId: 'topaz' },
    { x: 130, y: 48, itemId: 'ruby' },
  ]);
}

/** @type {import('../registry.js').MapDefinition} */
export const sandboxMap = {
  id: 'sandbox',
  label: 'Sandbox',
  description: 'Find diamonds, topaz, and ruby buried in the sand.',
  seed: 42,
  bootstrap: bootstrapSandbox,
  goals: { gems: { diamond: 2, topaz: 1, ruby: 1 } },
  defaultRules: {
    grenade: true,
  },
};
