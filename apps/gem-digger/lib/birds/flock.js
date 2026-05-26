/**
 * Boids flocking — forward vision, separation away from neighbours, heading alignment.
 * Toroidal X + sky-band Y — see boundaries.js.
 */

import { birdSimConfig } from './config.js';
import { toroidalDelta, toroidalVectorTo } from './boundaries.js';
import { forEachBirdNearby } from './spatial.js';
import { windSteer } from './wind.js';

/** @typedef {import('./birds.js').Bird} Bird */
/** @typedef {import('./boundaries.js').SkyArena} SkyArena */
/** @typedef {ReturnType<import('./spatial.js').buildBirdSpatialIndex>} BirdSpatialIndex */

/** @typedef {{ other: Bird, dx: number, dy: number, d: number }} NeighborSlot */

const MAX_NEIGHBORS = 96;
/** @type {NeighborSlot[]} */
const neighborSlots = [];
for (let i = 0; i < MAX_NEIGHBORS; i++) {
  neighborSlots.push({ other: null, dx: 0, dy: 0, d: 0 });
}

let flockTick = {
  queryR: 50,
  queryR2: 2500,
  sepR2: 784,
  aliR2: 784,
  cohR2: 784,
  perception: 50,
  separationRadius: 28,
  alignmentRadius: 28,
  cohesionRadius: 28,
  closeDist: 12.6,
  minSocialDist: 15.4,
  crowdedDist: 14,
  overlapMinDist: 8.96,
  interactionMode: 'metric',
  topologicalK: 7,
  weightSep: 3.2,
  weightAli: 0.35,
  weightCoh: 0,
  cohesionSpeed: 0.18,
  cohesionNeighbors: 5,
  visionFovDeg: 110,
  cosHalfFov: 0.5,
  wanderWeight: 0.08,
  minFlockSize: 2,
  perBirdSepCap: 1,
  totalSepCap: 1,
};

function refreshFlockTick(maxForce) {
  const f = birdSimConfig.flock;
  const sepR = f.separationRadius;
  const aliR = f.alignmentRadius ?? f.perception;
  const cohR = f.cohesionRadius ?? f.perception;
  const socialR = Math.max(aliR, cohR, f.perception);
  const queryR =
    f.interactionMode === 'metric'
      ? Math.max(sepR, socialR)
      : Math.max(sepR, aliR, cohR, f.topologicalNeighbors * 8, 40);

  flockTick.queryR = queryR;
  flockTick.queryR2 = queryR * queryR;
  flockTick.sepR2 = sepR * sepR;
  flockTick.aliR2 = aliR * aliR;
  flockTick.cohR2 = cohR * cohR;
  flockTick.perception = f.perception;
  flockTick.separationRadius = sepR;
  flockTick.alignmentRadius = aliR;
  flockTick.cohesionRadius = cohR;
  flockTick.closeDist = sepR * 0.45;
  flockTick.minSocialDist = sepR * 0.55;
  flockTick.crowdedDist = sepR * 0.5;
  flockTick.overlapMinDist = sepR * 0.32;
  flockTick.interactionMode = f.interactionMode;
  flockTick.topologicalK = Math.max(1, Math.round(f.topologicalNeighbors));
  flockTick.weightSep = f.weightSep;
  flockTick.weightAli = f.weightAli;
  flockTick.weightCoh = f.weightCoh;
  flockTick.cohesionSpeed = f.cohesionSpeed;
  flockTick.cohesionNeighbors = Math.max(2, Math.round(f.cohesionNeighbors ?? f.topologicalNeighbors));
  flockTick.wanderWeight = f.wanderWeight ?? 0;
  flockTick.visionFovDeg = f.visionFovDeg ?? 0;
  const fovRad = (flockTick.visionFovDeg * Math.PI) / 180;
  flockTick.cosHalfFov = flockTick.visionFovDeg > 0 ? Math.cos(fovRad * 0.5) : -1;
  flockTick.minFlockSize = f.minFlockSize;
  flockTick.perBirdSepCap = maxForce * f.weightSep * 1.15;
  flockTick.totalSepCap = maxForce * f.weightSep * 4.5;
}

function clampMag(x, y, max) {
  const m = Math.hypot(x, y);
  if (m <= max || m === 0) return [x, y];
  const s = max / m;
  return [x * s, y * s];
}

function steerFrom(bird, tx, ty, maxForce) {
  return clampMag(tx - bird.vx, ty - bird.vy, maxForce);
}

function birdForward(bird) {
  const m2 = bird.vx * bird.vx + bird.vy * bird.vy;
  if (m2 > 0.01) {
    const inv = 1 / Math.sqrt(m2);
    return [bird.vx * inv, bird.vy * inv];
  }
  return [Math.cos(bird.angle), Math.sin(bird.angle)];
}

/** dx,dy = bird → other; true if other is in forward cone. */
function neighborInVision(fwdX, fwdY, dx, dy, cosHalfFov) {
  if (cosHalfFov < -0.5) return true;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1e-6) return true;
  return (fwdX * dx + fwdY * dy) / Math.sqrt(d2) >= cosHalfFov;
}

function pushNearest(n, other, dx, dy, d, k) {
  if (n < k) {
    const slot = neighborSlots[n];
    slot.other = other;
    slot.dx = dx;
    slot.dy = dy;
    slot.d = d;
    return n + 1;
  }
  let worst = 0;
  for (let i = 1; i < k; i++) {
    if (neighborSlots[i].d > neighborSlots[worst].d) worst = i;
  }
  if (d < neighborSlots[worst].d) {
    const slot = neighborSlots[worst];
    slot.other = other;
    slot.dx = dx;
    slot.dy = dy;
    slot.d = d;
  }
  return n;
}

function swapNeighborSlot(i, j) {
  const a = neighborSlots[i];
  const b = neighborSlots[j];
  const o = a.other;
  const dx = a.dx;
  const dy = a.dy;
  const d = a.d;
  a.other = b.other;
  a.dx = b.dx;
  a.dy = b.dy;
  a.d = b.d;
  b.other = o;
  b.dx = dx;
  b.dy = dy;
  b.d = d;
}

function selectNearestSlots(count, k) {
  const n = Math.min(k, count);
  for (let i = 0; i < n; i++) {
    let best = i;
    for (let j = i + 1; j < count; j++) {
      if (neighborSlots[j].d < neighborSlots[best].d) best = j;
    }
    if (best !== i) swapNeighborSlot(i, best);
  }
  return n;
}

/** Gentle wander so motion isn't perfectly lock-step. */
function wanderAccel(bird, tick, maxForce) {
  const w = flockTick.wanderWeight;
  if (w <= 0) return [0, 0];
  let h = 0;
  for (let i = 0; i < bird.id.length; i++) h = (h * 31 + bird.id.charCodeAt(i)) | 0;
  const t = tick * 0.11 + (h % 628) / 100;
  const mag = maxForce * w;
  return [Math.cos(t * 1.17) * mag, Math.sin(t * 0.93) * mag];
}

/**
 * @returns {{ sepAx: number, sepAy: number, ax: number, ay: number, crowded: boolean, neighborCount: number }}
 */
export function computeBirdForces(bird, spatial, arena, maxForce, maxSpeed, tick) {
  refreshFlockTick(maxForce);
  const ft = flockTick;

  let sepAx = 0;
  let sepAy = 0;
  let closeCount = 0;
  let distSum = 0;
  let distN = 0;
  let neighborCount = 0;

  const isTopo = ft.interactionMode === 'topological';
  const isMetric = ft.interactionMode === 'metric';
  const invSepR = 1 / ft.separationRadius;
  const [fwdX, fwdY] = birdForward(bird);
  const cosFov = ft.cosHalfFov;

  forEachBirdNearby(spatial, bird, arena, ft.queryR, (other, dx, dy, d2) => {
    const d = Math.sqrt(d2);

    // dx,dy = bird → other; repulsion = away from other = −(dx,dy)
    if (d2 <= ft.sepR2) {
      if (d < ft.closeDist) closeCount++;

      if (d < 0.001) {
        const a = ((bird.x + bird.y * 3 + other.x) % 628) / 100;
        sepAx -= Math.cos(a) * ft.perBirdSepCap;
        sepAy -= Math.sin(a) * ft.perBirdSepCap;
      } else {
        const strength =
          ((ft.separationRadius - d) * invSepR) / Math.max(d, 0.4) + 0.15;
        const f = Math.min(ft.perBirdSepCap, strength * maxForce * ft.weightSep * 0.6);
        const invD = f / d;
        sepAx -= dx * invD;
        sepAy -= dy * invD;
      }
    }

    if (!neighborInVision(fwdX, fwdY, dx, dy, cosFov)) return;

    distSum += d;
    distN++;

    if (isMetric && d > Math.max(ft.alignmentRadius, ft.cohesionRadius, ft.perception)) return;
    if (isTopo) {
      neighborCount = pushNearest(neighborCount, other, dx, dy, d, ft.topologicalK);
    } else if (neighborCount < MAX_NEIGHBORS) {
      const slot = neighborSlots[neighborCount++];
      slot.other = other;
      slot.dx = dx;
      slot.dy = dy;
      slot.d = d;
    }
  });

  if (isTopo && neighborCount > 1) {
    for (let i = 1; i < neighborCount; i++) {
      const slot = neighborSlots[i];
      let j = i;
      while (j > 0 && neighborSlots[j - 1].d > slot.d) {
        neighborSlots[j] = neighborSlots[j - 1];
        j--;
      }
      neighborSlots[j] = slot;
    }
    if (neighborCount > ft.topologicalK) neighborCount = ft.topologicalK;
  }

  const avgDist = distN > 0 ? distSum / distN : Infinity;
  const crowded = closeCount >= 2 || avgDist < ft.crowdedDist;

  let sepOutX;
  let sepOutY;
  if (sepAx !== 0 || sepAy !== 0) {
    [sepOutX, sepOutY] = clampMag(sepAx, sepAy, ft.totalSepCap);
  } else {
    sepOutX = 0;
    sepOutY = 0;
  }

  let flockAx = 0;
  let flockAy = 0;

  if (!crowded && neighborCount >= ft.minFlockSize) {
    let headX = 0;
    let headY = 0;
    let headW = 0;
    const minSd = ft.minSocialDist;
    const cruise = maxSpeed * 0.82;

    for (let i = 0; i < neighborCount; i++) {
      const n = neighborSlots[i];
      if (n.d > ft.alignmentRadius) continue;
      if (n.d < minSd) continue;
      const focus = (fwdX * n.dx + fwdY * n.dy) / Math.max(n.d, 0.001);
      if (focus <= 0.05) continue;

      const om = Math.hypot(n.other.vx, n.other.vy);
      if (om > 0.02) {
        headX += (n.other.vx / om) * focus;
        headY += (n.other.vy / om) * focus;
        headW += focus;
      }
    }

    let fx = 0;
    let fy = 0;

    if (ft.weightAli > 0.001 && headW > 0) {
      const inv = 1 / headW;
      const hx = headX * inv;
      const hy = headY * inv;
      const hm = Math.hypot(hx, hy) || 1;
      const [alx, aly] = steerFrom(
        bird,
        (hx / hm) * cruise,
        (hy / hm) * cruise,
        maxForce * ft.weightAli
      );
      fx += alx;
      fy += aly;
    }

    // Optional cohesion: only pull toward birds ahead when you're far (not a ring centroid).
    if (ft.weightCoh > 0.001 && ft.cohesionSpeed > 0.001) {
      const cohPick = selectNearestSlots(neighborCount, ft.cohesionNeighbors);
      let cohDx = 0;
      let cohDy = 0;
      let cohW = 0;
      for (let i = 0; i < cohPick; i++) {
        const n = neighborSlots[i];
        if (n.d > ft.cohesionRadius) continue;
        const focus = (fwdX * n.dx + fwdY * n.dy) / Math.max(n.d, 0.001);
        if (focus < 0.5 || n.d < ft.separationRadius * 0.65) continue;
        cohDx += n.dx * focus;
        cohDy += n.dy * focus;
        cohW += focus;
      }
      if (cohW > 0) {
        const inv = 1 / cohW;
        const targetX = bird.x + cohDx * inv;
        const targetY = bird.y + cohDy * inv;
        const [tdx, tdy] = toroidalVectorTo(bird.x, bird.y, targetX, targetY, arena);
        const td = Math.hypot(tdx, tdy);
        const gap = ft.separationRadius * 1.6;
        const pull = Math.min(1, Math.max(0, (td - gap) / gap));
        if (td > gap && pull > 0.05) {
          const cohSp = maxSpeed * ft.cohesionSpeed * pull;
          const [cx, cy] = steerFrom(
            bird,
            (tdx / td) * cohSp,
            (tdy / td) * cohSp,
            maxForce * ft.weightCoh
          );
          fx += cx;
          fy += cy;
        }
      }
    }

    if (fx !== 0 || fy !== 0) {
      let centX = 0;
      let centY = 0;
      let centW = 0;
      for (let i = 0; i < neighborCount; i++) {
        const n = neighborSlots[i];
        centX += n.dx;
        centY += n.dy;
        centW += 1;
      }
      if (centW > 0) {
        const inv = 1 / centW;
        const ux = centX * inv;
        const uy = centY * inv;
        const um = Math.hypot(ux, uy) || 1;
        const radialV = (bird.vx * ux + bird.vy * uy) / um;
        if (radialV > 0) {
          fx -= (ux / um) * radialV * 0.85;
          fy -= (uy / um) * radialV * 0.85;
        }
      }
      [flockAx, flockAy] = clampMag(fx, fy, maxForce * 0.85);
    }
  }

  const [wanx, wany] = wanderAccel(bird, tick, maxForce);
  const [wx, wy] = windSteer(bird, tick, maxSpeed, maxForce, arena);

  let extraAx = flockAx + wanx;
  let extraAy = flockAy + wany;
  if (!crowded) {
    extraAx += wx;
    extraAy += wy;
  } else {
    extraAx += wx * 0.35;
    extraAy += wy * 0.35;
  }

  return {
    sepAx: sepOutX,
    sepAy: sepOutY,
    ax: sepOutX + extraAx,
    ay: sepOutY + extraAy,
    crowded,
    neighborCount,
  };
}

export function computeLocalFlockData(bird, spatial, arena, maxForce) {
  refreshFlockTick(maxForce);
  const ft = flockTick;
  let neighborCount = 0;
  let closeCount = 0;
  let distSum = 0;
  let distN = 0;
  let sepAx = 0;
  let sepAy = 0;
  const isTopo = ft.interactionMode === 'topological';
  const isMetric = ft.interactionMode === 'metric';
  const invSepR = 1 / ft.separationRadius;
  const [fwdX, fwdY] = birdForward(bird);
  const cosFov = ft.cosHalfFov;

  forEachBirdNearby(spatial, bird, arena, ft.queryR, (other, dx, dy, d2) => {
    const d = Math.sqrt(d2);
    if (d2 <= ft.sepR2) {
      if (d < ft.closeDist) closeCount++;
      if (d < 0.001) {
        const a = ((bird.x + bird.y * 3 + other.x) % 628) / 100;
        sepAx -= Math.cos(a) * ft.perBirdSepCap;
        sepAy -= Math.sin(a) * ft.perBirdSepCap;
      } else {
        const strength =
          ((ft.separationRadius - d) * invSepR) / Math.max(d, 0.4) + 0.15;
        const f = Math.min(ft.perBirdSepCap, strength * maxForce * ft.weightSep * 0.6);
        sepAx -= (dx / d) * f;
        sepAy -= (dy / d) * f;
      }
    }
    if (!neighborInVision(fwdX, fwdY, dx, dy, cosFov)) return;
    distSum += d;
    distN++;
    if (isMetric && d > Math.max(ft.alignmentRadius, ft.cohesionRadius, ft.perception)) return;
    if (isTopo) {
      neighborCount = pushNearest(neighborCount, other, dx, dy, d, ft.topologicalK);
    } else if (neighborCount < MAX_NEIGHBORS) {
      const slot = neighborSlots[neighborCount++];
      slot.other = other;
      slot.dx = dx;
      slot.dy = dy;
      slot.d = d;
    }
  });

  if (isTopo && neighborCount > 1) {
    for (let i = 1; i < neighborCount; i++) {
      const slot = neighborSlots[i];
      let j = i;
      while (j > 0 && neighborSlots[j - 1].d > slot.d) {
        neighborSlots[j] = neighborSlots[j - 1];
        j--;
      }
      neighborSlots[j] = slot;
    }
    if (neighborCount > ft.topologicalK) neighborCount = ft.topologicalK;
  }

  const avgDist = distN > 0 ? distSum / distN : Infinity;
  const crowded = closeCount >= 2 || avgDist < ft.crowdedDist;
  const neighbors = [];
  for (let i = 0; i < neighborCount; i++) neighbors.push(neighborSlots[i].other);
  [sepAx, sepAy] = clampMag(sepAx, sepAy, ft.totalSepCap);

  return { neighbors, sepAx, sepAy, crowded, avgDist, closeCount };
}

export function getFlockNeighbors(bird, flockmates, arena) {
  const { interactionMode, perception, alignmentRadius, topologicalNeighbors } =
    birdSimConfig.flock;
  const socialR = alignmentRadius ?? perception;
  const candidates = [];

  for (const other of flockmates) {
    if (other === bird) continue;
    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
    const d = Math.hypot(dx, dy);
    if (interactionMode === 'metric' && d > socialR) continue;
    candidates.push({ other, d });
  }

  if (interactionMode === 'topological') {
    candidates.sort((a, b) => a.d - b.d);
    const k = Math.max(1, Math.round(topologicalNeighbors));
    return candidates.slice(0, k).map((c) => c.other);
  }

  return candidates.map((c) => c.other);
}

export function computeFlockAcceleration(bird, neighbors, maxSpeed, maxForce, arena, opts = {}) {
  const { minFlockSize, weightAli, separationRadius } = birdSimConfig.flock;
  if (neighbors.length < minFlockSize) return [0, 0];
  if (opts.crowded || (opts.avgDist ?? Infinity) < separationRadius * 0.65) return [0, 0];

  const [fwdX, fwdY] = birdForward(bird);
  let headX = 0;
  let headY = 0;
  let headW = 0;
  const cruise = maxSpeed * 0.82;

  for (const other of neighbors) {
    const [dx, dy] = toroidalDelta(bird.x, bird.y, other.x, other.y, arena);
    const d = Math.hypot(dx, dy);
    if (d < separationRadius * 0.55) continue;
    const focus = (fwdX * -dx + fwdY * -dy) / Math.max(d, 0.001);
    if (focus <= 0.05) continue;
    const om = Math.hypot(other.vx, other.vy);
    if (om > 0.02) {
      headX += (other.vx / om) * focus;
      headY += (other.vy / om) * focus;
      headW += focus;
    }
  }

  if (headW <= 0 || weightAli <= 0) return [0, 0];
  const inv = 1 / headW;
  const hx = headX * inv;
  const hy = headY * inv;
  const hm = Math.hypot(hx, hy) || 1;
  return steerFrom(bird, (hx / hm) * cruise, (hy / hm) * cruise, maxForce * weightAli);
}

export function withinPerception(a, b, arena) {
  return getFlockNeighbors(a, [b], arena).length > 0;
}

export function getFlockMinSize() {
  return birdSimConfig.flock.minFlockSize;
}

export function computeVicsekOrder(birds) {
  if (!birds.length) return 0;
  let sumVx = 0;
  let sumVy = 0;
  for (const b of birds) {
    const m = Math.hypot(b.vx, b.vy);
    if (m < 0.001) continue;
    sumVx += b.vx / m;
    sumVy += b.vy / m;
  }
  return Math.min(1, Math.hypot(sumVx, sumVy) / birds.length);
}
