import { PALETTE } from '../../../js/catalog/materials.js';
import { resolveCharToSpecies } from '../../../js/catalog/ascii-map.js';

const GAP = 1;
const LABEL_H = 14;

function cellSizeForGrid(width, height) {
  const longest = Math.max(width, height, 1);
  if (longest <= 2) return 28;
  if (longest <= 4) return 22;
  if (longest <= 8) return 16;
  if (longest <= 14) return 12;
  return 10;
}

/**
 * Draw ASCII rows as a pixel grid on canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} rows
 * @param {{ highlight?: {x:number,y:number}[], label?: string }} [opts]
 */
export function drawAsciiGrid(canvas, rows, opts = {}) {
  const highlight = new Set((opts.highlight ?? []).map((c) => `${c.x},${c.y}`));
  const height = rows.length;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const CELL = cellSizeForGrid(width, height);

  canvas.width = width * (CELL + GAP) + GAP;
  canvas.height = height * (CELL + GAP) + GAP + (opts.label ? LABEL_H : 0);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offsetY = opts.label ? LABEL_H : 0;

  if (opts.label) {
    ctx.fillStyle = '#8888a0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(opts.label, GAP, 11);
  }

  for (let y = 0; y < height; y++) {
    const row = rows[y].padEnd(width, '.');
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const species = resolveCharToSpecies(ch) ?? resolveCharToSpecies('.');
      const [r, g, b] = PALETTE[species] ?? [255, 0, 255];

      const px = GAP + x * (CELL + GAP);
      const py = offsetY + GAP + y * (CELL + GAP);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(px, py, CELL, CELL);

      if (highlight.has(`${x},${y}`)) {
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
      }
    }
  }

  if (width * height <= 16 && CELL >= 12) {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const px = GAP + x * (CELL + GAP) - GAP / 2;
      ctx.moveTo(px, offsetY);
      ctx.lineTo(px, canvas.height);
    }
    for (let y = 0; y <= height; y++) {
      const py = offsetY + GAP + y * (CELL + GAP) - GAP / 2;
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
    }
    ctx.stroke();
  }
}

/** Render ASCII rows as monospace pre text under each canvas. */
export function rowsToPre(rows) {
  return rows.join('\n');
}
