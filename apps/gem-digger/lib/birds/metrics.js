/**
 * Flocking + wind health metrics (for tuning & detecting glitches).
 *
 * Standard boids observables:
 * - Polarization: |Σv| / Σ|v| (alignment order parameter, 0–1)
 * - Mean nearest-neighbor distance (density)
 * - Centroid spread (cohesion tightness)
 * - Wind coupling: mean cosine alignment with local flow
 */

import { birdSimConfig } from './config.js';
import { getBirdDef } from './catalog.js';
import { getSkyArena, toroidalVectorTo } from './boundaries.js';
import { flowVelocity } from './wind.js';
import { computeVicsekOrder, getFlockNeighbors } from './flock.js';

/** @typedef {import('./birds.js').Bird} Bird */

/** @typedef {object} BirdMetricsSnapshot
 * @property {number} frame
 * @property {number} birdCount
 * @property {number} polarization Vicsek φ (order parameter)
 * @property {string} interactionMode
 * @property {number} meanInteractionDist Rm (mean dist to interaction neighbours)
 * @property {number} avgInteractionCount
 * @property {number} cohesionSpread
 * @property {number} meanNeighborDist
 * @property {number} windAlignment
 * @property {number} flockParticipation
 * @property {number} separationViolations
 * @property {number} meanSpeed
 * @property {number} speedVariance
 * @property {number} glitchRate
 * @property {number} stuckRate
 * @property {string} verdict
 * @property {string} hint
 * @property {number} separationScore 0–1 (low overlap = good)
 * @property {number} alignmentScore 0–1 (φ with enough neighbours)
 * @property {number} cohesionScore 0–1 (grouped but not crushed)
 * @property {number} flockEmergence 0–1 composite boids health
 */

/** @type {Map<string, { x: number, y: number, vx: number, vy: number }>} */
const prevFrame = new Map();

/** @type {BirdMetricsSnapshot | null} */
let latest = null;

/** @type {number[]} */
const historyWind = [];
/** @type {number[]} */
const historyPolar = [];
/** @type {number[]} */
const historyGlitch = [];
const HISTORY_LEN = 48;

function pushHistory(arr, value) {
  arr.push(value);
  if (arr.length > HISTORY_LEN) arr.shift();
}

/**
 * @param {Bird[]} birds
 * @param {import('../../../../js/world.js').World} world
 */
export function sampleBirdMetrics(world, birds) {
  if (!birdSimConfig.display.showDiagnostics || !birds.length) {
    latest = null;
    return null;
  }

  const arena = getSkyArena(world);
  const def = getBirdDef();
  const personalSpace = birdSimConfig.flock.personalSpace;
  const minFlock = birdSimConfig.flock.minFlockSize;
  const simSpeed = birdSimConfig.motion.simSpeed;

  let sumVx = 0;
  let sumVy = 0;
  let sumSpeed = 0;
  let sumSpeedSq = 0;
  let windCos = 0;
  let nnDistSum = 0;
  let nnCount = 0;
  let cohesionSum = 0;
  let cohesionN = 0;
  let participating = 0;
  let violations = 0;
  let glitches = 0;
  let stuck = 0;
  let interactionDistSum = 0;
  let interactionDistN = 0;
  let interactionCountSum = 0;

  for (const bird of birds) {
    const flockmates = birds;
    const sp = Math.hypot(bird.vx, bird.vy);

    sumVx += bird.vx;
    sumVy += bird.vy;
    sumSpeed += sp;
    sumSpeedSq += sp * sp;

    const [fvx, fvy] = flowVelocity(bird.x, bird.y, world.tick, def.maxSpeed, arena);
    const fm = Math.hypot(fvx, fvy) || 1;
    const bm = sp || 0.001;
    windCos += (bird.vx * fvx) / (bm * fm) + (bird.vy * fvy) / (bm * fm);

    const interactNeighbors = getFlockNeighbors(bird, flockmates, arena);
    interactionCountSum += interactNeighbors.length;

    let nearest = Infinity;
    for (const other of flockmates) {
      if (other === bird) continue;
      const [dx, dy] = toroidalVectorTo(bird.x, bird.y, other.x, other.y, arena);
      const d = Math.hypot(dx, dy);
      if (d < nearest) nearest = d;
      if (d < personalSpace) violations++;
    }

    for (const other of interactNeighbors) {
      const [dx, dy] = toroidalVectorTo(bird.x, bird.y, other.x, other.y, arena);
      interactionDistSum += Math.hypot(dx, dy);
      interactionDistN++;
    }

    if (nearest < Infinity) {
      nnDistSum += nearest;
      nnCount++;
    }
    if (interactNeighbors.length >= minFlock) participating++;

    if (flockmates.length > 1) {
      let cx = 0;
      let cy = 0;
      for (const o of flockmates) {
        const [tx, ty] = toroidalVectorTo(bird.x, bird.y, o.x, o.y, arena);
        cx += tx;
        cy += ty;
      }
      cohesionSum += Math.hypot(cx / flockmates.length, cy / flockmates.length);
      cohesionN++;
    }

    const prev = prevFrame.get(bird.id);
    if (prev) {
      const [sx, sy] = toroidalVectorTo(prev.x, prev.y, bird.x, bird.y, arena);
      const step = Math.hypot(sx, sy);
      const substeps = Math.max(1, Math.ceil(simSpeed / 0.35));
      const dt = simSpeed / substeps;
      const maxStep = def.maxSpeed * dt * 2.5;
      const wrapped = step > arena.worldW * 0.32 || step > arena.skyH * 0.32;
      if (!wrapped && step > maxStep) glitches++;

      const dv = Math.hypot(bird.vx - prev.vx, bird.vy - prev.vy);
      if (dv > def.maxSpeed * (1.8 + dt * 1.2)) glitches++;

      if (sp < def.maxSpeed * 0.06) stuck++;
    }

    prevFrame.set(bird.id, { x: bird.x, y: bird.y, vx: bird.vx, vy: bird.vy });
  }

  const n = birds.length;
  const polarization = computeVicsekOrder(birds);
  const meanInteractionDist =
    interactionDistN > 0 ? interactionDistSum / interactionDistN : 0;
  const avgInteractionCount = interactionCountSum / n;
  const meanSpeed = sumSpeed / n;
  const speedVariance = Math.max(0, sumSpeedSq / n - meanSpeed * meanSpeed);
  const windAlignment = Math.max(-1, Math.min(1, windCos / n));
  const meanNeighborDist = nnCount ? nnDistSum / nnCount : 0;
  const cohesionSpread = cohesionN ? cohesionSum / cohesionN : 0;
  const flockParticipation = participating / n;
  const separationViolations = violations / Math.max(1, n);
  const glitchRate = glitches / n;
  const stuckRate = stuck / n;

  const { separationScore, alignmentScore, cohesionScore, flockEmergence } =
    computeBehaviorScores({
      polarization,
      flockParticipation,
      separationViolations,
      cohesionSpread,
      meanNeighborDist,
      personalSpace,
      perception: birdSimConfig.flock.perception,
      minFlock,
    });

  const { verdict, hint } = interpretMetrics({
    interactionMode: birdSimConfig.flock.interactionMode,
    topologicalNeighbors: birdSimConfig.flock.topologicalNeighbors,
    perception: birdSimConfig.flock.perception,
    polarization,
    meanInteractionDist,
    windAlignment,
    cohesionSpread,
    meanNeighborDist,
    flockParticipation,
    separationViolations,
    glitchRate,
    stuckRate,
    personalSpace,
    simSpeed,
    windEnabled: birdSimConfig.wind.enabled,
    separationScore,
    alignmentScore,
    cohesionScore,
    flockEmergence,
  });

  const snap = {
    frame: world.tick,
    birdCount: n,
    interactionMode: birdSimConfig.flock.interactionMode,
    polarization,
    meanInteractionDist,
    avgInteractionCount,
    cohesionSpread,
    meanNeighborDist,
    windAlignment,
    flockParticipation,
    separationViolations,
    meanSpeed,
    speedVariance,
    glitchRate,
    stuckRate,
    separationScore,
    alignmentScore,
    cohesionScore,
    flockEmergence,
    verdict,
    hint,
  };

  latest = snap;

  pushHistory(historyPolar, polarization);
  pushHistory(historyWind, windAlignment);
  pushHistory(historyGlitch, glitchRate);

  return snap;
}

/**
 * Automatic emergence scores for the three boids rules (0 = absent, 1 = strong).
 * @param {object} p
 */
function computeBehaviorScores(p) {
  const {
    polarization,
    flockParticipation,
    separationViolations,
    cohesionSpread,
    meanNeighborDist,
    personalSpace,
    perception,
    minFlock,
  } = p;

  const separationScore = Math.max(0, Math.min(1, 1 - separationViolations * 2.5));

  const alignmentScore = Math.max(
    0,
    Math.min(1, polarization * Math.min(1, flockParticipation / 0.45))
  );

  const idealSpread = personalSpace * 3.2;
  const maxSpread = Math.max(idealSpread * 2, perception * 0.55);
  let cohesionScore = 0;
  if (cohesionSpread > 0 && flockParticipation >= minFlock / 8) {
    if (cohesionSpread < idealSpread) {
      cohesionScore = cohesionSpread / idealSpread;
    } else if (cohesionSpread <= maxSpread) {
      cohesionScore = 1 - (cohesionSpread - idealSpread) / (maxSpread - idealSpread);
    } else {
      cohesionScore = Math.max(0, 0.35 - (cohesionSpread - maxSpread) / maxSpread);
    }
    cohesionScore = Math.max(0, Math.min(1, cohesionScore));
    if (meanNeighborDist > personalSpace * 5) cohesionScore *= 0.7;
  }

  const flockEmergence =
    separationScore * 0.3 + alignmentScore * 0.4 + cohesionScore * 0.3;

  return { separationScore, alignmentScore, cohesionScore, flockEmergence };
}

/**
 * @param {object} m
 */
function interpretMetrics(m) {
  const {
    polarization,
    windAlignment,
    cohesionSpread,
    meanNeighborDist,
    flockParticipation,
    separationViolations,
    glitchRate,
    stuckRate,
    personalSpace,
    simSpeed,
  } = m;

  if (glitchRate > 0.12 || (simSpeed > 12 && glitchRate > 0.06)) {
    return {
      verdict: 'Unstable',
      hint: 'Glitches detected — try Calm wind preset or lower sim speed slightly.',
    };
  }

  if (stuckRate > 0.2) {
    return {
      verdict: 'Stuck birds',
      hint: 'Many birds barely moving — check terrain collision or min speed / wind floor.',
    };
  }

  if (separationViolations > 0.35) {
    return {
      verdict: 'Crowded',
      hint: 'Too many birds inside personal space — increase separation weight or personal space.',
    };
  }

  if (windAlignment > 0.72 && polarization > 0.45) {
    return {
      verdict: 'Wind-driven flock',
      hint: 'Birds follow Perlin flow and move together. Good for turbulent-field demos.',
    };
  }

  if (windAlignment > 0.8 && polarization < 0.35) {
    return {
      verdict: 'Wind only',
      hint: 'Strong wind, weak flocking — raise cohesion/alignment or lower wind steer.',
    };
  }

  if (m.flockEmergence >= 0.62 && m.separationScore >= 0.55 && m.alignmentScore >= 0.5) {
    const parts = [];
    if (m.separationScore >= 0.7) parts.push('separation');
    if (m.alignmentScore >= 0.55) parts.push('alignment');
    if (m.cohesionScore >= 0.5) parts.push('cohesion');
    return {
      verdict: 'Flocking emerged',
      hint: `Boids rules active: ${parts.join(', ') || 'all three'}. φ=${(polarization * 100).toFixed(0)}% composite=${(m.flockEmergence * 100).toFixed(0)}%.`,
    };
  }

  if (polarization > 0.6 && flockParticipation > 0.5 && meanNeighborDist < personalSpace * 4) {
    return {
      verdict: 'Healthy flock',
      hint: 'Alignment + grouping look good. Tweak cohesion spread if flocks feel too tight/loose.',
    };
  }

  if (!m.windEnabled && m.flockEmergence < 0.35) {
    return {
      verdict: 'Flock not forming',
      hint: 'Wind off — raise alignment/cohesion, lower separation, or spawn more birds.',
    };
  }

  if (polarization < 0.25 || flockParticipation < 0.25) {
    const modeHint =
      m.interactionMode === 'topological'
        ? `Try topological neighbours ≥7 (now ${m.topologicalNeighbors}), or lower sim speed.`
        : 'Raise perception radius, cohesion, alignment; or lower wind.';
    return {
      verdict: 'Scattered',
      hint: `Weak order (φ low). ${modeHint}`,
    };
  }

  if (polarization >= 0.75) {
    return {
      verdict: 'High Vicsek order',
      hint: `φ=${(polarization * 100).toFixed(0)}% — strong alignment. Wind lowers φ when several flocks face different flow.`,
    };
  }

  if (polarization > 0.65 && m.interactionMode === 'topological') {
    return {
      verdict: 'Ordered flock (φ high)',
      hint: `Topological k=${m.topologicalNeighbors} — matches field studies (~7 neighbours).`,
    };
  }

  if (cohesionSpread > personalSpace * 6) {
    return {
      verdict: 'Loose swarm',
      hint: 'Wide spread around centroids — increase cohesion or lower separation.',
    };
  }

  return {
    verdict: 'Mixed',
    hint: 'Adjust one slider at a time and watch polarization vs wind alignment.',
  };
}

export function getBirdMetricsSnapshot() {
  return latest;
}

export function getBirdMetricsHistory() {
  return {
    polarization: [...historyPolar],
    windAlignment: [...historyWind],
    glitchRate: [...historyGlitch],
  };
}

export function resetBirdMetrics() {
  prevFrame.clear();
  latest = null;
  historyPolar.length = 0;
  historyWind.length = 0;
  historyGlitch.length = 0;
}

/**
 * @param {number} value 0–1
 * @param {number} width
 */
export function sparklineAscii(values, width = 16) {
  if (!values.length) return '—';
  const blocks = '▁▂▃▄▅▆▇█';
  const step = Math.max(1, values.length / width);
  let out = '';
  for (let i = 0; i < width; i++) {
    const idx = Math.min(values.length - 1, Math.floor(i * step));
    const v = Math.max(0, Math.min(1, values[idx]));
    out += blocks[Math.floor(v * (blocks.length - 1))];
  }
  return out;
}
