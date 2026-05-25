/**
 * Cauldron extension API — register materials, reactions, rules at runtime.
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
export { registerRuntimeRuleDef } from '../sim/register-rule-def.js';
