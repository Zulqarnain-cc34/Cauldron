/**
 * Cauldron plugin SDK — minimal surface for L6 extensions.
 * Import this instead of the full barrel when building plugins.
 */
export { Species, Flags, SpeciesName } from '../catalog/species.js';
export { getMaterial, MATERIALS, registerMaterial } from '../catalog/materials.js';
export { Tags } from '../catalog/tags.js';
export {
  getSpeciesByTag,
  materialHasTag,
  getBurnableSpecies,
  getBlastImmuneSpecies,
} from '../catalog/material-queries.js';
export {
  allocateSpecies,
  isExtensionSpecies,
  PLUGIN_SPECIES_MIN,
} from '../catalog/species-allocator.js';
export { World, GRID_W, GRID_H, CELL_PX, WORLD } from '../world.js';
export {
  isEmpty,
  tryMoveDown,
  tryMoveUp,
  tryDiagRandom,
  trySwapWithDenserBelow,
  trySpreadHorizontal,
} from '../engine/primitives.js';
export { CellApi } from '../engine/cell-api.js';
export {
  registerPlugin,
  CAULDRON_API_VERSION,
  getRegisteredPlugins,
} from '../plugins/host.js';
export { registerReaction } from '../sim/reaction-store.js';

/** @typedef {import('../plugins/host.js').CauldronPlugin} Plugin */
/** @typedef {import('../plugins/host.js').PluginSetupContext} PluginContext */
/** @typedef {import('../plugins/host.js').PluginToggle} PluginToggle */
