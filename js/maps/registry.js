/**
 * Map unit registry — register map definitions (tabs) for the session engine.
 * @module maps/registry
 */

/**
 * @typedef {object} MapHooks
 * @property {(world: import('../world.js').World) => void} [afterBootstrap]
 * @property {(world: import('../world.js').World) => Record<string, unknown>} [initialCustom]
 * @property {(world: import('../world.js').World, session: import('./session.js').MapSession) => void} [capture]
 * @property {(world: import('../world.js').World, session: import('./session.js').MapSession) => void} [apply]
 */

/**
 * @typedef {object} MapDefinition
 * @property {string} id unique tab id (slug)
 * @property {string} label tab title
 * @property {string} [description]
 * @property {(world: import('../world.js').World) => void} bootstrap paint terrain / spawns on fresh load
 * @property {number} [seed] default RNG seed when map first opens
 * @property {boolean} [defaultPaused]
 * @property {{ species?: number, radius?: number }} [defaultBrush]
 * @property {Record<string, boolean>} [defaultRules] per-map rule toggles
 * @property {boolean} [resetClearsInventory] clear backpack/jar on Reset (default false)
 * @property {MapHooks} [hooks] optional custom session data
 */

/** @type {Map<string, MapDefinition>} */
const definitions = new Map();

/** @param {MapDefinition} def */
export function registerMapDefinition(def) {
  if (!def?.id || typeof def.bootstrap !== 'function') {
    throw new Error('MapDefinition requires id and bootstrap(world)');
  }
  if (definitions.has(def.id)) {
    throw new Error(`Map "${def.id}" is already registered`);
  }
  definitions.set(def.id, def);
}

/** @param {string} id @returns {MapDefinition | undefined} */
export function getMapDefinition(id) {
  return definitions.get(id);
}

/** @returns {MapDefinition[]} */
export function getAllMapDefinitions() {
  return [...definitions.values()];
}

/** @param {MapDefinition[]} defs */
export function registerMapDefinitions(defs) {
  for (const def of defs) registerMapDefinition(def);
}

/** Clear registry (tests). */
export function clearMapRegistry() {
  definitions.clear();
}
