/**
 * World generation — procedural algorithms (library).
 * @module worldgen
 */

export {
  generateCellularAutomataMask,
  createSeededRng,
  countCaveCells,
  wallPercent,
} from './cellular-automata.js';

export {
  removeUnsupportedGranular,
  paintSupportedSurfaceSand,
  countSpecies,
} from './cave-stabilize.js';

export { rollingSurfaceHeight, buildSurfaceProfile } from './surface.js';

export { generateCavernWorld } from './cavern.js';

export {
  registerWorldGenerator,
  getWorldGenerator,
  getAllWorldGenerators,
  runWorldGenerator,
  clearWorldGeneratorRegistry,
  registerBuiltInWorldGenerators,
} from './registry.js';
