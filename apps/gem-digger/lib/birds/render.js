import { displayCellPx } from '../../../../js/world.js';
import { ensureBirds } from './birds.js';
import { getBirdDef } from './catalog.js';
import { getSkyArena, toroidalRenderOffsets } from './boundaries.js';

/** @param {import('../../../../js/overlay.js').OverlayContext} overlay @param {import('../../../../js/world.js').World} world */
export function renderBirds(overlay, world) {
  const birds = ensureBirds(world);
  if (!birds.length) return;

  const cellPx = displayCellPx();
  const arena = getSkyArena(world);
  const def = getBirdDef();
  const size = def.size * (cellPx / 2);
  const seamMargin = 24;

  for (const bird of birds) {
    const nearSeam =
      bird.x < seamMargin ||
      bird.x > arena.worldW - seamMargin ||
      bird.y < arena.skyTop + seamMargin ||
      bird.y > arena.skyBottom - seamMargin;

    const offsets = nearSeam
      ? toroidalRenderOffsets(bird.x, bird.y, arena, seamMargin)
      : [[0, 0]];

    for (const [ox, oy] of offsets) {
      overlay.fillTriangle(
        (bird.x + ox) * cellPx,
        (bird.y + oy) * cellPx,
        size,
        bird.angle,
        def.color
      );
    }
  }
}
