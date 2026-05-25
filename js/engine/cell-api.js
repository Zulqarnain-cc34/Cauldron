import { Species } from '../catalog/species.js';

/**
 * SandApi-style wrapper: rules only read/write via relative offsets.
 * Engine owns bounds, scan order, and clock.
 */
export class CellApi {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
  }

  get(dx, dy) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.world.inBounds(nx, ny)) {
      return { species: Species.WALL, flags: 0, ra: 0, rb: 0 };
    }
    return this.world.get(nx, ny);
  }

  set(dx, dy, cell) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.world.inBounds(nx, ny)) return;
    this.world.set(nx, ny, cell);
  }

  clearSelf() {
    this.set(0, 0, this.world.emptyCell());
  }

  moveSelf(dx, dy, cell) {
    this.clearSelf();
    this.set(dx, dy, cell);
  }

  randDir() {
    return this.world.randDir();
  }

  randInt(n) {
    return this.world.randInt(n);
  }

  /** Random 8-neighbor offset (Sandspiel-style rand_vec). */
  randVec8() {
    const dirs = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    return dirs[this.world.randInt(8)];
  }
}
