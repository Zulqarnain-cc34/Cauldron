#!/usr/bin/env node
/**
 * Export a self-contained JSON audit for LLM double-check review.
 *   npm run export:verification
 * Output: tests/exports/verification-report.json
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getAllBehaviors, getRuleModules } from '../js/cauldron/tooling.js';
import { getRegisteredPlugins } from '../js/plugins/host.js';
import { MATERIALS } from '../js/catalog/materials.js';
import { ensureTestBootstrap } from './lib/behavior-outcomes.mjs';
import { prepareScenario, stepScenario, runScenario } from '../tests/helpers/harness.js';
import { asciiFromWorld, rowsEqual } from '../tests/helpers/grid.js';
import { worldDigest } from './lib/behavior-outcomes.mjs';
import { parseNodeTestOutput } from './lib/parse-test-output.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tests/exports');
const OUT_JSON = join(OUT_DIR, 'verification-report.json');
const OUT_PROMPT = join(OUT_DIR, 'llm-review-prompt.txt');

const REVIEWER_INSTRUCTIONS = `You are reviewing a Cauldron falling-sand simulation test audit export.

Your job:
1. Confirm every behavior marked "verdict": "PASS" has a logically consistent setup:
   - "expectedGrid" should match what the test name/description claims (e.g. "falls" → material moved down).
   - "actualGrid" must equal "expectedGrid" for PASS rows.
   - If grid unchanged but name implies ignite/burn, "inspectPassed" must be true and rbState should show burn timers.
2. Flag any PASS that looks like a no-op (nothing changed when change was promised, no inspect).
3. Flag any expected result that violates physics intuition (sand falling up, fire freezing water as ice, etc.).
4. Summarize: total reviewed, count OK, count suspicious, list suspicious behavior ids with one-line reason.

Do NOT re-run code. Judge only from this JSON. Be concise.`;

function runGate(script, args = []) {
  const r = spawnSync('node', [join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    ok: r.status === 0,
    output: (r.stdout || r.stderr || '').trim().slice(-500),
  };
}

await ensureTestBootstrap();

/** @type {object[]} */
const behaviorRows = [];
let passCount = 0;
let failCount = 0;

for (const behavior of getAllBehaviors()) {
  const id = behavior.id ?? `${behavior.suite}-${behavior.name}`;
  const rows = behavior.slice?.rows ?? behavior.rows ?? [];
  const expect = behavior.expect ?? [];
  const scope = behavior.scope ?? { rules: [behavior.suite] };

  let result;
  try {
    result = runScenario(behavior);
  } catch (err) {
    failCount++;
    behaviorRows.push({
      id,
      suite: behavior.suite,
      name: behavior.name,
      description: behavior.description ?? null,
      rulesEnabled: scope.rules ?? [],
      steps: behavior.steps ?? 1,
      startGrid: rows,
      expectedGrid: expect,
      actualGrid: null,
      gridChanged: false,
      gridMatchesExpected: false,
      hasInspect: typeof behavior.inspect === 'function',
      inspectPassed: false,
      rbState: null,
      verdict: 'FAIL',
      failure: err.message,
    });
    continue;
  }

  const gridChanged = rows.join('|') !== result.actual.join('|');
  const pass = result.pass;
  if (pass) passCount++;
  else failCount++;

  const prep = prepareScenario(behavior);
  for (let i = 0; i < (behavior.steps ?? 1); i++) {
    stepScenario(prep.slice, prep.scope);
  }
  const digest = worldDigest(prep.slice.world);

  behaviorRows.push({
    id,
    suite: behavior.suite,
    name: behavior.name,
    description: behavior.description ?? null,
    rulesEnabled: scope.rules ?? [],
    steps: behavior.steps ?? 1,
    startGrid: rows,
    expectedGrid: expect,
    actualGrid: result.actual,
    gridChanged,
    gridMatchesExpected: rowsEqual(result.actual, expect),
    hasInspect: typeof behavior.inspect === 'function',
    inspectPassed: pass && typeof behavior.inspect === 'function' && !result.inspectError,
    rbState: digest.rb || null,
    verdict: pass ? 'PASS' : 'FAIL',
    failure: pass ? null : (result.inspectError ?? 'grid mismatch'),
  });
}

const rules = getRuleModules().map((mod) => ({
  id: mod.id,
  label: mod.label ?? mod.id,
  phase: mod.phase,
  species: mod.species != null ? (MATERIALS[mod.species]?.name ?? mod.species) : null,
  behaviorCount: mod.behaviors?.length ?? 0,
  behaviorIds: (mod.behaviors ?? []).map((b) => b.id),
}));

const plugins = getRegisteredPlugins().map((p) => ({
  id: p.id,
  behaviorCount: p.behaviors?.length ?? 0,
  behaviorIds: (p.behaviors ?? []).map((b) => b.id),
}));

const gates = {
  layers: runGate('check-layers.mjs'),
  behaviors: runGate('check-behaviors.mjs'),
  coverage: runGate('check-coverage.mjs'),
  snapshots: runGate('behavior-snapshot.mjs'),
};

const headless = spawnSync('node', ['--test', 'tests/run-node.js', 'tests/extension-api.test.js'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
const headlessOut = `${headless.stdout ?? ''}${headless.stderr ?? ''}`;
const { pass: headlessPass, fail: headlessFail } = parseNodeTestOutput(headlessOut);
const headlessOk = headless.status === 0;

let snapshotVersion = null;
const snapPath = join(ROOT, 'tests/snapshots/behaviors.json');
if (existsSync(snapPath)) {
  try {
    snapshotVersion = JSON.parse(readFileSync(snapPath, 'utf8')).version;
  } catch {
    snapshotVersion = null;
  }
}

const allGatesOk =
  Object.values(gates).every((g) => g.ok) && headlessOk && failCount === 0;

const report = {
  documentType: 'cauldron-verification-export',
  version: 1,
  generatedAt: new Date().toISOString(),
  project: {
    name: 'cauldron',
    description: 'Layered falling-sand simulation library',
  },
  reviewerInstructions: REVIEWER_INSTRUCTIONS,
  summary: {
    overallVerdict: allGatesOk && failCount === 0 ? 'ALL_PASS' : 'ISSUES_FOUND',
    behaviorTests: { total: behaviorRows.length, pass: passCount, fail: failCount },
    headlessTests: { pass: headlessPass, fail: headlessFail },
    rulesRegistered: rules.length,
    pluginsRegistered: plugins.length,
    qualityGatesAllPass: allGatesOk,
    goldenSnapshotVersion: snapshotVersion,
  },
  qualityGates: {
    headlessTests: {
      pass: headlessOk,
      passCount: headlessPass,
      failCount: headlessFail,
      exitCode: headless.status,
    },
    checkLayers: { pass: gates.layers.ok, detail: gates.layers.ok ? null : gates.layers.output },
    checkBehaviors: { pass: gates.behaviors.ok, detail: gates.behaviors.ok ? null : gates.behaviors.output },
    checkCoverage: { pass: gates.coverage.ok, detail: gates.coverage.ok ? null : gates.coverage.output },
    checkSnapshots: { pass: gates.snapshots.ok, detail: gates.snapshots.ok ? null : gates.snapshots.output },
  },
  asciiLegend: {
    '.': 'empty',
    '#': 'wall',
    S: 'sand',
    W: 'water',
    F: 'fire',
    u: 'fungus',
    B: 'wood',
    l: 'oil',
    V: 'lava',
    O: 'plant/organic',
    note: 'Full char map in js/catalog/materials.js ascii field per species',
  },
  rules,
  plugins,
  behaviors: behaviorRows,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const promptText = `${REVIEWER_INSTRUCTIONS}

---
Paste the JSON below this line (from verification-report.json) or attach the file.
---

SUMMARY FROM EXPORT:
- Overall: ${report.summary.overallVerdict}
- Behaviors: ${passCount}/${behaviorRows.length} PASS
- Headless: ${headlessPass} pass, ${headlessFail} fail
- Quality gates: ${allGatesOk ? 'all pass' : 'some failed'}

Then review each behavior in the "behaviors" array.
`;

writeFileSync(OUT_PROMPT, promptText);

console.log(`export:verification — wrote ${OUT_JSON}`);
console.log(`  behaviors: ${passCount}/${behaviorRows.length} PASS`);
console.log(
  `  headless:  ${headlessPass ?? '?'} pass / ${headlessFail ?? '?'} fail (exit ${headless.status ?? '?'})`
);
if (!allGatesOk) {
  if (!headlessOk) console.log('  gate fail: headless tests');
  for (const [name, g] of Object.entries(gates)) {
    if (!g.ok) console.log(`  gate fail: ${name}`);
  }
  if (failCount > 0) console.log(`  gate fail: ${failCount} behavior(s)`);
} else {
  console.log('  gates:     all pass');
}
console.log(`  LLM prompt: ${OUT_PROMPT}`);
console.log('');
console.log('Copy verification-report.json (or llm-review-prompt.txt + JSON) into your LLM for a second opinion.');

process.exit(allGatesOk ? 0 : 1);
