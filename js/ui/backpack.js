import {
  BACKPACK_COLS,
  BACKPACK_ROWS,
  createBackpackInventory,
} from '../sim/backpack-inventory.js';
import { mountInventoryContainer } from './inventory-ui.js';

const BACKPACK_ICON = '/assets/backpack.png';

/**
 * @param {import('../world.js').World} world
 * @param {{ cols?: number, rows?: number, iconSrc?: string }} [opts]
 */
export function mountBackpack(world, opts = {}) {
  const cols = opts.cols ?? BACKPACK_COLS;
  const rows = opts.rows ?? BACKPACK_ROWS;
  const iconSrc = opts.iconSrc ?? BACKPACK_ICON;

  if (!world.backpack) {
    world.backpack = createBackpackInventory(cols, rows);
  }

  const toolbar = document.getElementById('sim-toolbar');
  if (!toolbar) return null;

  return mountInventoryContainer({
    overlayId: 'backpack-overlay',
    title: 'Backpack',
    iconSrc,
    hotkeyLabel: 'E',
    hotkeyCode: 'KeyE',
    hint: 'Collect items in the world — they will appear here.',
    getInventory: () => world.backpack,
    toolbar,
    toggleClass: 'container-toggle-backpack',
  });
}
