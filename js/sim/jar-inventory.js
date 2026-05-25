import { createSlotInventory, addStack } from './slot-inventory.js';

export const JAR_COLS = 4;
export const JAR_ROWS = 2;

/**
 * @param {number} [cols]
 * @param {number} [rows]
 */
export function createJarInventory(cols = JAR_COLS, rows = JAR_ROWS) {
  return createSlotInventory(cols, rows);
}

/**
 * @param {import('../world.js').World} world
 * @param {string} itemId
 * @param {number} [amount]
 * @returns {number} leftover that did not fit
 */
export function storeInJar(world, itemId, amount = 1) {
  if (!world.jar) world.jar = createJarInventory();
  return addStack(world.jar, itemId, amount);
}
