import { Species } from './catalog/species.js';
import { CELL_PX } from './world.js';
import { cellColor } from './catalog/cell-color.js';

/**
 * Fill RGBA bytes for the sim-resolution texture (CELL_PX per grid cell).
 * @param {import('./world.js').World} world
 * @param {Uint8Array} out length = w * h * 4
 * @param {number} texW world.width * CELL_PX
 * @param {number} texH world.height * CELL_PX
 */
export function fillWorldPixelBuffer(world, out, texW, texH) {
  for (let gy = 0; gy < world.height; gy++) {
    for (let gx = 0; gx < world.width; gx++) {
      const cell = world.get(gx, gy);
      const [r, g, b] = cellColor(cell, { tick: world.tick });
      const a = cell.species === Species.WATER ? 200 : 255;

      for (let dy = 0; dy < CELL_PX; dy++) {
        for (let dx = 0; dx < CELL_PX; dx++) {
          const pxX = gx * CELL_PX + dx;
          const pxY = gy * CELL_PX + dy;
          const i = (pxX + pxY * texW) * 4;
          out[i] = r;
          out[i + 1] = g;
          out[i + 2] = b;
          out[i + 3] = a;
        }
      }
    }
  }
}

/** @param {import('./world.js').World} world */
export function simTextureSize(world) {
  return {
    width: world.width * CELL_PX,
    height: world.height * CELL_PX,
  };
}
