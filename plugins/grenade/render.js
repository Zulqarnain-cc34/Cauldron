/** Draw in-flight grenades using grenade.png sprite overlay. */

import { displayCellPx, getOverlayImage, loadOverlayImage } from '../../js/cauldron/plugin.js';

/** @type {HTMLImageElement | null} */
let sprite = null;
const GRENADE_SPRITE = '/apps/gem-digger/assets/grenade.png';

function ensureGrenadeSprite() {
  if (sprite) return;
  loadOverlayImage(GRENADE_SPRITE, (img) => {
    sprite = img;
  });
  sprite = getOverlayImage(GRENADE_SPRITE);
}

/**
 * @param {import('../../js/overlay.js').OverlayContext} overlay
 * @param {number} px
 * @param {number} py
 */
function drawFallbackGrenade(overlay, px, py) {
  overlay.fillEllipse(px, py, 10, 12, [180, 60, 120, 255]);
  overlay.fillRect(px - 3, py - 8, 6, 4, [90, 110, 70, 255]);
}

/**
 * @param {import('../../js/overlay.js').OverlayContext} overlay
 * @param {import('../../js/world.js').World} world
 */
export function renderGrenades(overlay, world) {
  const agents = world.agents.filter((a) => a.type === 'grenade');
  if (!agents.length) return;

  ensureGrenadeSprite();
  const cellPx = displayCellPx();

  for (const g of agents) {
    const px = g.x * cellPx;
    const py = g.y * cellPx;
    const spin = (world.tick * 0.35 + g.x * 0.1) % (Math.PI * 2);
    const spriteW = 14 * (cellPx / 2);
    const spriteH = 18 * (cellPx / 2);

    if (sprite?.naturalWidth) {
      overlay.save();
      overlay.translate(px, py);
      overlay.rotate(spin);
      overlay.drawImageCenter(sprite, 0, 0, spriteW, spriteH);
      overlay.restore();
    } else {
      drawFallbackGrenade(overlay, px, py);
    }
  }
}

/**
 * @param {import('../../js/overlay.js').OverlayContext} overlay
 * @param {import('../../js/world.js').World} world
 */
export function renderFragments(overlay, world) {
  const frags = world.plugin?.grenade?.fragments;
  if (!frags?.length) return;

  const cellPx = displayCellPx();
  for (const f of frags) {
    const px = f.x * cellPx;
    const py = f.y * cellPx;
    const s = Math.max(2, cellPx * 0.75);
    overlay.fillRect(px - s / 2, py - s / 2, s, s, [220, 100, 160, 200]);
  }
}
