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
export { World, GRID_W, GRID_H, CELL_PX, DISPLAY_SCALE, displayCellPx, canvasPixelSize, WORLD } from '../world.js';
export { runRules, registerRule, PHASES } from '../rules/registry.js';
export {
  initPlugins,
  resetPlugins,
  renderPlugins,
  getRegisteredPlugins,
  getPluginTestSuites,
} from '../plugins/host.js';
export { getToggleableRules } from '../sim/test-registry.js';
export { ruleMatchesQuery } from '../catalog/rule-toggle-catalog.js';
export { BRUSH_TOOLS, buildBrushTools, setupInput, queueBrush, applyBrushQueue } from '../input.js';
export { renderWorld, canvasSize, createWebGLRenderer } from '../render.js';
export { createSimHost } from '../sim-host.js';
export { createOverlay, loadOverlayImage, getOverlayImage } from '../overlay.js';
