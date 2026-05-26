import { JAR_COLS, JAR_ROWS, createJarInventory } from '../lib/index.js';
import { getGameState } from '../lib/game-state.js';
import { assetIcon } from '../lib/config.js';
import { mountInventoryContainer } from './inventory-ui.js';

/**
 * @param {import('../../../js/world.js').World} world
 * @param {{ cols?: number, rows?: number, iconSrc?: string }} [opts]
 */
export function mountJar(world, opts = {}) {
  const cols = opts.cols ?? JAR_COLS;
  const rows = opts.rows ?? JAR_ROWS;
  const iconSrc = opts.iconSrc ?? assetIcon('jar');
  const state = getGameState(world);

  if (!state.jar) {
    state.jar = createJarInventory(cols, rows);
  }

  const toolbar = document.getElementById('sim-toolbar');
  if (!toolbar) return null;

  return mountInventoryContainer({
    overlayId: 'jar-overlay',
    title: 'Jar',
    iconSrc,
    hotkeyLabel: 'J',
    hotkeyCode: 'KeyJ',
    hint: 'Alt+Shift+click gemstones to store them in the jar.',
    getInventory: () => state.jar,
    toolbar,
    toggleClass: 'container-toggle-jar',
  });
}
