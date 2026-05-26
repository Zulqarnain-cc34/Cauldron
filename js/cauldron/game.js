/**
 * Cauldron game SDK — L5 game layer (maps, inventory, worldgen) for host apps.
 * Import from here instead of deep paths into js/game/.
 *
 * Demo maps live in `cauldron/game/content` — not bundled here.
 */
export {
  ITEM_CATALOG,
  getItemDef,
  createStack,
  itemIdForSpecies,
  itemSwatchColor,
  isStorableItem,
  isGemItem,
  GEM_ITEM_IDS,
  createSlotInventory,
  normalizeStack,
  getSlot,
  setSlot,
  addStack,
  removeStack,
  countItem,
  BACKPACK_COLS,
  BACKPACK_ROWS,
  createBackpackInventory,
  JAR_COLS,
  JAR_ROWS,
  createJarInventory,
  storeInJar,
} from '../game/inventory/index.js';

export {
  registerMapDefinition,
  registerMapDefinitions,
  getMapDefinition,
  getAllMapDefinitions,
  clearMapRegistry,
  captureMapSession,
  applyMapSession,
  applyMapSessionWithHooks,
  createFreshMapSession,
  cloneSlotInventory,
  MapManager,
  createMapManager,
} from '../game/maps/index.js';

export {
  registerWorldGenerator,
  runWorldGenerator,
  getWorldGenerator,
  getAllWorldGenerators,
  clearWorldGeneratorRegistry,
  generateCavernWorld,
  generateCellularAutomataMask,
  createSeededRng,
  countCaveCells,
  wallPercent,
  removeUnsupportedGranular,
  paintSupportedSurfaceSand,
  countSpecies,
  rollingSurfaceHeight,
  buildSurfaceProfile,
  placeOreVeins,
} from '../game/worldgen/index.js';

export {
  computeMapGoalProgress,
  countGemsInWorld,
  countGemsInInventory,
} from '../game/maps/goals.js';

export {
  spawnGemPickup,
  spawnGemPickups,
  tryCollectGem,
  tickGemPickups,
  renderGemPickups,
  setupGemCollectInput,
  installGemSystem,
  clearGemPickups,
} from '../game/gems/index.js';
