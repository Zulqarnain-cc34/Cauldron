import { createSlotInventory } from './slot-inventory.js';

export const BACKPACK_COLS = 9;
export const BACKPACK_ROWS = 3;

export {
  getSlot,
  setSlot,
  addStack,
  removeStack,
  countItem,
  normalizeStack,
} from './slot-inventory.js';

/**
 * @param {number} [cols]
 * @param {number} [rows]
 */
export function createBackpackInventory(cols = BACKPACK_COLS, rows = BACKPACK_ROWS) {
  return createSlotInventory(cols, rows);
}
