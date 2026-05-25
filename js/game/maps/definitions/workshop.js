import { Species } from '../../../catalog/species.js';
import { addStack } from '../../inventory/slot-inventory.js';
import { spawnGemPickups } from '../../gems/pickups.js';

/** Stone chamber with water pocket — separate session defaults for Gem Digger prep. */
export function bootstrapWorkshop(world) {
  const floorY = world.height - 1;
  const midX = Math.floor(world.width / 2);

  for (let x = 0; x < world.width; x++) {
    world.set(x, floorY, {
      species: Species.STONE,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }

  for (let y = floorY - 40; y < floorY; y++) {
    world.set(30, y, { species: Species.STONE, flags: 0, ra: 0, rb: 0 });
    world.set(world.width - 31, y, { species: Species.STONE, flags: 0, ra: 0, rb: 0 });
  }

  for (let x = midX - 20; x < midX + 20; x++) {
    for (let y = floorY - 12; y < floorY; y++) {
      world.set(x, y, {
        species: Species.SAND,
        flags: 0,
        ra: world.randInt(255),
        rb: 0,
      });
    }
  }

  for (let x = midX - 8; x < midX + 8; x++) {
    for (let y = floorY - 28; y < floorY - 14; y++) {
      world.set(x, y, {
        species: Species.WATER,
        flags: 0,
        ra: 128,
        rb: 0,
      });
    }
  }

  for (let i = 0; i < 120; i++) {
    const x = 50 + world.randInt(world.width - 100);
    const y = floorY - 35 - world.randInt(15);
    world.set(x, y, {
      species: Species.STONE,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }

  spawnGemPickups(world, [
    { x: midX - 5, y: floorY - 20, itemId: 'diamond' },
    { x: midX + 12, y: floorY - 32, itemId: 'topaz' },
    { x: midX - 14, y: floorY - 26, itemId: 'ruby' },
  ]);
}

/** @type {import('../registry.js').MapDefinition} */
export const workshopMap = {
  id: 'workshop',
  label: 'Workshop',
  description: 'Dig through sand and water — collect diamond, topaz, and ruby.',
  seed: 9001,
  bootstrap: bootstrapWorkshop,
  goals: { gems: { diamond: 1, topaz: 1, ruby: 1 } },
  defaultRules: {
    grenade: true,
  },
  hooks: {
    afterBootstrap(world) {
      addStack(world.jar, 'sand', 5);
      addStack(world.backpack, 'stone', 3);
    },
  },
};
