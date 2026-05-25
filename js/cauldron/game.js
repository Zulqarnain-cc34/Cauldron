/**
 * Cauldron game SDK — L5 game layer (maps, inventory) for host apps.
 * Import from here instead of deep paths into js/game/.
 */
export {
  ITEM_CATALOG,
  getItemDef,
  createStack,
  itemIdForSpecies,
  itemSwatchColor,
  isStorableItem,
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
  BUILTIN_MAPS,
  sandboxMap,
  workshopMap,
} from '../game/maps/index.js';
