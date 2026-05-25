/** Draw in-flight grenades using grenade.png sprite overlay. */

import { displayCellPx } from '../../js/cauldron/plugin.js';

/** @type {import('p5').Image | null} */
let sprite = null;
let spriteFailed = false;
let spriteLoading = false;

/**
 * p5.image() requires a p5.Image — load via p.loadImage, not HTMLImageElement.
 * @param {import('p5')} p
 */
function ensureSprite(p) {
  if (sprite || spriteFailed || spriteLoading) return;
  spriteLoading = true;
  p.loadImage(
    '/assets/grenade.png',
    (img) => {
      sprite = img;
      spriteLoading = false;
    },
    () => {
      spriteFailed = true;
      spriteLoading = false;
    }
  );
}

function drawFallbackGrenade(p, px, py) {
  p.fill(180, 60, 120);
  p.noStroke();
  p.ellipse(px, py, 10, 12);
  p.fill(90, 110, 70);
  p.rect(px - 3, py - 8, 6, 4);
}

/**
 * @param {import('p5')} p
 * @param {import('../../js/world.js').World} world
 */
export function renderGrenades(p, world) {
  const agents = world.agents.filter((a) => a.type === 'grenade');
  if (!agents.length) return;

  ensureSprite(p);

  const cellPx = displayCellPx();
  p.push();
  p.imageMode(p.CENTER);

  for (const g of agents) {
    const px = g.x * cellPx;
    const py = g.y * cellPx;
    const spin = (world.tick * 0.35 + g.x * 0.1) % (Math.PI * 2);
    const spriteW = 14 * (cellPx / 2);
    const spriteH = 18 * (cellPx / 2);

    if (sprite && sprite.width > 0) {
      p.push();
      p.translate(px, py);
      p.rotate(spin);
      p.image(sprite, 0, 0, spriteW, spriteH);
      p.pop();
    } else {
      drawFallbackGrenade(p, px, py);
    }
  }

  p.pop();
}

/**
 * @param {import('p5')} p
 * @param {import('../../js/world.js').World} world
 */
export function renderFragments(p, world) {
  const frags = world.plugin?.grenade?.fragments;
  if (!frags?.length) return;

  p.push();
  p.noStroke();
  const cellPx = displayCellPx();
  for (const f of frags) {
    const px = f.x * cellPx;
    const py = f.y * cellPx;
    const s = Math.max(2, cellPx * 0.75);
    p.fill(220, 100, 160, 200);
    p.rect(px - s / 2, py - s / 2, s, s);
  }
  p.pop();
}
