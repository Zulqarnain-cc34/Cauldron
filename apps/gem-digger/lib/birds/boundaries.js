/**
 * Toroidal sky arena — seamless plane (Pac-Man style on X and Y in the open sky).
 */

import { Species } from '../../../../js/catalog/species.js';

const STRIDE = 5;

/** @typedef {object} SkyArena
 * @property {number} worldW
 * @property {number} worldH
 * @property {number} skyTop
 * @property {number} skyBottom
 * @property {number} skyH
 * @property {number} floorY
 */

/**
 * @param {import('../../../../js/world.js').World} world
 * @returns {SkyArena}
 */
export function getSkyArena(world) {
  const worldW = world.width;
  const worldH = world.height;
  let floorY = worldH - 1;

  for (let y = worldH - 1; y >= Math.floor(worldH * 0.5); y--) {
    let solid = 0;
    const samples = Math.min(12, worldW);
    const step = Math.max(1, Math.floor(worldW / samples));
    for (let x = 0; x < worldW; x += step) {
      const i = (x + y * worldW) * STRIDE;
      const s = world.cells[i];
      if (s !== Species.EMPTY && s !== Species.GAS && s !== Species.STEAM) solid++;
    }
    if (solid > samples * 0.4) {
      floorY = y;
      break;
    }
  }

  const skyTop = 0;
  const skyBottom = Math.max(skyTop, floorY - 1);
  const skyH = Math.max(1, skyBottom - skyTop + 1);

  return { worldW, worldH, skyTop, skyBottom, skyH, floorY };
}

export function wrapCoord(value, size) {
  if (size <= 0) return value;
  return ((value % size) + size) % size;
}

export function wrapSkyY(y, arena) {
  return wrapCoord(y - arena.skyTop, arena.skyH) + arena.skyTop;
}

export function toroidalSampleCoords(x, y, arena) {
  return [wrapCoord(x, arena.worldW), wrapSkyY(y, arena)];
}

export function toroidalVectorTo(fromX, fromY, toX, toY, arena) {
  let dx = toX - fromX;
  let dy = toY - fromY;

  if (arena.worldW > 0) {
    if (dx > arena.worldW * 0.5) dx -= arena.worldW;
    else if (dx < -arena.worldW * 0.5) dx += arena.worldW;
  }

  if (arena.skyH > 0) {
    if (dy > arena.skyH * 0.5) dy -= arena.skyH;
    else if (dy < -arena.skyH * 0.5) dy += arena.skyH;
  }

  return [dx, dy];
}

export function toroidalDelta(ax, ay, bx, by, arena) {
  return toroidalVectorTo(bx, by, ax, ay, arena);
}

/**
 * Wrap position; sets wrapCross bitmask (1=X, 2=Y) when seam was crossed this step.
 * @param {{ x: number, y: number, wrapCross?: number }} body
 * @param {number} prevX
 * @param {number} prevY
 * @param {SkyArena} arena
 */
export function wrapBirdPosition(body, prevX, prevY, arena) {
  const x = wrapCoord(body.x, arena.worldW);
  const y = wrapSkyY(body.y, arena);

  let wrapCross = 0;
  if (Math.abs(x - prevX) > arena.worldW * 0.45) wrapCross |= 1;
  if (Math.abs(y - prevY) > arena.skyH * 0.45) wrapCross |= 2;

  body.x = x;
  body.y = y;
  body.wrapCross = wrapCross;
}

export function wrapWindParticle(p, arena) {
  const x = p.x;
  const y = p.y;
  p.x = wrapCoord(p.x, arena.worldW);
  p.y = wrapSkyY(p.y, arena);
  p._px = x;
  p._py = y;
}

/**
 * Mirror offsets for seamless torus rendering (ghost on opposite edge, always on-screen).
 * @param {number} x
 * @param {number} y
 * @param {SkyArena} arena
 * @param {number} margin
 * @returns {[number, number][]}
 */
export function toroidalRenderOffsets(x, y, arena, margin) {
  /** @type {[number, number][]} */
  const offsets = [[0, 0]];
  const m = Math.max(margin, 8);
  const { worldW, skyTop, skyBottom } = arena;

  if (x < m) offsets.push([worldW, 0]);
  if (x > worldW - m) offsets.push([-worldW, 0]);

  if (y < skyTop + m) {
    const ghostY = skyBottom - (y - skyTop);
    offsets.push([0, ghostY - y]);
  }
  if (y > skyBottom - m) {
    const ghostY = skyTop + (skyBottom - y);
    offsets.push([0, ghostY - y]);
  }

  if (x < m && y < skyTop + m) {
    offsets.push([worldW, skyBottom - (y - skyTop) - y]);
  }
  if (x > worldW - m && y < skyTop + m) {
    offsets.push([-worldW, skyBottom - (y - skyTop) - y]);
  }
  if (x < m && y > skyBottom - m) {
    offsets.push([worldW, skyTop + (skyBottom - y) - y]);
  }
  if (x > worldW - m && y > skyBottom - m) {
    offsets.push([-worldW, skyTop + (skyBottom - y) - y]);
  }

  const seen = new Set();
  return offsets.filter(([ox, oy]) => {
    const key = `${ox},${oy}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** @deprecated */
export function wrapWorldPosition(body, worldW, worldH) {
  body.x = wrapCoord(body.x, worldW);
  body.y = wrapCoord(body.y, worldH);
}
