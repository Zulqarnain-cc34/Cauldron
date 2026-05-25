import { CellApi } from './cell-api.js';

/**
 * Scan grid in direction suited for movement type.
 * falling: bottom-up; rising: top-down; alternate horizontal each tick.
 */
export function scanMaterials(world, speciesFilter, updaters, direction = 'down') {
  const { width, height } = world;
  const flip = world.scanFlip;
  world.scanFlip = !world.scanFlip;

  const yStart = direction === 'down' ? height - 1 : 0;
  const yEnd = direction === 'down' ? -1 : height;
  const yStep = direction === 'down' ? -1 : 1;

  for (let y = yStart; y !== yEnd; y += yStep) {
    const xStart = flip ? width - 1 : 0;
    const xEnd = flip ? -1 : width;
    const xStep = flip ? -1 : 1;

    for (let x = xStart; x !== xEnd; x += xStep) {
      if (world.wasProcessed(x, y)) continue;

      const cell = world.get(x, y);
      if (!speciesFilter.has(cell.species)) continue;

      const updater = updaters[cell.species];
      if (!updater) continue;

      world.markClock(x, y);
      updater(cell, new CellApi(world, x, y));
    }
  }
}
