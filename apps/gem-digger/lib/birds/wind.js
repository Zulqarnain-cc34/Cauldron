/**
 * Perlin-noise flow field — toroidal so wind matches across wrap edges.
 */

import { birdSimConfig } from './config.js';
import { wrapCoord } from './boundaries.js';

const PERM = new Uint8Array(512);
const GRAD = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [-0.707, 0.707],
  [0.707, -0.707],
  [-0.707, -0.707],
];

(function initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function grad2(hash, x, y) {
  const g = GRAD[hash & 7];
  return g[0] * x + g[1] * y;
}

function perlin2(x, y) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = PERM[PERM[xi] + yi];
  const ab = PERM[PERM[xi] + yi + 1];
  const ba = PERM[PERM[xi + 1] + yi];
  const bb = PERM[PERM[xi + 1] + yi + 1];

  const x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u);
  const x2 = lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u);
  return lerp(x1, x2, v);
}

/**
 * Flow velocity in grid space. Uses toroidal UV so left/right and top/bottom match.
 * @param {number} x
 * @param {number} y
 * @param {number} tick
 * @param {number} maxSpeed
 * @param {number} worldW
 * @param {number} worldH
 * @returns {[number, number]}
 */
export function flowVelocity(x, y, tick, maxSpeed, worldW, worldH) {
  const { noiseScale, timeScale, gustMin } = birdSimConfig.wind;
  const t = tick * timeScale;

  const wx = worldW > 0 ? wrapCoord(x, worldW) : x;
  const wy = worldH > 0 ? wrapCoord(y, worldH) : y;

  const u = worldW > 0 ? wx / worldW : wx * noiseScale;
  const v = worldH > 0 ? wy / worldH : wy * noiseScale;
  const periods = 5.5;

  const nx = u * periods + t;
  const ny = v * periods + t * 0.37;

  const n1 = perlin2(nx, ny);
  const n2 = perlin2(nx + 17.3, ny + 9.1);
  const angle = (n1 * 0.65 + n2 * 0.35) * Math.PI * 2;

  const gust = gustMin + (1 - gustMin) * perlin2(nx * 0.5 + 31, ny * 0.5 - 11);
  const speed = maxSpeed * gust;

  return [Math.cos(angle) * speed, Math.sin(angle) * speed];
}

/** @typedef {import('./birds.js').Bird} Bird */

/**
 * @param {Bird} bird
 * @param {number} tick
 * @param {number} maxSpeed
 * @param {number} maxForce
 * @param {number} worldW
 * @param {number} worldH
 */
export function windSteer(bird, tick, maxSpeed, maxForce, worldW, worldH) {
  const { speedFactor, steerWeight } = birdSimConfig.wind;
  const [tx, ty] = flowVelocity(
    bird.x,
    bird.y,
    tick,
    maxSpeed * speedFactor,
    worldW,
    worldH
  );
  let sx = tx - bird.vx;
  let sy = ty - bird.vy;
  const m = Math.hypot(sx, sy);
  if (m > maxForce && m > 0) {
    sx = (sx / m) * maxForce;
    sy = (sy / m) * maxForce;
  }
  return [sx * steerWeight, sy * steerWeight];
}
