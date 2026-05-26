/**
 * Cellular-automata cave masks (Yvan Scher / classic roguelike style).
 * 1 = solid (wall), 0 = cave (floor/air).
 */

/**
 * @param {number} seed
 * @returns {() => number} uniform [0, 1)
 */
export function createSeededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function countWallNeighbors(grid, w, h, x, y) {
  let walls = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
        walls++;
        continue;
      }
      if (grid[ny * w + nx]) walls++;
    }
  }
  return walls;
}

/**
 * @typedef {object} CellularAutomataOptions
 * @property {number} [wallChance=0.4]
 * @property {number} [iterations=5]
 * @property {number} [borderWallUntil=5]
 * @property {number} [seed=1]
 * @property {(x: number, y: number) => boolean} [includeCell]
 */

/**
 * @param {number} width
 * @param {number} height
 * @param {CellularAutomataOptions} [opts]
 * @returns {Uint8Array}
 */
export function generateCellularAutomataMask(width, height, opts = {}) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const wallChance = opts.wallChance ?? 0.4;
  const iterations = opts.iterations ?? 5;
  const borderWallUntil = opts.borderWallUntil ?? 5;
  const rng = createSeededRng(opts.seed ?? 1);
  const includeCell = opts.includeCell ?? (() => true);

  let grid = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!includeCell(x, y)) {
        grid[i] = 1;
        continue;
      }
      grid[i] = rng() < wallChance ? 1 : 0;
    }
  }

  for (let gen = 0; gen < iterations; gen++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!includeCell(x, y)) {
          next[i] = 1;
          continue;
        }

        if (
          gen < borderWallUntil &&
          (x === 0 || x === w - 1 || y === 0 || y === h - 1)
        ) {
          next[i] = 1;
          continue;
        }

        const walls = countWallNeighbors(grid, w, h, x, y);
        const wasWall = grid[i];
        if (walls >= 5) next[i] = 1;
        else if (walls <= 3) next[i] = 0;
        else next[i] = wasWall;
      }
    }
    grid = next;
  }

  return grid;
}

/** @param {Uint8Array} mask @param {number} w @param {number} h */
export function countCaveCells(mask, w, h) {
  let caves = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) caves++;
  }
  return caves;
}

/** @param {Uint8Array} mask */
export function wallPercent(mask) {
  if (!mask.length) return 100;
  let walls = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) walls++;
  }
  return Math.round((walls / mask.length) * 100);
}
