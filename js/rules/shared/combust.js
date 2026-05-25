import { Species } from '../../catalog/species.js';
import { compilePhysicsUpdate } from '../../engine/material-physics.js';
import { MATERIALS } from '../../catalog/materials.js';
import {
  tryMoveDown,
  tryMoveUp,
  tryDiagRandom,
  trySwapWithDenserBelow,
} from '../../engine/primitives.js';

const HOT = new Set([Species.FIRE, Species.LAVA]);

/**
 * Shared burn-state machine (Sandspiel wood/plant/oil pattern).
 * @returns {boolean} handled — stop further updates this tick
 */
export function stepCombust(cell, api, species, opts = {}) {
  const igniteFrom = opts.igniteFrom ?? HOT;
  const spreadEvery = opts.spreadEvery ?? 4;
  let rb = cell.rb;

  if (rb === 0) {
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      if (igniteFrom.has(api.get(dx, dy).species)) {
        api.set(0, 0, { ...cell, species, rb: opts.igniteRb ?? 20 });
        return true;
      }
    }
  }

  const [dx, dy] = api.randVec8();
  const nbr = api.get(dx, dy);

  if (rb > 1) {
    api.set(0, 0, { ...cell, species, rb: rb - 1 });
    if (spreadEvery > 0 && rb % spreadEvery === 0 && nbr.species === Species.EMPTY) {
      api.set(dx, dy, {
        species: Species.FIRE,
        flags: 0,
        ra: 40 + api.randInt(30),
        rb: 0,
      });
    }
    return true;
  }

  if (rb === 1) {
    api.clearSelf();
    return true;
  }

  return false;
}

export function wrapFluidUpdate(speciesId, before, after) {
  const base = compilePhysicsUpdate(MATERIALS[speciesId]);
  return function wrapped(cell, api) {
    if (before?.(cell, api)) return;
    base(cell, api);
    after?.(cell, api);
  };
}

export function fallLikeSand(cell, api) {
  if (tryMoveDown(cell, api)) return true;
  if (trySwapWithDenserBelow(cell, api)) return true;
  return tryDiagRandom(cell, api, 1);
}

export function riseLikeGas(cell, api) {
  if (tryMoveUp(cell, api)) return true;
  return tryDiagRandom(cell, api, -1);
}
