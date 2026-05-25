/**
 * L5 inventory — item catalog, slot stacks, backpack & jar containers.
 * @module game/inventory
 */

export {
  ITEM_CATALOG,
  getItemDef,
  createStack,
  itemIdForSpecies,
  itemSwatchColor,
  isStorableItem,
} from './item-catalog.js';

export {
  createSlotInventory,
  normalizeStack,
  getSlot,
  setSlot,
  addStack,
  removeStack,
  countItem,
} from './slot-inventory.js';

export {
  BACKPACK_COLS,
  BACKPACK_ROWS,
  createBackpackInventory,
} from './backpack-inventory.js';

export {
  JAR_COLS,
  JAR_ROWS,
  createJarInventory,
  storeInJar,
} from './jar-inventory.js';
