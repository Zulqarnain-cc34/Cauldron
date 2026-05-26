import {
  BACKPACK_COLS,
  BACKPACK_ROWS,
  createBackpackInventory,
} from '../lib/index.js';
import { getGameState } from '../lib/game-state.js';
import { assetIcon } from '../lib/config.js';
import { mountInventoryContainer } from './inventory-ui.js';

/**
 * @param {import('../../../js/world.js').World} world
 * @param {{ cols?: number, rows?: number, iconSrc?: string }} [opts]
 */
export function mountBackpack(world, opts = {}) {
  const cols = opts.cols ?? BACKPACK_COLS;
  const rows = opts.rows ?? BACKPACK_ROWS;
  const iconSrc = opts.iconSrc ?? assetIcon('backpack');
  const state = getGameState(world);

  if (!state.backpack) {
    state.backpack = createBackpackInventory(cols, rows);
  }

  const toolbar = document.getElementById('sim-toolbar');
  if (!toolbar) return null;

  return mountInventoryContainer({
    overlayId: 'backpack-overlay',
    title: 'Backpack',
    iconSrc,
    hotkeyLabel: 'E',
    hotkeyCode: 'KeyE',
    hint: 'Alt+click gemstones in the world to collect them here.',
    getInventory: () => state.backpack,
    toolbar,
    toggleClass: 'container-toggle-backpack',
  });
}
