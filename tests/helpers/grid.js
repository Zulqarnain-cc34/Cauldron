import { World } from '../../js/world.js';
import { MATERIALS } from '../../js/catalog/materials.js';

/** ASCII char → species id (built from MaterialCatalog). */
export const CHAR_TO_SPECIES = Object.fromEntries(
  Object.values(MATERIALS)
    .filter((m) => m.ascii)
    .map((m) => [m.ascii, m.id])
);

CHAR_TO_SPECIES[' '] = CHAR_TO_SPECIES['.'];

export const SPECIES_TO_CHAR = Object.fromEntries(
  Object.entries(CHAR_TO_SPECIES).map(([ch, sp]) => [sp, ch === ' ' ? '.' : ch])
);

export function worldFromAscii(rows, seed = 1) {
  const height = rows.length;
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (width === 0 || height === 0) {
    throw new Error('worldFromAscii: need at least one row');
  }

  const world = new World(width, height, seed);

  for (let y = 0; y < height; y++) {
    const row = rows[y].padEnd(width, '.');
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const species = CHAR_TO_SPECIES[ch];
      if (species === undefined) {
        throw new Error(`Unknown char "${ch}" at (${x}, ${y})`);
      }
      if (species === 0) continue;
      world.set(x, y, { species, flags: 0, ra: 128, rb: 0 });
    }
  }

  return world;
}

export function asciiFromWorld(world) {
  const rows = [];
  for (let y = 0; y < world.height; y++) {
    let line = '';
    for (let x = 0; x < world.width; x++) {
      const sp = world.get(x, y).species;
      line += SPECIES_TO_CHAR[sp] ?? '?';
    }
    rows.push(line);
  }
  return rows;
}

export function rowsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function diffCells(actual, expected) {
  const diffs = [];
  const h = Math.max(actual.length, expected.length);
  for (let y = 0; y < h; y++) {
    const a = actual[y] ?? '';
    const b = expected[y] ?? '';
    const w = Math.max(a.length, b.length);
    for (let x = 0; x < w; x++) {
      if ((a[x] ?? ' ') !== (b[x] ?? ' ')) diffs.push({ x, y });
    }
  }
  return diffs;
}
