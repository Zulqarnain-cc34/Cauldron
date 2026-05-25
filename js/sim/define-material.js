import { compileMovement } from '../engine/primitives.js';

/**
 * @typedef {Object} RuleModule
 * @property {string} id
 * @property {string} [label]
 * @property {number} species
 * @property {string} phase
 * @property {'down'|'up'} [scanDirection]
 * @property {Set<number>} [speciesFilter]
 * @property {Function} update
 * @property {object[]} behaviors
 */

/**
 * Compile a material rule module.
 * Rule logic: movement[] or customUpdate.
 * Tests: behaviors[] only — always written by hand in the material file.
 *
 * @param {object} def
 * @returns {RuleModule}
 */
export function defineMaterial(def) {
  const update =
    def.customUpdate ??
    (def.movement?.length ? compileMovement(def.movement) : () => {});

  return {
    id: def.id,
    label: def.label ?? def.material?.name ?? def.id,
    species: def.species,
    phase: def.phase ?? 'materials',
    scanDirection: def.scanDirection ?? 'down',
    speciesFilter: def.speciesFilter ?? new Set([def.species]),
    enabledKey: def.enabledKey ?? def.id,
    update,
    behaviors: def.behaviors ?? [],
  };
}
