import { Species } from '../../catalog/species.js';

/** Remove sand/stone that would fall into open caves on the first physics tick. */
export function removeUnsupportedGranular(world) {
  const { width, height } = world;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      const cell = world.get(x, y);
      if (cell.species !== Species.SAND && cell.species !== Species.STONE) continue;
      if (world.get(x, y + 1).species === Species.EMPTY) {
        world.set(x, y, world.emptyCell());
      }
    }
  }
}

/** Sand cap only where solid material is directly below. */
export function paintSupportedSurfaceSand(world, surfaceY, depth = 3) {
  for (let x = 0; x < world.width; x++) {
    const surf = surfaceY[x];
    for (let d = 0; d < depth; d++) {
      const y = surf + d;
      if (y >= world.height - 1) break;
      const below = world.get(x, y + 1);
      if (below.species !== Species.WALL && below.species !== Species.STONE) continue;
      world.set(x, y, {
        species: Species.SAND,
        flags: 0,
        ra: world.randInt(255),
        rb: 0,
      });
    }
  }
}

/** @param {import('../../world.js').World} world @param {number} species */
export function countSpecies(world, species) {
  let n = 0;
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.get(x, y).species === species) n++;
    }
  }
  return n;
}
