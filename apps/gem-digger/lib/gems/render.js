import { displayCellPx } from '../../../../js/world.js';
import { getOverlayImage, loadOverlayImage } from '../../../../js/overlay.js';
import { getItemDef } from '../inventory/item-catalog.js';
import { ensureGemPickups } from './pickups.js';

/** @param {import('../../../../js/overlay.js').OverlayContext} overlay @param {import('../../../../js/world.js').World} world */
export function renderGemPickups(overlay, world) {
  const list = ensureGemPickups(world);
  if (!list.length) return;

  const cellPx = displayCellPx();
  const size = cellPx * 0.85;

  for (const gem of list) {
    const def = getItemDef(gem.itemId);
    const icon = def?.icon;
    const px = (gem.x + 0.5) * cellPx;
    const py = (gem.y + 0.5) * cellPx;
    const wobble = Math.sin(world.tick * 0.12 + gem.x * 0.7) * cellPx * 0.04;

    if (icon) {
      loadOverlayImage(icon);
      const sprite = getOverlayImage(icon);
      if (sprite?.naturalWidth) {
        overlay.drawImageCenter(sprite, px, py + wobble, size, size);
        continue;
      }
    }

    overlay.fillRect(px - size / 2, py + wobble - size / 2, size, size, [120, 220, 255, 230]);
  }
}
