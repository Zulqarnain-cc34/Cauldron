/**
 * Search flock params for stable Vicsek φ ≥ 0.75 (headless).
 */
import { World, GRID_W, GRID_H } from '../../js/world.js';
import { bootstrapSandbox } from '../../apps/gem-digger/lib/content/maps/sandbox.js';
import {
  clearBirds,
  spawnFlock,
  spawnDemoFlocks,
  tickBirds,
  ensureBirds,
} from '../../apps/gem-digger/lib/birds/birds.js';
import { birdSimConfig, applyBirdSimPreset } from '../../apps/gem-digger/lib/birds/config.js';
import { computeVicsekOrder } from '../../apps/gem-digger/lib/birds/flock.js';

const TARGET = 0.75;
const WARMUP = 500;
const SAMPLE = 150;
const RUNS = 3;

function simulate(spawnFn, flockPatch, windPatch, motionPatch) {
  applyBirdSimPreset('default');
  Object.assign(birdSimConfig.flock, flockPatch);
  if (windPatch) Object.assign(birdSimConfig.wind, windPatch);
  if (motionPatch) Object.assign(birdSimConfig.motion, motionPatch);

  let phiMin = 1;
  let phiMean = 0;

  for (let run = 0; run < RUNS; run++) {
    const world = new World(GRID_W, GRID_H, 42 + run);
    bootstrapSandbox(world);
    spawnFn(world);

    for (let t = 0; t < WARMUP; t++) {
      world.tick++;
      tickBirds(world);
    }

    let sum = 0;
    let min = 1;
    for (let t = 0; t < SAMPLE; t++) {
      world.tick++;
      tickBirds(world);
      const phi = computeVicsekOrder(ensureBirds(world));
      sum += phi;
      min = Math.min(min, phi);
    }
    phiMean += sum / SAMPLE;
    phiMin = Math.min(phiMin, min);
  }

  return { phiMean: phiMean / RUNS, phiMin };
}

function singleFlock(world) {
  clearBirds(world);
  spawnFlock(world, world.width * 0.45, world.height * 0.28, 48);
}

const candidates = [
  {
    name: 'single-noWind',
    spawn: singleFlock,
    flock: {
      interactionMode: 'topological',
      topologicalNeighbors: 7,
      weightAli: 1.1,
      weightCoh: 0.55,
      weightSep: 1.6,
      personalSpace: 6.5,
      separationRadius: 28,
      cohesionSpeed: 0.5,
    },
    wind: { enabled: false, steerWeight: 0 },
  },
  {
    name: 'single-flockFirst',
    spawn: singleFlock,
    flock: {
      topologicalNeighbors: 8,
      weightAli: 1.0,
      weightCoh: 0.5,
      weightSep: 1.8,
      personalSpace: 6,
    },
    wind: { enabled: true, steerWeight: 0.5, speedFactor: 0.35, gustMin: 0.18 },
  },
  {
    name: 'demo-noWind-tuned',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 1.05,
      weightCoh: 0.5,
      weightSep: 1.7,
      personalSpace: 7,
      separationRadius: 30,
      topologicalNeighbors: 8,
    },
    wind: { enabled: false, steerWeight: 0 },
  },
  {
    name: 'demo-calmWind-tuned',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 0.95,
      weightCoh: 0.45,
      weightSep: 1.9,
      personalSpace: 6.5,
      topologicalNeighbors: 8,
    },
    wind: { enabled: true, steerWeight: 0.55, speedFactor: 0.38, gustMin: 0.2 },
  },
  {
    name: 'demo-metric-tuned',
    spawn: spawnDemoFlocks,
    flock: {
      interactionMode: 'metric',
      perception: 50,
      weightAli: 1.0,
      weightCoh: 0.48,
      weightSep: 1.75,
      personalSpace: 6.5,
    },
    wind: { enabled: false, steerWeight: 0 },
  },
];

console.log(`Vicsek φ target ≥ ${TARGET * 100}% (${RUNS} runs, warmup=${WARMUP}, sample=${SAMPLE})\n`);

const results = [];
for (const c of candidates) {
  const r = simulate(c.spawn, c.flock, c.wind);
  const ok = r.phiMin >= TARGET;
  results.push({ ...c, ...r, ok });
  console.log(
    `${ok ? '✓' : '✗'} ${c.name.padEnd(22)} mean=${(r.phiMean * 100).toFixed(1)}% min=${(r.phiMin * 100).toFixed(1)}%`
  );
}

const winners = results.filter((r) => r.ok).sort((a, b) => b.phiMin - a.phiMin);
if (winners.length) {
  const w = winners[0];
  console.log(`\nBest stable config: ${w.name}`);
  console.log('flock:', JSON.stringify(w.flock, null, 2));
  console.log('wind:', JSON.stringify(w.wind, null, 2));
} else {
  console.log('\nNo config met min φ — try single-flock spawn.');
}
