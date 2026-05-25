/**
 * L3 Material pack — one call to add species + catalog + rule + optional brush.
 */
import { registerMaterial } from '../catalog/materials.js';
import { isExtensionSpecies, reserveSpecies, allocateSpecies, PLUGIN_SPECIES_MIN } from '../catalog/species-allocator.js';
import { registerRuleDef } from './rule-store.js';
import { registerBrushTool } from './brush-registry.js';
import { invalidateRuleCache } from './test-registry.js';

/**
 * @typedef {Object} MaterialPack
 * @property {string} id — unique pack id (used for brush tool id)
 * @property {number} [species] — fixed id (core) or omit to auto-allocate (extensions)
 * @property {boolean} [core] — true when registering built-in catalog species (< 128)
 * @property {object} material — catalog entry (name, mobility, density, color, ascii, tags, …)
 * @property {object} ruleDef — rule module def (id, behaviors, customUpdate, …); species/material filled in
 * @property {{ label?: string, group?: string }} [brush] — register in paint picker
 */

/**
 * Register a complete material: catalog entry + sim rule + optional brush.
 * Extensions must omit `species` (auto-allocate) or use ids ≥ 128.
 * @param {MaterialPack} pack
 * @returns {number} assigned species id
 */
export function registerMaterialPack(pack) {
  let species = pack.species;

  if (species == null) {
    species = allocateSpecies(pack.id);
  } else if (pack.core) {
    if (isExtensionSpecies(species)) {
      throw new Error(`registerMaterialPack("${pack.id}"): core packs use species < ${PLUGIN_SPECIES_MIN}`);
    }
  } else if (!isExtensionSpecies(species)) {
    throw new Error(
      `registerMaterialPack("${pack.id}"): species ${species} is reserved for core catalog. ` +
        'Omit species to auto-allocate, or set core: true for built-ins.'
    );
  } else {
    reserveSpecies(species, pack.id);
  }

  const material = { ...pack.material, id: species };
  registerMaterial(material);

  const ruleDef = {
    phase: 'materials',
    ...pack.ruleDef,
    species,
    material,
  };
  registerRuleDef(ruleDef);

  if (pack.brush !== false) {
    registerBrushTool({
      id: pack.id,
      species,
      label: pack.brush?.label ?? material.name.charAt(0).toUpperCase() + material.name.slice(1),
      group: pack.brush?.group ?? (pack.core ? 'core' : 'extension'),
    });
  }

  invalidateRuleCache();
  return species;
}
