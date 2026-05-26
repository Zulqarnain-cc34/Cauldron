import { generateCavernWorld } from './cavern.js';

/**
 * @typedef {object} WorldGeneratorMeta
 * @property {string} [label]
 * @property {string} [description]
 */

/**
 * @typedef {(world: import('../world.js').World, opts?: Record<string, unknown>) => unknown} WorldGeneratorFn
 */

/** @type {Map<string, { fn: WorldGeneratorFn, meta: WorldGeneratorMeta }>} */
const registry = new Map();

/**
 * Register a world-generation algorithm (library extension point).
 * Games and plugins call this — same pattern as registerPlugin / registerMapDefinition.
 *
 * @param {string} id slug e.g. 'cavern'
 * @param {WorldGeneratorFn} fn
 * @param {WorldGeneratorMeta} [meta]
 */
export function registerWorldGenerator(id, fn, meta = {}) {
  if (!id || typeof fn !== 'function') {
    throw new Error('registerWorldGenerator requires id and fn(world, opts)');
  }
  if (registry.has(id)) {
    throw new Error(`World generator "${id}" is already registered`);
  }
  registry.set(id, { fn, meta });
}

/** @param {string} id @returns {WorldGeneratorFn | undefined} */
export function getWorldGenerator(id) {
  return registry.get(id)?.fn;
}

/** @returns {{ id: string, label: string, description: string }[]} */
export function getAllWorldGenerators() {
  return [...registry.entries()].map(([id, { meta }]) => ({
    id,
    label: meta.label ?? id,
    description: meta.description ?? '',
  }));
}

/**
 * @param {import('../world.js').World} world
 * @param {string} id
 * @param {Record<string, unknown>} [opts]
 */
export function runWorldGenerator(world, id, opts = {}) {
  const entry = registry.get(id);
  if (!entry) {
    throw new Error(`Unknown world generator "${id}"`);
  }
  return entry.fn(world, opts);
}

/** Clear registry (tests). */
export function clearWorldGeneratorRegistry() {
  registry.clear();
}

/** Built-in library generators. */
export function registerBuiltInWorldGenerators() {
  if (registry.has('cavern')) return;
  registerWorldGenerator('cavern', generateCavernWorld, {
    label: 'Cavern (CA)',
    description:
      'Cellular-automata caves in static bedrock with gravity-safe surface sand.',
  });
}

registerBuiltInWorldGenerators();
