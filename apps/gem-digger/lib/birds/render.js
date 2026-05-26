import { displayCellPx } from '../../../../js/world.js';
import { ensureBirds } from './birds.js';
import { getBirdKindDef } from './catalog.js';
import { toroidalRenderOffsets } from './boundaries.js';

/** @param {import('../../../../js/overlay.js').OverlayContext} overlay @param {import('../../../../js/world.js').World} world */
export function renderBirds(overlay, world) {
  const birds = ensureBirds(world);
  if (!birds.length) return;

  const cellPx = displayCellPx();
  const worldW = world.width;
  const worldH = world.height;

  for (const bird of birds) {
    const def = getBirdKindDef(bird.kind);
    const size = def.size * (cellPx / 2);
    const margin = def.size + 4;

    for (const [ox, oy] of toroidalRenderOffsets(
      bird.x,
      bird.y,
      worldW,
      worldH,
      margin
    )) {
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
