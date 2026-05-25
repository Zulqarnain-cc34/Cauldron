import { PALETTE, Species } from './materials.js';
import { CELL_PX } from './world.js';
import { speciesColor } from './render-canvas.js';

let pixelBuffer = null;

/** Upload grid to p5 pixel buffer — no per-cell rect() calls. */
export function renderWorld(p, world) {
  const w = world.width * CELL_PX;
  const h = world.height * CELL_PX;

  if (!pixelBuffer || pixelBuffer.width !== w || pixelBuffer.height !== h) {
    pixelBuffer = p.createImage(w, h);
  }

  pixelBuffer.loadPixels();
  const px = pixelBuffer.pixels;

  for (let gy = 0; gy < world.height; gy++) {
    for (let gx = 0; gx < world.width; gx++) {
      const cell = world.get(gx, gy);
      const [r, g, b] = speciesColor(cell.species, cell.ra);

      for (let dy = 0; dy < CELL_PX; dy++) {
        for (let dx = 0; dx < CELL_PX; dx++) {
          const pxX = gx * CELL_PX + dx;
          const pxY = gy * CELL_PX + dy;
          const i = (pxX + pxY * w) * 4;
          px[i] = r;
          px[i + 1] = g;
          px[i + 2] = b;
          px[i + 3] = cell.species === Species.WATER ? 200 : 255;
        }
      }
    }
  }

  pixelBuffer.updatePixels();
  p.image(pixelBuffer, 0, 0);
}

export function canvasSize(world) {
  return {
    width: world.width * CELL_PX,
    height: world.height * CELL_PX,
  };
}
