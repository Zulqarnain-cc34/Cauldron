import { Species } from '../../../../js/catalog/species.js';
import { getGameState } from '../game-state.js';
import { getBirdKindDef } from './catalog.js';
import { birdSimConfig } from './config.js';
import { computeFlockAcceleration, withinPerception } from './flock.js';
import { flowVelocity, windSteer } from './wind.js';

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
const MARGIN = 6;

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
  const spread = Math.sqrt(count) * 7;

  for (let i = 0; i < count; i++) {
    const angle = world.rand() * Math.PI * 2;
    const r = world.rand() * spread;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const [fvx, fvy] = flowVelocity(x, y, world.tick, def.maxSpeed);
    const jitter = 0.15;
    list.push({
      id: `bird-${kind}-${world.tick}-${list.length}-${world.randInt(1_000_000)}`,
      kind,
      x,
      y,
      vx: fvx + (world.rand() - 0.5) * jitter,
      vy: fvy + (world.rand() - 0.5) * jitter,
      angle: Math.atan2(fvy, fvx),
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

/** Find open air near (cx, cy). */
function findOpenAir(world, cx, cy, radius = 24) {
  if (isFlyable(world, Math.floor(cx), Math.floor(cy))) return { x: cx, y: cy };
  for (let r = 2; r < radius; r += 2) {
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      if (isFlyable(world, Math.floor(x), Math.floor(y))) return { x, y };
    }
  }
  return { x: cx, y: cy };
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

    const [wx, wy] = windSteer(bird, world.tick, def.maxSpeed, def.maxForce);
    ax += wx;
    ay += wy;

    const [fx, fy] = computeFlockAcceleration(
      bird,
      neighbors,
      def.maxSpeed,
      def.maxForce
    );
    ax += fx;
    ay += fy;

    bird.vx += ax;
    bird.vy += ay;

    let sp = Math.hypot(bird.vx, bird.vy);
    const minSp = def.maxSpeed * birdSimConfig.motion.minSpeedRatio;
    if (sp < minSp) {
      const [fvx, fvy] = flowVelocity(bird.x, bird.y, world.tick, def.maxSpeed);
      const fm = Math.hypot(fvx, fvy) || 1;
      bird.vx = (fvx / fm) * minSp;
      bird.vy = (fvy / fm) * minSp;
      sp = minSp;
    }

    if (sp > def.maxSpeed) {
      bird.vx = (bird.vx / sp) * def.maxSpeed;
      bird.vy = (bird.vy / sp) * def.maxSpeed;
    }

    let nx = bird.x + bird.vx;
    let ny = bird.y + bird.vy;

    const gx = Math.floor(nx);
    const gy = Math.floor(ny);
    if (!isFlyable(world, gx, gy)) {
      const [fvx, fvy] = flowVelocity(bird.x, bird.y, world.tick, def.maxSpeed);
      bird.vx = fvx * 0.5;
      bird.vy = fvy * 0.5;
      nx = bird.x + bird.vx;
      ny = bird.y + bird.vy;
      if (!isFlyable(world, Math.floor(nx), Math.floor(ny))) {
        bird.vx *= -0.4;
        bird.vy *= -0.4;
        nx = bird.x + bird.vx;
        ny = bird.y + bird.vy;
      }
    }

    if (nx < MARGIN) {
      nx = MARGIN;
      bird.vx = Math.abs(bird.vx) + 0.2;
    }
    if (ny < MARGIN) {
      ny = MARGIN;
      bird.vy = Math.abs(bird.vy) + 0.2;
    }
    if (nx > world.width - MARGIN) {
      nx = world.width - MARGIN;
      bird.vx = -Math.abs(bird.vx) - 0.2;
    }
    if (ny > world.height - MARGIN) {
      ny = world.height - MARGIN;
      bird.vy = -Math.abs(bird.vy) - 0.2;
    }

    bird.x = nx;
    bird.y = ny;
    sp = Math.hypot(bird.vx, bird.vy);
    if (sp > 0.05) {
      bird.angle = Math.atan2(bird.vy, bird.vx);
    }
  }
}

/**
 * Demo flocks — separate groups per kind in open sky regions.
 * @param {import('../../../../js/world.js').World} world
 */
export function spawnDemoFlocks(world) {
  clearBirds(world);
  const w = world.width;
  const h = world.height;

  const spots = [
    { kind: 'sparrow', x: w * 0.22, y: h * 0.18, n: 16 },
    { kind: 'sparrow', x: w * 0.78, y: h * 0.15, n: 14 },
    { kind: 'eagle', x: w * 0.55, y: h * 0.35, n: 7 },
    { kind: 'finch', x: w * 0.3, y: h * 0.55, n: 14 },
    { kind: 'finch', x: w * 0.85, y: h * 0.5, n: 12 },
  ];

  for (const s of spots) {
    const open = findOpenAir(world, s.x, s.y);
    spawnFlock(world, s.kind, open.x, open.y, s.n);
  }
}
