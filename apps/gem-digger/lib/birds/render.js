import { displayCellPx } from '../../../../js/world.js';
import { ensureBirds } from './birds.js';
import { getBirdKindDef } from './catalog.js';

/** @param {import('../../../../js/overlay.js').OverlayContext} overlay @param {import('../../../../js/world.js').World} world */
export function renderBirds(overlay, world) {
  const birds = ensureBirds(world);
  if (!birds.length) return;

  const cellPx = displayCellPx();

  for (const bird of birds) {
    const def = getBirdKindDef(bird.kind);
    const px = bird.x * cellPx;
    const py = bird.y * cellPx;
    const size = def.size * (cellPx / 2);
    overlay.fillTriangle(px, py, size, bird.angle, def.color);
  }
}
