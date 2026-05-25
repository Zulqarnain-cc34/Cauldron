import { PALETTE, Species } from './materials.js';

function speciesColor(species, ra) {
  const base = PALETTE[species] ?? [255, 0, 255];
  const grain = (ra / 255 - 0.5) * 0.15;
  return [
    Math.min(255, Math.max(0, base[0] * (1 + grain))),
    Math.min(255, Math.max(0, base[1] * (1 + grain))),
    Math.min(255, Math.max(0, base[2] * (1 + grain))),
  ];
}

/**
 * Draw World grid to a Canvas2D context (shared by game + test demo).
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./world.js').World} world
 * @param {{ cellPx?: number, highlight?: {x:number,y:number}[] }} [opts]
 */
export function renderWorldToCanvas(ctx, world, opts = {}) {
  const cellPx = opts.cellPx ?? 2;
  const highlight = new Set((opts.highlight ?? []).map((c) => `${c.x},${c.y}`));
  const w = world.width * cellPx;
  const h = world.height * cellPx;

  const canvas = ctx.canvas;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, w, h);

  for (let gy = 0; gy < world.height; gy++) {
    for (let gx = 0; gx < world.width; gx++) {
      const cell = world.get(gx, gy);
      const [r, g, b] = speciesColor(cell.species, cell.ra);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(gx * cellPx, gy * cellPx, cellPx, cellPx);

      if (highlight.has(`${gx},${gy}`)) {
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 1;
        ctx.strokeRect(gx * cellPx + 0.5, gy * cellPx + 0.5, cellPx - 1, cellPx - 1);
      }
    }
  }
}

export function canvasPixelSize(world, cellPx = 2) {
  return {
    width: world.width * cellPx,
    height: world.height * cellPx,
  };
}

export { speciesColor };
