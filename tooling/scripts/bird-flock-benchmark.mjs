/**
 * Headless bird flock benchmark — measures Vicsek φ and diagnostics per preset.
 * Run: node tooling/scripts/bird-flock-benchmark.mjs
 */
import { World, GRID_W, GRID_H } from '../../js/world.js';
import { bootstrapSandbox } from '../../apps/gem-digger/lib/content/maps/sandbox.js';
import { spawnDemoFlocks, tickBirds, ensureBirds } from '../../apps/gem-digger/lib/birds/birds.js';
import {
  birdSimConfig,
  BIRD_SIM_PRESETS,
  applyBirdSimPreset,
} from '../../apps/gem-digger/lib/birds/config.js';
import {
  sampleBirdMetrics,
  resetBirdMetrics,
} from '../../apps/gem-digger/lib/birds/metrics.js';
import { computeVicsekOrder } from '../../apps/gem-digger/lib/birds/flock.js';

const WARMUP = 400;
const SAMPLE = 120;
const TARGET_PHI = 0.75;

function makeWorld() {
  const world = new World(GRID_W, GRID_H, 42);
  bootstrapSandbox(world);
  spawnDemoFlocks(world);
  return world;
}

function runPreset(presetId) {
  applyBirdSimPreset(presetId);
  const world = makeWorld();
  resetBirdMetrics();

  for (let t = 0; t < WARMUP; t++) {
    world.tick++;
    tickBirds(world);
  }

  let phiSum = 0;
  let phiMin = 1;
  let phiMax = 0;
  let lastSnap = null;

  for (let t = 0; t < SAMPLE; t++) {
    world.tick++;
    tickBirds(world);
    const birds = ensureBirds(world);
    const phi = computeVicsekOrder(birds);
    phiSum += phi;
    phiMin = Math.min(phiMin, phi);
    phiMax = Math.max(phiMax, phi);
    lastSnap = sampleBirdMetrics(world, birds);
  }

  const phiMean = phiSum / SAMPLE;
  return {
    presetId,
    phiMean,
    phiMin,
    phiMax,
    lastSnap,
    windEnabled: birdSimConfig.wind.enabled,
    weightAli: birdSimConfig.flock.weightAli,
    weightCoh: birdSimConfig.flock.weightCoh,
    weightSep: birdSimConfig.flock.weightSep,
    steerWeight: birdSimConfig.wind.steerWeight,
  };
}

function printRow(r) {
  const m = r.lastSnap;
  const ok = r.phiMean >= TARGET_PHI ? '✓' : '✗';
  console.log(
    `${ok} ${r.presetId.padEnd(16)} φ mean=${(r.phiMean * 100).toFixed(1)}% ` +
      `min=${(r.phiMin * 100).toFixed(1)}% max=${(r.phiMax * 100).toFixed(1)}% ` +
      `wind=${r.windEnabled ? r.steerWeight.toFixed(2) : 'off'} ` +
      `ali=${r.weightAli} coh=${r.weightCoh} sep=${r.weightSep}`
  );
  if (m) {
    console.log(
      `    n=${m.birdCount} verdict=${m.verdict} emerge=${(m.flockEmergence * 100).toFixed(0)}% ` +
        `sep=${(m.separationScore * 100).toFixed(0)}% ali=${(m.alignmentScore * 100).toFixed(0)}% ` +
        `coh=${(m.cohesionScore * 100).toFixed(0)}% windAlign=${m.windAlignment.toFixed(2)} ` +
        `stuck=${(m.stuckRate * 100).toFixed(0)}% part=${(m.flockParticipation * 100).toFixed(0)}%`
    );
    console.log(`    hint: ${m.hint}`);
  }
}

console.log(`Bird flock benchmark (target Vicsek φ ≥ ${TARGET_PHI * 100}%)\n`);
console.log(`Grid ${GRID_W}×${GRID_H}, warmup=${WARMUP}, sample=${SAMPLE} ticks\n`);

const presets = Object.keys(BIRD_SIM_PRESETS);
const results = presets.map(runPreset);
results.sort((a, b) => b.phiMean - a.phiMean);

for (const r of results) printRow(r);

const best = results[0];
console.log(`\nBest preset: ${best.presetId} (φ=${(best.phiMean * 100).toFixed(1)}%)`);

// Parameter sweep on noWind baseline
console.log('\n--- Sweep: noWind + alignment/cohesion tweaks ---\n');
const sweeps = [
  { weightAli: 1.0, weightCoh: 0.55, weightSep: 1.8 },
  { weightAli: 1.2, weightCoh: 0.5, weightSep: 1.6 },
  { weightAli: 0.9, weightCoh: 0.65, weightSep: 2.0 },
  { weightAli: 1.1, weightCoh: 0.45, weightSep: 1.5, topologicalNeighbors: 9 },
  { weightAli: 1.3, weightCoh: 0.4, weightSep: 1.4, minFlockSize: 2 },
];

for (const patch of sweeps) {
  applyBirdSimPreset('noWind');
  Object.assign(birdSimConfig.flock, patch);
  const r = runPreset('noWind');
  printRow({ ...r, presetId: `noWind+sweep` });
}
