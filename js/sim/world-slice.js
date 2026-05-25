import { runRules } from '../rules/registry.js';

/**
 * Scoped subset of a World — used for tests and live demo.
 */
export class WorldSlice {
  constructor(world) {
    this.world = world;
  }

  static fromAscii(rows, seed, worldFromAscii) {
    return new WorldSlice(worldFromAscii(rows, seed));
  }

  applySetup(setup) {
    setup?.(this.world);
  }

  step(scope) {
    const only = scope?.rules;
    runRules(this.world, only?.length ? { only } : undefined);
  }
}
