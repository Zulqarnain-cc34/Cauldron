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

  if (opts.showGrid && cellPx >= 8 && world.width * world.height <= 64) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= world.width; x++) {
      ctx.moveTo(x * cellPx + 0.5, 0);
      ctx.lineTo(x * cellPx + 0.5, h);
    }
    for (let y = 0; y <= world.height; y++) {
      ctx.moveTo(0, y * cellPx + 0.5);
      ctx.lineTo(w, y * cellPx + 0.5);
    }
    ctx.stroke();
  }
}

export function canvasPixelSize(world, cellPx = 2) {
  return {
    width: world.width * cellPx,
    height: world.height * cellPx,
  };
}

/**
 * Pick cell pixel size for live demo viewports — small slices stay readable without blowing up.
 * @param {import('./world.js').World} world
 * @param {{ maxCanvasWidth?: number, maxCanvasHeight?: number, minCellPx?: number, maxCellPx?: number }} [opts]
 */
export function computeDemoCellPx(world, opts = {}) {
  const {
    maxCanvasWidth = 320,
    maxCanvasHeight = 280,
    minCellPx = 10,
    maxCellPx = 36,
    idealShortSide = 168,
  } = opts;

  const cols = world.width;
  const rows = world.height;
  if (!cols || !rows) return minCellPx;

  const byMaxW = Math.floor(maxCanvasWidth / cols);
  const byMaxH = Math.floor(maxCanvasHeight / rows);
  const longest = Math.max(cols, rows);

  let cellPx = Math.min(byMaxW, byMaxH, maxCellPx);

  if (longest <= 8) {
    const byIdeal = Math.floor(idealShortSide / longest);
    cellPx = Math.min(byIdeal, maxCellPx, byMaxW, byMaxH);
  }

  return Math.max(minCellPx, cellPx);
}

export { speciesColor };
