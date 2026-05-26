import { displayCellPx } from '../../../../js/world.js';
import { birdSimConfig } from './config.js';
import { ensureBirds } from './birds.js';
import { getSkyArena, toroidalRenderOffsets } from './boundaries.js';

/** @param {import('../../../../js/overlay.js').OverlayContext} overlay @param {import('../../../../js/world.js').World} world */
export function renderBirdVisionDebug(overlay, world) {
  if (!birdSimConfig.display.showVisionDebug) return;

  const birds = ensureBirds(world);
  if (!birds.length) return;

  const cellPx = displayCellPx();
  const arena = getSkyArena(world);
  const f = birdSimConfig.flock;
  const sepR = f.separationRadius * cellPx;
  const aliR = (f.alignmentRadius ?? f.perception) * cellPx;
  const cohR = (f.cohesionRadius ?? f.perception) * cellPx;
  const coneR = Math.max(aliR, cohR);
  const fovDeg = f.visionFovDeg ?? 0;
  const halfFov = fovDeg > 0 ? ((fovDeg * Math.PI) / 180) * 0.5 : Math.PI;
  const seamMargin = 24;

  const showAll = birdSimConfig.display.visionDebugAll;
  const stride = showAll ? 1 : Math.max(1, Math.ceil(birds.length / 24));

  for (let bi = 0; bi < birds.length; bi += stride) {
    const bird = birds[bi];
    const vm2 = bird.vx * bird.vx + bird.vy * bird.vy;
    const angle = vm2 > 0.01 ? Math.atan2(bird.vy, bird.vx) : bird.angle;

    const nearSeam =
      bird.x < seamMargin ||
      bird.x > arena.worldW - seamMargin ||
      bird.y < arena.skyTop + seamMargin ||
      bird.y > arena.skyBottom - seamMargin;

    const offsets = nearSeam
      ? toroidalRenderOffsets(bird.x, bird.y, arena, seamMargin)
      : [[0, 0]];

    for (const [ox, oy] of offsets) {
      const cx = (bird.x + ox) * cellPx;
      const cy = (bird.y + oy) * cellPx;

      if (fovDeg > 0 && coneR > 0) {
        overlay.fillVisionCone(cx, cy, angle, coneR, halfFov, [255, 220, 120, 26]);
      }

      overlay.strokeCircle(cx, cy, sepR, [100, 220, 255, 55], 1, [3, 4]);
      overlay.strokeCircle(cx, cy, aliR, [255, 230, 100, 60], 1, [5, 4]);
      overlay.strokeCircle(cx, cy, cohR, [255, 120, 220, 60], 1, [2, 3]);
    }
  }
}
