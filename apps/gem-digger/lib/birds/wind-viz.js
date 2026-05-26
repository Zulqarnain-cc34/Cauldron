import { displayCellPx } from '../../../../js/world.js';
import { flowVelocity } from './wind.js';
import { birdSimConfig } from './config.js';

/**
 * @typedef {{ x: number, y: number, life: number }} WindParticle
 */

/** @type {WindParticle[]} */
let particles = [];
let lastWorldKey = '';

/**
 * @param {import('../../../../js/world.js').World} world
 */
function worldKey(world) {
  return `${world.width}x${world.height}`;
}

/**
 * @param {import('../../../../js/world.js').World} world
 * @param {number} count
 */
function seedParticles(world, count) {
  particles = [];
  const margin = 12;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: margin + world.rand() * (world.width - margin * 2),
      y: margin + world.rand() * (world.height - margin * 2),
      life: world.rand(),
    });
  }
}

/**
 * @param {import('../../../../js/world.js').World} world
 */
function respawnParticle(world, p) {
  const margin = 8;
  p.x = margin + world.rand() * (world.width - margin * 2);
  p.y = margin + world.rand() * (world.height - margin * 2);
  p.life = 0;
}

/**
 * Animated flow streaks — particles drift along the Perlin field (no arrow grid).
 * @param {import('../../../../js/overlay.js').OverlayContext} overlay
 * @param {import('../../../../js/world.js').World} world
 */
export function renderWindField(overlay, world) {
  const { showWindField, windParticleCount, windStreakLength, windOpacity, windDriftSpeed } =
    birdSimConfig.display;
  if (!showWindField) return;

  const key = worldKey(world);
  if (key !== lastWorldKey || particles.length !== windParticleCount) {
    lastWorldKey = key;
    seedParticles(world, windParticleCount);
  }

  const cellPx = displayCellPx();
  const refSpeed = 1.15;
  const baseAlpha = Math.round(windOpacity * 2.2);
  const drift = windDriftSpeed * 0.38;

  for (const p of particles) {
    const [vx, vy] = flowVelocity(p.x, p.y, world.tick, refSpeed);
    const mag = Math.hypot(vx, vy);
    if (mag < 0.02) {
      respawnParticle(world, p);
      continue;
    }

    const nx = vx / mag;
    const ny = vy / mag;
    p.x += nx * drift * (0.7 + mag * 0.35);
    p.y += ny * drift * (0.7 + mag * 0.35);
    p.life += 0.012 + mag * 0.008;

    const px = p.x * cellPx;
    const py = p.y * cellPx;
    const angle = Math.atan2(vy, vx);
    const strength = Math.min(1, mag / refSpeed);
    const len = windStreakLength * (0.45 + strength * 0.55);
    const alpha = Math.round(baseAlpha * (0.35 + strength * 0.65));
    const width = 0.9 + strength * 0.6;

    overlay.strokeFlowStreak(px, py, angle, len, [160, 210, 255, alpha], width);

    const margin = 6;
    if (
      p.x < margin ||
      p.y < margin ||
      p.x > world.width - margin ||
      p.y > world.height - margin ||
      p.life > 1
    ) {
      respawnParticle(world, p);
    }
  }
}

/** Call after map reset if particles should redistribute. */
export function resetWindParticles() {
  particles = [];
  lastWorldKey = '';
}
