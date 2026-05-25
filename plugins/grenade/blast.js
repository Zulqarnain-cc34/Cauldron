import { Species } from '../../js/catalog/species.js';

/** Pineapple grenade — fragmentation pattern (segments radiate outward). */
export const FRAG_COUNT = 14;
export const FRAG_SPEED = 2.2;
export const FRAG_LIFE = 8;

const BURNABLE = new Set([
  Species.ORGANIC,
  Species.WOOD,
  Species.OIL,
  Species.FUNGUS,
  Species.DUST,
  Species.SEED,
]);

const IMMUNE = new Set([Species.WALL, Species.STONE]);

/**
 * @param {import('../../js/world.js').World} world
 * @param {number} cx
 * @param {number} cy
 * @param {{ radius?: number, power?: number, fragments?: boolean }} [opts]
 */
export function applyGrenadeBlast(world, cx, cy, opts = {}) {
  const radius = opts.radius ?? 12;
  const power = opts.power ?? 1;
  const bound = Math.ceil(radius);

  for (let dy = -bound; dy <= bound; dy++) {
    for (let dx = -bound; dx <= bound; dx++) {
      const dist = Math.hypot(dx, dy);
      if (dist > radius + 0.5) continue;

      const x = cx + dx;
      const y = cy + dy;
      if (!world.inBounds(x, y)) continue;

      const cell = world.get(x, y);
      if (IMMUNE.has(cell.species)) continue;

      const t = 1 - dist / radius;
      const heat = Math.floor((60 + 200 * t) * power);

      if (t > 0.65) {
        world.set(x, y, {
          species: Species.FIRE,
          flags: 0,
          ra: Math.min(255, heat + world.randInt(25)),
          rb: 0,
        });
        continue;
      }

      if (BURNABLE.has(cell.species) || cell.species === Species.FIRE) {
        world.set(x, y, {
          species: Species.FIRE,
          flags: 0,
          ra: Math.min(255, heat),
          rb: 0,
        });
        continue;
      }

      if (t > 0.35 && cell.species === Species.EMPTY && world.randInt(100) < 45 * t * power) {
        world.set(x, y, {
          species: Species.GAS,
          flags: 0,
          ra: Math.floor(25 + 50 * t),
          rb: 0,
        });
        continue;
      }

      if (t > 0.2 && !IMMUNE.has(cell.species) && world.randInt(100) < 22 * t * power) {
        pushOutward(world, x, y, cx, cy);
      }
    }
  }

  if (opts.fragments !== false) {
    spawnFragments(world, cx, cy, power);
  }
}

/**
 * @param {import('../../js/world.js').World} world
 * @param {number} cx
 * @param {number} cy
 * @param {number} [power]
 */
export function spawnFragments(world, cx, cy, power = 1) {
  if (!world.plugin?.grenade) world.plugin = { ...world.plugin, grenade: {} };
  if (!world.plugin.grenade.fragments) world.plugin.grenade.fragments = [];

  for (let i = 0; i < FRAG_COUNT; i++) {
    const angle = (i / FRAG_COUNT) * Math.PI * 2 + world.rand() * 0.15;
    world.plugin.grenade.fragments.push({
      x: cx + 0.5,
      y: cy + 0.5,
      vx: Math.cos(angle) * FRAG_SPEED * power,
      vy: Math.sin(angle) * FRAG_SPEED * power - 0.4,
      life: FRAG_LIFE + world.randInt(4),
    });
  }
}

function pushOutward(world, x, y, cx, cy) {
  const ox = Math.sign(x - cx) || world.randDir() || 1;
  const oy = Math.sign(y - cy) || world.randDir() || 1;
  const tx = x + ox;
  const ty = y + oy;
  if (!world.inBounds(tx, ty)) return;

  const target = world.get(tx, ty);
  if (target.species !== Species.EMPTY) return;

  const cell = world.get(x, y);
  if (cell.species === Species.EMPTY || IMMUNE.has(cell.species)) return;

  world.set(tx, ty, cell);
  world.set(x, y, world.emptyCell());
}

/**
 * @param {import('../../js/world.js').World} world
 * @param {number} cx
 * @param {number} cy
 * @param {{ radius?: number, power?: number, fuse?: number, vx?: number, vy?: number }} [opts]
 */
export function queueGrenadeBlast(world, cx, cy, opts = {}) {
  if (!world.plugin) world.plugin = {};
  if (!world.plugin.grenade) world.plugin.grenade = {};
  if (!world.plugin.grenade.blastQueue) world.plugin.grenade.blastQueue = [];

  if (opts.fuse != null && opts.fuse > 0) {
    world.agents.push({
      type: 'grenade',
      x: cx + 0.5,
      y: cy + 0.5,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      fuse: opts.fuse,
      radius: opts.radius ?? 12,
      power: opts.power ?? 1,
    });
    return;
  }

  world.plugin.grenade.blastQueue.push({
    cx,
    cy,
    radius: opts.radius ?? 12,
    power: opts.power ?? 1,
    fragments: opts.fragments,
  });
}

/** @param {import('../../js/world.js').World} world */
export function drainGrenadeBlastQueue(world) {
  const queue = world.plugin?.grenade?.blastQueue;
  if (!queue?.length) return;

  for (const blast of queue) {
    applyGrenadeBlast(world, blast.cx, blast.cy, {
      radius: blast.radius,
      power: blast.power,
      fragments: blast.fragments,
    });
  }
  queue.length = 0;
}

function cellBlocksGrenade(cell) {
  return (
    cell.species !== Species.EMPTY &&
    cell.species !== Species.GAS &&
    cell.species !== Species.STEAM &&
    cell.species !== Species.FIRE
  );
}

/** @param {import('../../js/world.js').World} world */
export function tickGrenadeAgents(world) {
  tickFragments(world);

  for (let i = world.agents.length - 1; i >= 0; i--) {
    const agent = world.agents[i];
    if (agent.type !== 'grenade') continue;

    agent.vy += 0.18;
    agent.x += agent.vx;
    agent.y += agent.vy;

    const gx = Math.floor(agent.x);
    const gy = Math.floor(agent.y);
    let detonate = false;

    if (!world.inBounds(gx, gy)) {
      detonate = true;
    } else {
      const below = world.inBounds(gx, gy + 1) ? world.get(gx, gy + 1) : null;
      const here = world.get(gx, gy);
      if (cellBlocksGrenade(here) || (below && cellBlocksGrenade(below) && agent.vy > 0)) {
        detonate = true;
      }
    }

    agent.fuse -= 1;
    if (agent.fuse <= 0) detonate = true;

    if (detonate) {
      queueGrenadeBlast(world, gx, gy, {
        radius: agent.radius,
        power: agent.power,
      });
      world.agents.splice(i, 1);
    }
  }
}

/** @param {import('../../js/world.js').World} world */
function tickFragments(world) {
  const frags = world.plugin?.grenade?.fragments;
  if (!frags?.length) return;

  for (let i = frags.length - 1; i >= 0; i--) {
    const f = frags[i];
    f.vy += 0.12;
    f.x += f.vx;
    f.y += f.vy;
    f.life -= 1;

    const gx = Math.floor(f.x);
    const gy = Math.floor(f.y);

    if (world.inBounds(gx, gy)) {
      const cell = world.get(gx, gy);
      if (!IMMUNE.has(cell.species)) {
        if (cell.species === Species.EMPTY) {
          world.set(gx, gy, {
            species: Species.STONE,
            flags: 0,
            ra: 180 + world.randInt(40),
            rb: 0,
          });
        } else if (BURNABLE.has(cell.species) || cell.species === Species.SAND) {
          world.set(gx, gy, {
            species: Species.FIRE,
            flags: 0,
            ra: 100 + world.randInt(50),
            rb: 0,
          });
        }
      }
      if (cellBlocksGrenade(cell)) {
        f.vx *= -0.3;
        f.vy *= -0.3;
      }
    }

    if (f.life <= 0 || !world.inBounds(gx, gy)) {
      frags.splice(i, 1);
    }
  }
}

/**
 * Throw a grenade from origin toward target with arc.
 * @param {import('../../js/world.js').World} world
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 */
export function throwGrenade(world, fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = Math.min(6, 2.5 + dist * 0.04);

  queueGrenadeBlast(world, fromX, fromY, {
    fuse: 55,
    radius: 12,
    power: 1,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed - 2.2,
  });
}
