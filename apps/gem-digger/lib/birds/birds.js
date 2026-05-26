import { Species } from '../../../../js/catalog/species.js';
import { getGameState } from '../game-state.js';
import { getBirdKindDef } from './catalog.js';
import { computeFlockAcceleration, withinPerception, FLOCK_MIN_SIZE } from './flock.js';

/** @typedef {import('./catalog.js').BirdKind} BirdKind */

/**
 * @typedef {object} Bird
 * @property {string} id
 * @property {BirdKind} kind
 * @property {number} x grid space
 * @property {number} y grid space
 * @property {number} vx
 * @property {number} vy
 * @property {number} angle radians, nose along velocity
 */

const STRIDE = 5;
const MARGIN = 4;
const WANDER_FORCE = 0.018;

/** @param {import('../../../../js/world.js').World} world */
export function ensureBirds(world) {
  const state = getGameState(world);
  if (!state.birds) state.birds = [];
  return state.birds;
}

/** @param {import('../../../../js/world.js').World} world */
export function clearBirds(world) {
  ensureBirds(world).length = 0;
}

/** @param {Bird[]} birds */
export function cloneBirds(birds) {
  return birds.map((b) => ({ ...b }));
}

/** @param {import('../../../../js/world.js').World} world @param {Bird[]} birds */
export function setBirds(world, birds) {
  getGameState(world).birds = cloneBirds(birds);
}

/**
 * @param {import('../../../../js/world.js').World} world
 * @param {BirdKind} kind
 * @param {number} cx
 * @param {number} cy
 * @param {number} count
 */
export function spawnFlock(world, kind, cx, cy, count) {
  const list = ensureBirds(world);
  const def = getBirdKindDef(kind);
  const spread = Math.sqrt(count) * 3;

  for (let i = 0; i < count; i++) {
    const angle = world.rand() * Math.PI * 2;
    const r = world.rand() * spread;
    const speed = def.maxSpeed * (0.4 + world.rand() * 0.4);
    list.push({
      id: `bird-${kind}-${world.tick}-${list.length}-${world.randInt(1_000_000)}`,
      kind,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: Math.cos(angle + Math.PI / 2) * speed,
      vy: Math.sin(angle + Math.PI / 2) * speed,
      angle: 0,
    });
  }
}

/** @param {import('../../../../js/world.js').World} world @param {number} gx @param {number} gy */
function isFlyable(world, gx, gy) {
  if (!world.inBounds(gx, gy)) return false;
  const i = (gx + gy * world.width) * STRIDE;
  const s = world.cells[i];
  return s === Species.EMPTY || s === Species.GAS || s === Species.STEAM;
}

/**
 * @param {import('../../../../js/world.js').World} world
 */
export function tickBirds(world) {
  const birds = ensureBirds(world);
  if (!birds.length) return;

  /** @type {Bird[][]} */
  const byKind = { sparrow: [], eagle: [], finch: [] };
  for (const b of birds) {
    (byKind[b.kind] ??= []).push(b);
  }

  for (const bird of birds) {
    const def = getBirdKindDef(bird.kind);
    const flockmates = byKind[bird.kind] ?? [];
    const neighbors = [];
    for (const other of flockmates) {
      if (other === bird) continue;
      if (withinPerception(bird, other)) neighbors.push(other);
    }

    let ax = 0;
    let ay = 0;
    const [fx, fy] = computeFlockAcceleration(bird, neighbors, def.maxForce);
    ax += fx;
    ay += fy;

    if (neighbors.length < FLOCK_MIN_SIZE) {
      const wa = world.rand() * Math.PI * 2;
      ax += Math.cos(wa) * WANDER_FORCE;
      ay += Math.sin(wa) * WANDER_FORCE;
    }

    bird.vx += ax;
    bird.vy += ay;
    const sp = Math.hypot(bird.vx, bird.vy);
    if (sp > def.maxSpeed) {
      bird.vx = (bird.vx / sp) * def.maxSpeed;
      bird.vy = (bird.vy / sp) * def.maxSpeed;
    }

    let nx = bird.x + bird.vx;
    let ny = bird.y + bird.vy;

    const gx = Math.floor(nx);
    const gy = Math.floor(ny);
    if (!isFlyable(world, gx, gy)) {
      bird.vx *= -0.6;
      bird.vy *= -0.6;
      nx = bird.x + bird.vx;
      ny = bird.y + bird.vy;
    }

    if (nx < MARGIN) {
      nx = MARGIN;
      bird.vx = Math.abs(bird.vx) * 0.5;
    }
    if (ny < MARGIN) {
      ny = MARGIN;
      bird.vy = Math.abs(bird.vy) * 0.5;
    }
    if (nx > world.width - MARGIN) {
      nx = world.width - MARGIN;
      bird.vx = -Math.abs(bird.vx) * 0.5;
    }
    if (ny > world.height - MARGIN) {
      ny = world.height - MARGIN;
      bird.vy = -Math.abs(bird.vy) * 0.5;
    }

    bird.x = nx;
    bird.y = ny;
    if (sp > 0.05) {
      bird.angle = Math.atan2(bird.vy, bird.vx);
    }
  }
}

/**
 * Demo flocks — separate groups per kind in different map regions.
 * @param {import('../../../../js/world.js').World} world
 */
export function spawnDemoFlocks(world) {
  clearBirds(world);
  const w = world.width;
  const h = world.height;
  spawnFlock(world, 'sparrow', w * 0.22, h * 0.28, 18);
  spawnFlock(world, 'sparrow', w * 0.75, h * 0.22, 14);
  spawnFlock(world, 'eagle', w * 0.55, h * 0.45, 8);
  spawnFlock(world, 'finch', w * 0.35, h * 0.72, 16);
  spawnFlock(world, 'finch', w * 0.82, h * 0.68, 12);
}
