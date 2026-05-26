import { Species } from '../../../catalog/species.js';
import { spawnGemPickups } from '../../gems/pickups.js';

/** Intro level — shaped sand mound, all three gem types, easy dig. */
export function bootstrapSandbox(world) {
  const floorY = world.height - 1;
  const left = 70;
  const right = 210;
  const peakY = 28;

  for (let x = left; x <= right; x++) {
    world.set(x, floorY, {
      species: Species.WALL,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }

  for (let x = left + 10; x <= right - 10; x++) {
    const t = (x - (left + 10)) / (right - left - 20);
    const heightAtX = Math.floor((1 - Math.abs(t - 0.5) * 2) * (floorY - peakY - 8));
    for (let dy = 0; dy < heightAtX; dy++) {
      const y = floorY - 1 - dy;
      world.set(x, y, {
        species: Species.SAND,
        flags: 0,
        ra: world.randInt(255),
        rb: 0,
      });
    }
  }

  for (let i = 0; i < 80; i++) {
    const x = left + 20 + world.randInt(right - left - 40);
    const y = peakY + world.randInt(18);
    if (world.get(x, y).species === Species.EMPTY) {
      world.set(x, y, {
        species: Species.SAND,
        flags: 0,
        ra: world.randInt(255),
        rb: 0,
      });
    }
  }

  const midX = Math.floor((left + right) / 2);
  spawnGemPickups(world, [
    { x: midX - 15, y: floorY - 18, itemId: 'diamond' },
    { x: midX + 10, y: floorY - 28, itemId: 'diamond' },
    { x: midX - 5, y: floorY - 35, itemId: 'topaz' },
    { x: midX + 22, y: floorY - 42, itemId: 'ruby' },
  ]);
}

/** @type {import('../../maps/registry.js').MapDefinition} */
export const sandboxMap = {
  id: 'sandbox',
  label: 'Tutorial',
  description: 'Shaped sand mound — learn to dig and collect gems (Alt+click).',
  seed: 42,
  bootstrap: bootstrapSandbox,
  goals: { gems: { diamond: 2, topaz: 1, ruby: 1 } },
  defaultRules: { grenade: true },
};
