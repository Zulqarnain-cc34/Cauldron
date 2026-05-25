/**
 * Cauldron app SDK — host applications (sketch, UI) import from here.
 */
export { Species, Flags, SpeciesName, SANDSPIEL_MAP } from '../catalog/species.js';
export {
  MATERIALS,
  PALETTE,
  getMaterial,
  getBrushMaterials,
  isDenser,
  registerMaterial,
} from '../catalog/materials.js';
export { Mobility, GRAVITY, scanDirectionFor, gravityFor } from '../catalog/physics.js';
export { Tags } from '../catalog/tags.js';
export { cellColor, speciesColor, BURN_GLOW } from '../catalog/cell-color.js';
export { World, GRID_W, GRID_H, CELL_PX, WORLD } from '../world.js';
export { runRules, registerRule, PHASES } from '../rules/registry.js';
export {
  initPlugins,
  resetPlugins,
  renderPlugins,
  getRegisteredPlugins,
  getPluginTestSuites,
} from '../plugins/host.js';
export { getToggleableRules } from '../sim/test-registry.js';
export { BRUSH_TOOLS, buildBrushTools, setupInput, queueBrush, applyBrushQueue } from '../input.js';
