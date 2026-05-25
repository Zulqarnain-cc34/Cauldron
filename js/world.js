import { Species, Flags } from './materials.js';

const STRIDE = 4;

/**
 * Dense grid: 4 bytes per cell (Sandspiel-style).
 * [0] species, [1] flags, [2] ra (aux / brightness), [3] clock (last tick processed)
 */
export class World {
  constructor(width, height, seed = 1) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.tick = 0;
    this.paused = false;
    this.scanFlip = false;
    this.cells = new Uint8Array(width * height * STRIDE);
    this.agents = [];
    this.brush = {
      species: Species.SAND,
      radius: 2,
      queue: [],
    };
    this.ruleEnabled = {
      sand: true,
      water: true,
      fire: true,
      organic: true,
      stone: true,
      reactions: true,
      life: false,
      boids: false,
      flow: false,
    };
  }

  idx(x, y) {
    return (x + y * this.width) * STRIDE;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    const i = this.idx(x, y);
    return {
      species: this.cells[i],
      flags: this.cells[i + 1],
      ra: this.cells[i + 2],
      rb: this.cells[i + 3],
    };
  }

  set(x, y, cell) {
    const i = this.idx(x, y);
    this.cells[i] = cell.species ?? this.cells[i];
    if (cell.flags !== undefined) this.cells[i + 1] = cell.flags;
    if (cell.ra !== undefined) this.cells[i + 2] = cell.ra;
    if (cell.rb !== undefined) this.cells[i + 3] = cell.rb;
  }

  emptyCell(ra = 0) {
    return { species: Species.EMPTY, flags: Flags.NONE, ra, rb: 0 };
  }

  markClock(x, y) {
    this.cells[this.idx(x, y) + 3] = this.tick & 255;
  }

  wasProcessed(x, y) {
    return this.cells[this.idx(x, y) + 3] === (this.tick & 255);
  }

  reset() {
    this.cells.fill(0);
    this.agents.length = 0;
    this.tick = 0;
    this.brush.queue.length = 0;
  }

  /** Deterministic-ish RNG for rules (LCG). */
  rand() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  randInt(n) {
    return Math.floor(this.rand() * n);
  }

  randDir() {
    return this.randInt(3) - 1;
  }
}

export const GRID_W = 280;
export const GRID_H = 200;
export const CELL_PX = 2;
