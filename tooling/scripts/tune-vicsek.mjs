/**
 * Search flock params for stable Vicsek φ ≥ target (headless).
 * Run: node tooling/scripts/tune-vicsek.mjs
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

const TARGET = 0.85;
const WARMUP = 550;
const SAMPLE = 180;
const RUNS = 3;

function simulate(spawnFn, flockPatch, windPatch, spawnPatch, motionPatch) {
  applyBirdSimPreset('default');
  Object.assign(birdSimConfig.flock, flockPatch);
  if (windPatch) Object.assign(birdSimConfig.wind, windPatch);
  if (spawnPatch) Object.assign(birdSimConfig.spawn, spawnPatch);
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

function singleFlock(world, n = 40) {
  clearBirds(world);
  spawnFlock(world, world.width * 0.45, world.height * 0.28, n);
}

const baseWind = { enabled: false, steerWeight: 0 };

const candidates = [
  {
    name: 'current-default',
    spawn: spawnDemoFlocks,
    flock: {},
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
  {
    name: 'demo-high-ali',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 1.15,
      weightCoh: 0.52,
      weightSep: 1.65,
      personalSpace: 6.5,
      separationRadius: 28,
      topologicalNeighbors: 8,
      cohesionSpeed: 0.48,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
  {
    name: 'demo-metric-85',
    spawn: spawnDemoFlocks,
    flock: {
      interactionMode: 'metric',
      perception: 48,
      weightAli: 1.1,
      weightCoh: 0.5,
      weightSep: 1.7,
      personalSpace: 6.5,
      separationRadius: 28,
      cohesionSpeed: 0.45,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
  {
    name: 'demo-topo-balanced',
    spawn: spawnDemoFlocks,
    flock: {
      interactionMode: 'topological',
      topologicalNeighbors: 7,
      weightAli: 1.08,
      weightCoh: 0.48,
      weightSep: 1.75,
      personalSpace: 6.8,
      separationRadius: 29,
      cohesionSpeed: 0.46,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
  {
    name: '1flock-40',
    spawn: (w) => singleFlock(w, 40),
    flock: {
      weightAli: 1.12,
      weightCoh: 0.5,
      weightSep: 1.6,
      personalSpace: 6.5,
      separationRadius: 28,
      topologicalNeighbors: 7,
    },
    wind: baseWind,
  },
  {
    name: '2flock-14',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 1.1,
      weightCoh: 0.5,
      weightSep: 1.65,
      personalSpace: 6.5,
      topologicalNeighbors: 8,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 14 },
  },
  {
    name: 'demo-ali-coh-sep-sweep-a',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 1.2,
      weightCoh: 0.55,
      weightSep: 1.55,
      personalSpace: 6.2,
      separationRadius: 26,
      topologicalNeighbors: 7,
      cohesionSpeed: 0.5,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
  {
    name: 'demo-ali-coh-sep-sweep-b',
    spawn: spawnDemoFlocks,
    flock: {
      weightAli: 1.05,
      weightCoh: 0.45,
      weightSep: 1.85,
      personalSpace: 7,
      separationRadius: 30,
      topologicalNeighbors: 8,
      cohesionSpeed: 0.42,
    },
    wind: baseWind,
    spawnPatch: { flockCount: 2, birdsPerFlock: 10 },
  },
];

console.log(`Vicsek φ target ≥ ${TARGET * 100}% (${RUNS} runs, warmup=${WARMUP}, sample=${SAMPLE})\n`);

const results = [];
for (const c of candidates) {
  const r = simulate(c.spawn, c.flock, c.wind, c.spawnPatch, c.motionPatch);
  const ok = r.phiMin >= TARGET;
  results.push({ ...c, ...r, ok });
  console.log(
    `${ok ? '✓' : '✗'} ${c.name.padEnd(24)} mean=${(r.phiMean * 100).toFixed(1)}% min=${(r.phiMin * 100).toFixed(1)}%`
  );
}

results.sort((a, b) => b.phiMin - a.phiMin || b.phiMean - a.phiMean);
const winners = results.filter((r) => r.ok);

console.log('\n--- Ranked by min φ ---');
for (const r of results.slice(0, 5)) {
  console.log(
    `  ${r.ok ? '✓' : '✗'} ${r.name}: mean=${(r.phiMean * 100).toFixed(1)}% min=${(r.phiMin * 100).toFixed(1)}%`
  );
}

if (winners.length) {
  const w = winners[0];
  console.log(`\nBest (min φ ≥ ${TARGET * 100}%): ${w.name}`);
  console.log('flock:', JSON.stringify(w.flock, null, 2));
  if (w.spawnPatch) console.log('spawn:', JSON.stringify(w.spawnPatch, null, 2));
} else {
  console.log(`\nNo candidate met min φ ≥ ${TARGET * 100}%. Best attempt:`);
  const b = results[0];
  console.log(`  ${b.name} mean=${(b.phiMean * 100).toFixed(1)}% min=${(b.phiMin * 100).toFixed(1)}%`);
  console.log('flock:', JSON.stringify(b.flock, null, 2));
}
