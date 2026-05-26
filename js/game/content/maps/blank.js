import { Species } from '../../../catalog/species.js';

/** Empty floor — used when opening a new tab from + */
export function bootstrapBlank(world) {
  const floorY = world.height - 1;
  for (let x = 0; x < world.width; x++) {
    world.set(x, floorY, {
      species: Species.WALL,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }
}

/** @type {import('../../maps/registry.js').MapDefinition} */
export const blankMap = {
  id: 'blank',
  label: 'New Map',
  description: 'Fresh world — dig, paint, and experiment.',
  seed: 1,
  randomSeedOnReset: true,
  bootstrap: bootstrapBlank,
  defaultRules: { grenade: true },
};
