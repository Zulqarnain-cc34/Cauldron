import { Species } from '../../../../js/catalog/species.js';
import { getGameState } from '../game-state.js';
import { getBirdKindDef } from './catalog.js';
import { birdSimConfig } from './config.js';
import {
  toroidalDelta,
  toroidalVectorTo,
  wrapCoord,
  wrapWorldPosition,
} from './boundaries.js';
import {
  computeFlockAcceleration,
  computeSeparationForce,
  withinPerception,
} from './flock.js';
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
  const minGap = birdSimConfig.flock.personalSpace;
  const spread = Math.sqrt(count) * minGap * 1.8;

  for (let i = 0; i < count; i++) {
    const angle = world.rand() * Math.PI * 2;
    const r = world.rand() * spread;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const [fvx, fvy] = flowVelocity(x, y, world.tick, def.maxSpeed, world.width, world.height);
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

/** Terrain only — canvas edges never block (sky wraps). */
function isFlyableAt(world, x, y, worldW, worldH) {
  const gx = Math.floor(wrapCoord(x, worldW));
  const gy = Math.floor(wrapCoord(y, worldH));
  const i = (gx + gy * world.width) * STRIDE;
  const s = world.cells[i];
  return s === Species.EMPTY || s === Species.GAS || s === Species.STEAM;
}

/** Find open air near (cx, cy). */
function findOpenAir(world, cx, cy, radius = 24) {
  const w = world.width;
  const h = world.height;
  if (isFlyableAt(world, cx, cy, w, h)) return { x: wrapCoord(cx, w), y: wrapCoord(cy, h) };
  for (let r = 2; r < radius; r += 2) {
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      if (isFlyableAt(world, x, y, w, h)) {
        return { x: wrapCoord(x, w), y: wrapCoord(y, h) };
      }
    }
  }
  return { x: wrapCoord(cx, w), y: wrapCoord(cy, h) };
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

  const worldW = world.width;
  const worldH = world.height;

  for (const bird of birds) {
    const def = getBirdKindDef(bird.kind);
    const flockmates = byKind[bird.kind] ?? [];
    const neighbors = [];
    for (const other of flockmates) {
      if (other === bird) continue;
      if (withinPerception(bird, other, worldW, worldH)) neighbors.push(other);
    }

    let ax = 0;
    let ay = 0;

    const [wx, wy] = windSteer(
      bird,
      world.tick,
      def.maxSpeed,
      def.maxForce,
      worldW,
      worldH
    );
    ax += wx;
    ay += wy;

    const [sx, sy] = computeSeparationForce(
      bird,
      flockmates,
      def.maxForce,
      worldW,
      worldH
    );
    ax += sx;
    ay += sy;

    const [fx, fy] = computeFlockAcceleration(
      bird,
      neighbors,
      def.maxSpeed,
      def.maxForce,
      worldW,
      worldH
    );
    ax += fx;
    ay += fy;

    const dt = birdSimConfig.motion.simSpeed;

    bird.vx += ax * dt;
    bird.vy += ay * dt;

    let sp = Math.hypot(bird.vx, bird.vy);
    const minSp = def.maxSpeed * birdSimConfig.motion.minSpeedRatio;
    if (sp < minSp && minSp > 0.02) {
      const [fvx, fvy] = flowVelocity(
        bird.x,
        bird.y,
        world.tick,
        def.maxSpeed,
        worldW,
        worldH
      );
      const fm = Math.hypot(fvx, fvy) || 1;
      bird.vx = (fvx / fm) * minSp;
      bird.vy = (fvy / fm) * minSp;
      sp = minSp;
    }

    if (sp > def.maxSpeed) {
      bird.vx = (bird.vx / sp) * def.maxSpeed;
      bird.vy = (bird.vy / sp) * def.maxSpeed;
    }

    let nx = bird.x + bird.vx * dt;
    let ny = bird.y + bird.vy * dt;
    nx = wrapCoord(nx, worldW);
    ny = wrapCoord(ny, worldH);

    if (!isFlyableAt(world, nx, ny, worldW, worldH)) {
      const [fvx, fvy] = flowVelocity(
        bird.x,
        bird.y,
        world.tick,
        def.maxSpeed,
        worldW,
        worldH
      );
      bird.vx = fvx * 0.5;
      bird.vy = fvy * 0.5;
      nx = wrapCoord(bird.x + bird.vx * dt, worldW);
      ny = wrapCoord(bird.y + bird.vy * dt, worldH);
      if (!isFlyableAt(world, nx, ny, worldW, worldH)) {
        bird.vx *= -0.4;
        bird.vy *= -0.4;
        nx = wrapCoord(bird.x + bird.vx * dt, worldW);
        ny = wrapCoord(bird.y + bird.vy * dt, worldH);
      }
    }

    bird.x = nx;
    bird.y = ny;
    sp = Math.hypot(bird.vx, bird.vy);
    if (sp > 0.05) {
      bird.angle = Math.atan2(bird.vy, bird.vx);
    }
  }

  resolveBirdOverlaps(birds, worldW, worldH);
}

/**
 * Hard positional push so triangles never stack on the same spot.
 * @param {Bird[]} birds
 */
function resolveBirdOverlaps(birds, worldW, worldH) {
  const minDist = birdSimConfig.flock.personalSpace * 0.92;

  for (let i = 0; i < birds.length; i++) {
    for (let j = i + 1; j < birds.length; j++) {
      const a = birds[i];
      const b = birds[j];
      if (a.kind !== b.kind) continue;

      let [dx, dy] = toroidalVectorTo(a.x, a.y, b.x, b.y, worldW, worldH);
      let d = Math.hypot(dx, dy);

      if (d < 0.001) {
        const angle = ((a.x + a.y) % 628) / 100;
        dx = Math.cos(angle) * 0.01;
        dy = Math.sin(angle) * 0.01;
        d = 0.01;
      }

      if (d >= minDist) continue;

      const push = (minDist - d) * 0.55;
      const ux = dx / d;
      const uy = dy / d;
      a.x -= ux * push;
      a.y -= uy * push;
      b.x += ux * push;
      b.y += uy * push;
      wrapWorldPosition(a, worldW, worldH);
      wrapWorldPosition(b, worldW, worldH);
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
    { kind: 'sparrow', x: w * 0.28, y: h * 0.2, n: 12 },
    { kind: 'sparrow', x: w * 0.55, y: h * 0.16, n: 10 },
    { kind: 'eagle', x: w * 0.42, y: h * 0.32, n: 5 },
    { kind: 'finch', x: w * 0.35, y: h * 0.45, n: 11 },
    { kind: 'finch', x: w * 0.62, y: h * 0.4, n: 9 },
  ];

  for (const s of spots) {
    const open = findOpenAir(world, s.x, s.y);
    spawnFlock(world, s.kind, open.x, open.y, s.n);
  }
}
