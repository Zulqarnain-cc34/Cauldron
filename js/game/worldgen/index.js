/**
 * World generation library — algorithms for procedural maps.
 * Games compose these; they do not ship as a finished game.
 *
 * @example
 * import { runWorldGenerator } from './js/cauldron/game.js';
 * runWorldGenerator(world, 'cavern', {
 *   oreVeins: [{ minDepth: 10, maxDepth: 40, count: 3, itemId: 'diamond' }],
 * });
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

export { placeOreVeins } from './ore-veins.js';

export { generateCavernWorld } from './cavern.js';

export {
  registerWorldGenerator,
  getWorldGenerator,
  getAllWorldGenerators,
  runWorldGenerator,
  clearWorldGeneratorRegistry,
  registerBuiltInWorldGenerators,
} from './registry.js';
