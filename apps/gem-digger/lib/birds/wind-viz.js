import { displayCellPx } from '../../../../js/world.js';
import { getSkyArena, toroidalRenderOffsets, wrapCoord, wrapSkyY } from './boundaries.js';
import { flowVelocity } from './wind.js';
import { birdSimConfig } from './config.js';

/**
 * @typedef {{ x: number, y: number, life: number }} WindParticle
 */

/** @type {WindParticle[]} */
let particles = [];
let lastWorldKey = '';

function worldKey(world) {
  return `${world.width}x${world.height}`;
}

function seedParticles(world, count) {
  particles = [];
  const arena = getSkyArena(world);
  const margin = 12;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: margin + world.rand() * (arena.worldW - margin * 2),
      y: arena.skyTop + margin + world.rand() * Math.max(8, arena.skyH - margin * 2),
      life: world.rand(),
    });
  }
}

function respawnParticle(world, p) {
  const arena = getSkyArena(world);
  const margin = 8;
  p.x = margin + world.rand() * (arena.worldW - margin * 2);
  p.y = arena.skyTop + margin + world.rand() * Math.max(8, arena.skyH - margin * 2);
  p.life = 0;
}

/**
 * @param {import('../../../../js/overlay.js').OverlayContext} overlay
 * @param {number} px
 * @param {number} py
 * @param {number} angle
 * @param {number} len
 * @param {number} alpha
 * @param {number} width
 */
function drawStreak(overlay, px, py, angle, len, alpha, width) {
  overlay.strokeFlowStreak(px, py, angle, len, [160, 210, 255, alpha], width);
}

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
  const arena = getSkyArena(world);
  const refSpeed = 1.15;
  const baseAlpha = Math.round(windOpacity * 2.2);
  const drift = windDriftSpeed * 0.38 * birdSimConfig.motion.simSpeed;
  const seamMargin = Math.max(32, arena.skyH * 0.1, arena.worldW * 0.06);

  for (const p of particles) {
    const prevX = p.x;
    const prevY = p.y;

    const [vx, vy] = flowVelocity(p.x, p.y, world.tick, refSpeed, arena);
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

    p.x = wrapCoord(p.x, arena.worldW);
    p.y = wrapSkyY(p.y, arena);

    const angle = Math.atan2(vy, vx);
    const strength = Math.min(1, mag / refSpeed);
    const len = windStreakLength * (0.45 + strength * 0.55);
    const alpha = Math.round(baseAlpha * (0.35 + strength * 0.65));
    const width = 0.9 + strength * 0.6;

    const offsets = toroidalRenderOffsets(p.x, p.y, arena, seamMargin);
    if (Math.abs(p.x - prevX) > arena.worldW * 0.45) {
      offsets.push([p.x < arena.worldW * 0.5 ? arena.worldW - 2 - p.x : 2 - p.x, 0]);
    }
    if (Math.abs(p.y - prevY) > arena.skyH * 0.45) {
      const gy =
        p.y < (arena.skyTop + arena.skyBottom) * 0.5 ? arena.skyBottom - 2 : arena.skyTop + 2;
      offsets.push([0, gy - p.y]);
    }

    for (const [ox, oy] of offsets) {
      drawStreak(
        overlay,
        (p.x + ox) * cellPx,
        (p.y + oy) * cellPx,
        angle,
        len,
        alpha,
        width
      );
    }

    if (p.life > 1.2) {
      respawnParticle(world, p);
    }
  }
}

export function resetWindParticles() {
  particles = [];
  lastWorldKey = '';
}
