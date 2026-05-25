import { Species } from '../../catalog/species.js';
import { addStack } from '../../inventory/slot-inventory.js';

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
}

/** @type {import('../registry.js').MapDefinition} */
export const workshopMap = {
  id: 'workshop',
  label: 'Workshop',
  description: 'Stone cave with sand fill and water — separate inventory session.',
  seed: 9001,
  bootstrap: bootstrapWorkshop,
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
