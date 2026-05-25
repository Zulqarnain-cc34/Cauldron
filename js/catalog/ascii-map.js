/**
 * ASCII char ↔ species maps — updated when materials register at runtime.
 */

/** @type {Record<string, number>} */
let charToSpecies = {};
/** @type {Record<number, string>} */
let speciesToChar = {};

/**
 * Rebuild maps from a material catalog object.
 * @param {Record<number, { ascii?: string, id: number }>} materials
 */
export function rebuildFromMaterials(materials) {
  charToSpecies = Object.fromEntries(
    Object.values(materials)
      .filter((m) => m.ascii)
      .map((m) => [m.ascii, m.id])
  );
  charToSpecies[' '] = charToSpecies['.'];
  speciesToChar = Object.fromEntries(
    Object.entries(charToSpecies).map(([ch, sp]) => [sp, ch === ' ' ? '.' : ch])
  );
}

/** @param {string} ch */
export function resolveCharToSpecies(ch) {
  return charToSpecies[ch];
}

/** @param {number} species */
export function resolveSpeciesToChar(species) {
  return speciesToChar[species] ?? '?';
}
