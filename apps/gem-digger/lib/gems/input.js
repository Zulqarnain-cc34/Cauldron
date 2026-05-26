import { displayCellPx } from '../../../../js/world.js';
import { tryCollectGem } from './collect.js';

/**
 * Alt+click → backpack. Alt+Shift+click → jar. Right-click also collects (no erase when gem hit).
 * @param {import('../../world.js').World} world
 * @param {HTMLElement} canvas
 * @param {{ onCollected?: (result: ReturnType<typeof tryCollectGem>) => void }} [opts]
 */
export function setupGemCollectInput(world, canvas, opts = {}) {
  const handler = (e) => {
    const collectWithAlt = e.altKey && e.button === 0;
    const collectWithRight = e.button === 2 && !e.shiftKey;
    if (!collectWithAlt && !collectWithRight) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const px = displayCellPx();
    const gx = Math.floor(mx / px);
    const gy = Math.floor(my / px);

    const target = e.shiftKey && collectWithAlt ? 'jar' : 'backpack';
    const result = tryCollectGem(world, gx, gy, { target });
    if (!result.collected) return;

    e.preventDefault();
    e.stopPropagation();
    opts.onCollected?.(result);
  };

  canvas.addEventListener('mousedown', handler, true);
  return () => canvas.removeEventListener('mousedown', handler, true);
}
