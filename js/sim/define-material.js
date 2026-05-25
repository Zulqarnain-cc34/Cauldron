import { compileMovement } from '../engine/primitives.js';
import { compilePhysicsUpdate } from '../engine/material-physics.js';
import { scanDirectionFor } from '../catalog/physics.js';

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
 *
 * Resolution order for update():
 *   1. customUpdate  — fire, organic, exotic overrides
 *   2. movement[]    — legacy declarative steps (deprecated)
 *   3. material.mobility → compilePhysicsUpdate()  — default for new elements
 *
 * Tests: behaviors[] always written by hand in the material rule file.
 *
 * @param {object} def
 * @returns {RuleModule}
 */
export function defineMaterial(def) {
  const material = def.material;
  const update =
    def.customUpdate ??
    (def.movement?.length ? compileMovement(def.movement) : null) ??
    (material ? compilePhysicsUpdate(material) : () => {});

  const scanDirection =
    def.scanDirection ?? (material ? scanDirectionFor(material.mobility) : 'down');

  return {
    id: def.id,
    label: def.label ?? material?.name ?? def.id,
    species: def.species,
    phase: def.phase ?? 'materials',
    scanDirection,
    speciesFilter: def.speciesFilter ?? new Set([def.species]),
    enabledKey: def.enabledKey ?? def.id,
    doc: def.doc,
    update,
    behaviors: def.behaviors ?? [],
  };
}
