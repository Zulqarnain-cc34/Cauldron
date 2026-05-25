import { Species } from '../catalog/species.js';

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
}

/** @type {import('../registry.js').MapDefinition} */
export const sandboxMap = {
  id: 'sandbox',
  label: 'Sandbox',
  description: 'Open sand box — default Cauldron playground.',
  seed: 42,
  bootstrap: bootstrapSandbox,
  defaultRules: {
    grenade: true,
  },
};
