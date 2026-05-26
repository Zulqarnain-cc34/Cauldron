import { Species } from '../../../../js/catalog/species.js';
import { getGameState } from '../game-state.js';
import { getBirdDef } from './catalog.js';
import { birdSimConfig } from './config.js';
import {
  getSkyArena,
  toroidalVectorTo,
  wrapBirdPosition,
  wrapCoord,
  wrapSkyY,
} from './boundaries.js';
import { buildBirdSpatialIndex, forEachBirdNearby } from './spatial.js';
import { computeFlockAcceleration, computeLocalFlockData } from './flock.js';
import { flowVelocity, windSteer } from './wind.js';

/**
 * @typedef {object} Bird
 * @property {string} id
 * @property {number} x grid space
 * @property {number} y grid space
 * @property {number} vx
 * @property {number} vy
 * @property {number} angle radians, nose along velocity
 * @property {number} [wrapCross] bitmask 1=X 2=Y seam crossed last step
 */

const STRIDE = 5;

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
 * @param {number} cx
 * @param {number} cy
 * @param {number} count
 */
export function spawnFlock(world, cx, cy, count) {
  const list = ensureBirds(world);
  const def = getBirdDef();
  const minGap = birdSimConfig.flock.personalSpace;
  const spread = Math.sqrt(count) * minGap * 1.8;

  for (let i = 0; i < count; i++) {
    const angle = world.rand() * Math.PI * 2;
    const r = world.rand() * spread;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const arena = getSkyArena(world);
    const [fvx, fvy] = flowVelocity(x, y, world.tick, def.maxSpeed, arena);
    const jitter = 0.15;
    list.push({
      id: `bird-${world.tick}-${list.length}-${world.randInt(1_000_000)}`,
      x,
      y,
      vx: fvx + (world.rand() - 0.5) * jitter,
      vy: fvy + (world.rand() - 0.5) * jitter,
      angle: Math.atan2(fvy, fvx),
    });
  }
}

/** Terrain only — canvas edges never block (sky wraps). */
function isFlyableAt(world, x, y, arena) {
  const gx = Math.floor(wrapCoord(x, arena.worldW));
  const gy = Math.floor(wrapSkyY(y, arena));
  const i = (gx + gy * world.width) * STRIDE;
  const s = world.cells[i];
  return s === Species.EMPTY || s === Species.GAS || s === Species.STEAM;
}

/** Find open air near (cx, cy). */
function findOpenAir(world, cx, cy, radius = 24) {
  const arena = getSkyArena(world);
  if (isFlyableAt(world, cx, cy, arena)) {
    return { x: wrapCoord(cx, arena.worldW), y: wrapSkyY(cy, arena) };
  }
  for (let r = 2; r < radius; r += 2) {
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      if (isFlyableAt(world, x, y, arena)) {
        return { x: wrapCoord(x, arena.worldW), y: wrapSkyY(y, arena) };
      }
    }
  }
  return { x: wrapCoord(cx, arena.worldW), y: wrapSkyY(cy, arena) };
}

/**
 * @param {import('../../../../js/world.js').World} world
 * @param {number} dt integration step (≤ simSpeed)
 */
function tickBirdsStep(world, dt) {
  const birds = ensureBirds(world);
  if (!birds.length) return;

  const arena = getSkyArena(world);
  const def = getBirdDef();
  const spatial = buildBirdSpatialIndex(birds, arena);

  for (const bird of birds) {
    const { neighbors, sepAx, sepAy, crowded } = computeLocalFlockData(
      bird,
      spatial,
      arena,
      def.maxForce
    );

    let ax = 0;
    let ay = 0;

    const [wx, wy] = windSteer(bird, world.tick, def.maxSpeed, def.maxForce, arena);
    ax += wx;
    ay += wy;
    ax += sepAx;
    ay += sepAy;

    const [fx, fy] = computeFlockAcceleration(
      bird,
      neighbors,
      def.maxSpeed,
      def.maxForce,
      arena
    );
    ax += fx;
    ay += fy;

    const accelMag = Math.hypot(ax, ay);
    const maxAccel = def.maxForce * (2.2 + 2.8 / Math.max(dt, 0.15));
    if (accelMag > maxAccel && accelMag > 0) {
      ax = (ax / accelMag) * maxAccel;
      ay = (ay / accelMag) * maxAccel;
    }

    bird.vx += ax * dt;
    bird.vy += ay * dt;

    const maxSp = def.maxSpeed * (1 + dt * 0.35);
    let sp = Math.hypot(bird.vx, bird.vy);
    if (sp > maxSp && sp > 0) {
      bird.vx = (bird.vx / sp) * maxSp;
      bird.vy = (bird.vy / sp) * maxSp;
    }

    sp = Math.hypot(bird.vx, bird.vy);
    const minSp = def.maxSpeed * birdSimConfig.motion.minSpeedRatio * (crowded ? 0.35 : 1);
    if (sp < minSp && minSp > 0.02) {
      let dirX = bird.vx;
      let dirY = bird.vy;
      const useWind = birdSimConfig.wind.enabled && birdSimConfig.wind.steerWeight > 0;

      if (useWind) {
        const [fvx, fvy] = flowVelocity(bird.x, bird.y, world.tick, def.maxSpeed, arena);
        const fm = Math.hypot(fvx, fvy) || 1;
        const dot = bird.vx * fvx + bird.vy * fvy;
        if (sp < 0.03 || dot >= 0) {
          dirX = fvx / fm;
          dirY = fvy / fm;
        } else {
          dirX /= sp;
          dirY /= sp;
        }
      } else if (sp > 0.01) {
        dirX /= sp;
        dirY /= sp;
      } else {
        dirX = Math.cos(bird.angle);
        dirY = Math.sin(bird.angle);
      }

      const dm = Math.hypot(dirX, dirY) || 1;
      bird.vx = (dirX / dm) * minSp;
      bird.vy = (dirY / dm) * minSp;
      sp = minSp;
    }

    if (sp > def.maxSpeed) {
      bird.vx = (bird.vx / sp) * def.maxSpeed;
      bird.vy = (bird.vy / sp) * def.maxSpeed;
    }

    const px = bird.x;
    const py = bird.y;
    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;
    wrapBirdPosition(bird, px, py, arena);

    if (!isFlyableAt(world, bird.x, bird.y, arena)) {
      bird.x = px;
      bird.y = py;
      const [fvx, fvy] = flowVelocity(bird.x, bird.y, world.tick, def.maxSpeed, arena);
      bird.vx = fvx * 0.5;
      bird.vy = fvy * 0.5;
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      wrapBirdPosition(bird, px, py, arena);
      if (!isFlyableAt(world, bird.x, bird.y, arena)) {
        bird.x = px;
        bird.y = py;
        bird.vx *= -0.4;
        bird.vy *= -0.4;
        bird.x += bird.vx * dt;
        bird.y += bird.vy * dt;
        wrapBirdPosition(bird, px, py, arena);
      }
    }
    sp = Math.hypot(bird.vx, bird.vy);
    if (sp > 0.05) {
      bird.angle = Math.atan2(bird.vy, bird.vx);
    }
  }

  if (birds.length > 1) {
    resolveBirdOverlaps(birds, spatial, arena, dt);
  }
}

/** Smaller dt per substep keeps motion stable up to 20× sim speed. */
function integrationSubsteps(simSpeed) {
  const maxDt = 0.35;
  return Math.max(1, Math.ceil(simSpeed / maxDt));
}

/**
 * @param {import('../../../../js/world.js').World} world
 */
export function tickBirds(world) {
  const simSpeed = birdSimConfig.motion.simSpeed;
  const steps = integrationSubsteps(simSpeed);
  const dt = simSpeed / steps;

  for (let i = 0; i < steps; i++) {
    tickBirdsStep(world, dt);
  }
}

/**
 * Hard positional push so triangles never stack on the same spot.
 * @param {Bird[]} birds
 */
function resolveBirdOverlaps(birds, spatial, arena, dt = 1) {
  const minDist = birdSimConfig.flock.personalSpace * 0.95;
  const pushScale = Math.min(1, 0.35 + dt * 0.65);
  const seen = new Set();

  for (const a of birds) {
    forEachBirdNearby(spatial, a, arena, minDist * 1.15, (b, dx, dy, d) => {
      if (a === b) return;
      const id = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (seen.has(id)) return;
      seen.add(id);

      let tdx = dx;
      let tdy = dy;
      let td = d;
      if (td < 0.001) {
        const angle = ((a.x + a.y) % 628) / 100;
        tdx = Math.cos(angle) * 0.01;
        tdy = Math.sin(angle) * 0.01;
        td = 0.01;
      }
      if (td >= minDist) return;

      const push = (minDist - td) * 0.5 * pushScale;
      const ux = tdx / td;
      const uy = tdy / td;
      a.x -= ux * push;
      a.y -= uy * push;
      b.x += ux * push;
      b.y += uy * push;

      // Damp relative velocity: stop approach + bleed tangential "orbit" slip.
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const radialRel = rvx * ux + rvy * uy;
      const slipScale = td < minDist * 0.85 ? 0.22 : 0.1;
      if (radialRel < 0) {
        a.vx += ux * radialRel * 0.35;
        a.vy += uy * radialRel * 0.35;
        b.vx -= ux * radialRel * 0.35;
        b.vy -= uy * radialRel * 0.35;
      }
      const tvx = rvx - ux * radialRel;
      const tvy = rvy - uy * radialRel;
      a.vx += tvx * slipScale;
      a.vy += tvy * slipScale;
      b.vx -= tvx * slipScale;
      b.vy -= tvy * slipScale;

      wrapBirdPosition(a, a.x, a.y, arena);
      wrapBirdPosition(b, b.x, b.y, arena);
    });
  }
}

/**
 * Demo flocks in open sky regions.
 * @param {import('../../../../js/world.js').World} world
 */
/** Default spawn anchors (up to 6 flocks). */
const DEMO_FLOCK_SPOTS = [
  (w, h) => ({ x: w * 0.28, y: h * 0.2 }),
  (w, h) => ({ x: w * 0.55, y: h * 0.16 }),
  (w, h) => ({ x: w * 0.42, y: h * 0.32 }),
  (w, h) => ({ x: w * 0.35, y: h * 0.45 }),
  (w, h) => ({ x: w * 0.62, y: h * 0.28 }),
  (w, h) => ({ x: w * 0.48, y: h * 0.38 }),
];

export function spawnDemoFlocks(world) {
  clearBirds(world);
  const w = world.width;
  const h = world.height;
  const flockCount = Math.max(1, Math.round(birdSimConfig.spawn.flockCount));
  const birdsPerFlock = Math.max(3, Math.round(birdSimConfig.spawn.birdsPerFlock));

  for (let i = 0; i < Math.min(flockCount, DEMO_FLOCK_SPOTS.length); i++) {
    const spot = DEMO_FLOCK_SPOTS[i](w, h);
    const open = findOpenAir(world, spot.x, spot.y);
    spawnFlock(world, open.x, open.y, birdsPerFlock);
  }
}
