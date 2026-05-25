import { displayCellPx } from '../../world.js';
import { getItemDef } from '../inventory/item-catalog.js';
import { ensureGemPickups } from './pickups.js';

/** @type {Map<string, import('p5').Image | null>} */
const sprites = new Map();
/** @type {Set<string>} */
const spriteFailed = new Set();
/** @type {Set<string>} */
const spriteLoading = new Set();

/** @param {import('p5')} p @param {string} iconPath */
function ensureSprite(p, iconPath) {
  if (sprites.has(iconPath) || spriteFailed.has(iconPath) || spriteLoading.has(iconPath)) {
    return;
  }
  spriteLoading.add(iconPath);
  p.loadImage(
    iconPath,
    (img) => {
      sprites.set(iconPath, img);
      spriteLoading.delete(iconPath);
    },
    () => {
      spriteFailed.add(iconPath);
      spriteLoading.delete(iconPath);
    }
  );
}

/** @param {import('p5')} p @param {import('../../world.js').World} world */
export function renderGemPickups(p, world) {
  const list = ensureGemPickups(world);
  if (!list.length) return;

  const cellPx = displayCellPx();
  const size = cellPx * 0.85;

  p.push();
  p.imageMode(p.CENTER);
  p.noStroke();

  for (const gem of list) {
    const def = getItemDef(gem.itemId);
    const icon = def?.icon;
    const px = (gem.x + 0.5) * cellPx;
    const py = (gem.y + 0.5) * cellPx;
    const wobble = Math.sin(world.tick * 0.12 + gem.x * 0.7) * cellPx * 0.04;

    if (icon) {
      ensureSprite(p, icon);
      const sprite = sprites.get(icon);
      if (sprite?.width) {
        p.image(sprite, px, py + wobble, size, size);
        continue;
      }
    }

    p.fill(120, 220, 255, 230);
    p.rect(px - size / 2, py + wobble - size / 2, size, size);
  }

  p.pop();
}
