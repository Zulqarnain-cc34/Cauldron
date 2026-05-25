/** Reserved byte range for mods, plugins, and runtime material packs (128–255). */
export const PLUGIN_SPECIES_MIN = 128;
export const PLUGIN_SPECIES_MAX = 255;

/** @type {Set<number>} */
const allocated = new Set();

/**
 * Allocate a unique species id for extensions (plugins, material packs).
 * Core Sandspiel-aligned ids (0–127) are fixed in `species.js`.
 * @param {string} [label] — debug label (optional)
 * @returns {number}
 */
export function allocateSpecies(label) {
  for (let id = PLUGIN_SPECIES_MIN; id <= PLUGIN_SPECIES_MAX; id++) {
    if (allocated.has(id)) continue;
    allocated.add(id);
    return id;
  }
  throw new Error(
    `No extension species ids left (${PLUGIN_SPECIES_MIN}–${PLUGIN_SPECIES_MAX})` +
      (label ? ` for "${label}"` : '')
  );
}

/** @param {number} id */
export function isExtensionSpecies(id) {
  return id >= PLUGIN_SPECIES_MIN && id <= PLUGIN_SPECIES_MAX;
}

/** @param {number} id @param {string} [label] */
export function reserveSpecies(id, label) {
  if (id < PLUGIN_SPECIES_MIN || id > PLUGIN_SPECIES_MAX) {
    throw new Error(`reserveSpecies: ${id} outside extension range`);
  }
  if (allocated.has(id)) {
    throw new Error(`Species id ${id} already allocated${label ? ` (${label})` : ''}`);
  }
  allocated.add(id);
  return id;
}

/** Clear allocator state (tests). */
export function resetSpeciesAllocator() {
  allocated.clear();
}
