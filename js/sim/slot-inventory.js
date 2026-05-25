import { getItemDef } from './item-catalog.js';

/** @typedef {{ itemId: string, count: number, label?: string }} ItemStack */

/** @typedef {{ cols: number, rows: number, slots: (ItemStack | null)[] }} SlotInventory */

/**
 * @param {number} cols
 * @param {number} rows
 * @returns {SlotInventory}
 */
export function createSlotInventory(cols, rows) {
  return {
    cols,
    rows,
    slots: Array.from({ length: cols * rows }, () => null),
  };
}

/** @param {unknown} entry */
export function normalizeStack(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const raw = /** @type {{ itemId?: string, id?: string, count?: number, label?: string }} */ (entry);
  const itemId = raw.itemId ?? raw.id;
  if (!itemId) return null;
  const def = getItemDef(itemId);
  const count = Math.max(1, raw.count ?? 1);
  return {
    itemId,
    count,
    label: raw.label ?? def?.label ?? itemId,
  };
}

/**
 * @param {SlotInventory} inv
 * @param {number} index
 * @returns {ItemStack | null}
 */
export function getSlot(inv, index) {
  const slot = inv.slots[index];
  return slot ? normalizeStack(slot) : null;
}

/**
 * @param {SlotInventory} inv
 * @param {number} index
 * @param {ItemStack | null} stack
 */
export function setSlot(inv, index, stack) {
  if (index < 0 || index >= inv.slots.length) return;
  inv.slots[index] = stack ? normalizeStack(stack) : null;
}

/**
 * @param {SlotInventory} inv
 * @param {string} itemId
 * @param {number} [amount]
 * @returns {number} amount that could not be stored
 */
export function addStack(inv, itemId, amount = 1) {
  const def = getItemDef(itemId);
  if (!def || amount <= 0) return amount;

  let remaining = amount;

  for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
    const slot = normalizeStack(inv.slots[i]);
    if (!slot || slot.itemId !== itemId) continue;
    const space = def.stackSize - slot.count;
    if (space <= 0) continue;
    const add = Math.min(space, remaining);
    slot.count += add;
    inv.slots[i] = slot;
    remaining -= add;
  }

  for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
    if (inv.slots[i]) continue;
    const add = Math.min(def.stackSize, remaining);
    inv.slots[i] = { itemId, count: add, label: def.label };
    remaining -= add;
  }

  return remaining;
}

/**
 * @param {SlotInventory} inv
 * @param {string} itemId
 * @param {number} [amount]
 * @returns {number} amount removed
 */
export function removeStack(inv, itemId, amount = 1) {
  if (amount <= 0) return 0;
  let removed = 0;

  for (let i = inv.slots.length - 1; i >= 0 && removed < amount; i--) {
    const slot = normalizeStack(inv.slots[i]);
    if (!slot || slot.itemId !== itemId) continue;
    const take = Math.min(slot.count, amount - removed);
    slot.count -= take;
    removed += take;
    inv.slots[i] = slot.count > 0 ? slot : null;
  }

  return removed;
}

/**
 * @param {SlotInventory} inv
 * @param {string} itemId
 * @returns {number}
 */
export function countItem(inv, itemId) {
  let total = 0;
  for (const slot of inv.slots) {
    const stack = normalizeStack(slot);
    if (stack?.itemId === itemId) total += stack.count;
  }
  return total;
}
