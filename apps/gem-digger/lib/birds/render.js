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
  const seamMargin = Math.max(32, arena.skyH * 0.1, arena.worldW * 0.06);

  const def = getBirdDef();

  for (const bird of birds) {
    const size = def.size * (cellPx / 2);
    const margin = Math.max(seamMargin, def.size * 4);

    const offsets = toroidalRenderOffsets(bird.x, bird.y, arena, margin);

    if (bird.wrapCross) {
      if (bird.wrapCross & 1) {
        const gx = bird.x < arena.worldW * 0.5 ? arena.worldW - 2 : 2;
        offsets.push([gx - bird.x, 0]);
      }
      if (bird.wrapCross & 2) {
        const gy =
          bird.y < (arena.skyTop + arena.skyBottom) * 0.5
            ? arena.skyBottom - 2
            : arena.skyTop + 2;
        offsets.push([0, gy - bird.y]);
      }
    }

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
