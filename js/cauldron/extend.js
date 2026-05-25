/**
 * Cauldron extension API — register materials, reactions, rules at runtime.
 *
 * Library authors and feature plugins use this to extend Cauldron without
 * editing core files. Plugin `setup(ctx)` mirrors these methods on context.
 */
export {
  allocateSpecies,
  reserveSpecies,
  isExtensionSpecies,
  PLUGIN_SPECIES_MIN,
  PLUGIN_SPECIES_MAX,
} from '../catalog/species-allocator.js';
export {
  getSpeciesByTag,
  materialHasTag,
  getBurnableSpecies,
  getBlastImmuneSpecies,
} from '../catalog/material-queries.js';
export { registerMaterial, getMaterial } from '../catalog/materials.js';
export { registerRuleDef } from '../sim/rule-store.js';
export { registerReaction, getRegisteredReactions } from '../sim/reaction-store.js';
export { registerMaterialPack } from '../sim/material-pack.js';
export { registerBrushTool, getExtensionBrushTools } from '../sim/brush-registry.js';
export { registerExtensionToggle } from '../sim/toggle-registry.js';
export { invalidateRuleCache } from '../sim/test-registry.js';
export { registerRule, PHASES } from '../rules/registry.js';

import { registerRuleDef as pushRuleDef } from '../sim/rule-store.js';
import { invalidateRuleCache as bustCache } from '../sim/test-registry.js';

/**
 * Register a rule def at runtime and refresh compiled modules.
 * @param {object} def
 */
export function registerRuntimeRuleDef(def) {
  pushRuleDef(def);
  bustCache();
}
