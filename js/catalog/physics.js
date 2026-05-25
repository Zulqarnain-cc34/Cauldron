/**
 * World physics model — shared by all materials.
 *
 * Architecture:
 *   Catalog row (density, mobility, …) → compilePhysicsUpdate() → one updater fn
 *   Thousands of elements = thousands of catalog rows, ~6 mobility code paths.
 *
 * Density is relative to water = 1.0 (real-world inspired ratios, not SI units).
 */

/** @typedef {'static'|'granular'|'fluid'|'buoyant'|'plasma'|'life'} Mobility */

export const Mobility = {
  STATIC: 'static',
  GRANULAR: 'granular',
  FLUID: 'fluid',
  BUOYANT: 'buoyant',
  PLASMA: 'plasma',
  LIFE: 'life',
};

/** Grid gravity: +1 = fall down, −1 = rise (buoyant gases). */
export const GRAVITY = {
  DOWN: 1,
  UP: -1,
  NONE: 0,
};

/**
 * @typedef {Object} MaterialPhysics
 * @property {Mobility} mobility
 * @property {number} density — relative to water = 1.0
 * @property {boolean} [sinkThroughLighter] — granular: swap with less-dense cell below
 * @property {boolean} [spreadBlockSame] — fluid: don't flow into same-species pile edge
 * @property {number} [thermalDecay] — buoyant: ra loss per tick while idle
 * @property {number} [condenseAt] — buoyant: fade when ra ≤ this
 */

/** @param {Mobility} mobility @returns {'down'|'up'} */
export function scanDirectionFor(mobility) {
  if (mobility === Mobility.BUOYANT || mobility === Mobility.PLASMA) return 'up';
  return 'down';
}

/** @param {Mobility} mobility @returns {number} */
export function gravityFor(mobility) {
  if (mobility === Mobility.BUOYANT || mobility === Mobility.PLASMA) return GRAVITY.UP;
  if (mobility === Mobility.STATIC) return GRAVITY.NONE;
  return GRAVITY.DOWN;
}

/** Needs a hand-written update() override (fire, organic, …). */
export function needsPhysicsOverride(mobility) {
  return mobility === Mobility.PLASMA || mobility === Mobility.LIFE;
}

/**
 * @param {import('./materials.js').MaterialDef} a
 * @param {import('./materials.js').MaterialDef} b
 */
export function isDenserMaterial(a, b) {
  return a.density > b.density;
}
