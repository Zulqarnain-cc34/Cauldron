/**
 * Cauldron worldgen — procedural map algorithms (library).
 * Games import this for caves/terrain; game-specific spawns stay in the app.
 */
export {
  generateCellularAutomataMask,
  createSeededRng,
  countCaveCells,
  wallPercent,
  removeUnsupportedGranular,
  paintSupportedSurfaceSand,
  countSpecies,
  rollingSurfaceHeight,
  buildSurfaceProfile,
  generateCavernWorld,
  registerWorldGenerator,
  runWorldGenerator,
  getWorldGenerator,
  getAllWorldGenerators,
  clearWorldGeneratorRegistry,
} from '../worldgen/index.js';
