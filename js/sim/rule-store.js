/**
 * L3 Rule store — register material/system rules without a god-file array.
 * @module sim/rule-store
 */

/** @type {object[]} */
const registeredDefs = [];

/**
 * Register a rule definition (material module or system rule).
 * @param {object} def
 */
export function registerRuleDef(def) {
  if (registeredDefs.some((d) => d.id === def.id)) {
    throw new Error(`Rule def "${def.id}" already registered`);
  }
  registeredDefs.push(def);
}

/** @returns {readonly object[]} */
export function getRegisteredRuleDefs() {
  return registeredDefs;
}

/** @param {object[]} defs */
export function registerRuleDefs(defs) {
  for (const def of defs) registerRuleDef(def);
}
