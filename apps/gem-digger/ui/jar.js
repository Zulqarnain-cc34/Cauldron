import { JAR_COLS, JAR_ROWS, createJarInventory } from '../lib/index.js';
import { mountInventoryContainer } from './inventory-ui.js';

const JAR_ICON = '/apps/gem-digger/assets/jar.png';

/**
 * @param {import('../world.js').World} world
 * @param {{ cols?: number, rows?: number, iconSrc?: string }} [opts]
 */
export function mountJar(world, opts = {}) {
  const cols = opts.cols ?? JAR_COLS;
  const rows = opts.rows ?? JAR_ROWS;
  const iconSrc = opts.iconSrc ?? JAR_ICON;

  if (!world.jar) {
    world.jar = createJarInventory(cols, rows);
  }

  const toolbar = document.getElementById('sim-toolbar');
  if (!toolbar) return null;

  return mountInventoryContainer({
    overlayId: 'jar-overlay',
    title: 'Jar',
    iconSrc,
    hotkeyLabel: 'J',
    hotkeyCode: 'KeyJ',
    hint: 'Store materials like sand, or tools like grenades.',
    getInventory: () => world.jar,
    toolbar,
    toggleClass: 'container-toggle-jar',
  });
}
