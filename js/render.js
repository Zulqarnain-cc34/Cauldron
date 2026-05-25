import { PALETTE, Species } from './materials.js';
import { CELL_PX, DISPLAY_SCALE, canvasPixelSize } from './world.js';
import { cellColor } from './catalog/cell-color.js';

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
      const [r, g, b] = cellColor(cell, { tick: world.tick });

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
  const displayW = Math.round(w * DISPLAY_SCALE);
  const displayH = Math.round(h * DISPLAY_SCALE);
  p.image(pixelBuffer, 0, 0, displayW, displayH);
}

export function canvasSize(world) {
  return canvasPixelSize(world);
}
