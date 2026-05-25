#!/usr/bin/env node
/**
 * Export a self-contained JSON audit for LLM double-check review.
 *
 *   npm run export:verification           — full (behaviors + headless + gates) ~15s
 *   npm run export:verification -- --quick — behaviors only ~1s (for copy:llm --fresh)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getRuleModules, getAllTestSuites } from '../js/cauldron/tooling.js';
import { getRegisteredPlugins } from '../js/plugins/host.js';
import { MATERIALS } from '../js/catalog/materials.js';
import { collectBehaviorSnapshots, behaviorCount } from './lib/behavior-outcomes.mjs';
import { parseNodeTestOutput } from './lib/parse-test-output.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tests/exports');
const OUT_JSON = join(OUT_DIR, 'verification-report.json');
const OUT_PROMPT = join(OUT_DIR, 'llm-review-prompt.txt');
const OUT_BUNDLE = join(OUT_DIR, 'llm-paste-bundle.txt');
const quick = process.argv.includes('--quick');

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

const snapshots = await collectBehaviorSnapshots();
const behaviorRows = Object.values(snapshots);
const passCount = behaviorRows.filter((b) => b.verdict === 'PASS').length;
const failCount = behaviorRows.length - passCount;

const expectedTotal = getAllTestSuites().reduce((n, s) => n + s.tests.length, 0);
if (behaviorRows.length !== expectedTotal) {
  console.error(
    `export: behavior count mismatch — ran ${behaviorRows.length}, expected ${expectedTotal} (core + plugins)`
  );
  process.exit(1);
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

/** @type {Record<string, { ok: boolean, output?: string }>} */
let gates = {};
let headlessPass = null;
let headlessFail = null;
let headlessOk = null;
let headlessStatus = null;

if (!quick) {
  gates = {
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
  headlessStatus = headless.status;
  const headlessOut = `${headless.stdout ?? ''}${headless.stderr ?? ''}`;
  ({ pass: headlessPass, fail: headlessFail } = parseNodeTestOutput(headlessOut));
  headlessOk = headless.status === 0;
}

let snapshotVersion = null;
const snapPath = join(ROOT, 'tests/snapshots/behaviors.json');
if (existsSync(snapPath)) {
  try {
    snapshotVersion = JSON.parse(readFileSync(snapPath, 'utf8')).version;
  } catch {
    snapshotVersion = null;
  }
}

const allGatesOk = quick
  ? failCount === 0
  : Object.values(gates).every((g) => g.ok) && headlessOk && failCount === 0;

const report = {
  documentType: 'cauldron-verification-export',
  version: 1,
  exportMode: quick ? 'quick' : 'full',
  generatedAt: new Date().toISOString(),
  project: {
    name: 'cauldron',
    description: 'Layered falling-sand simulation library',
  },
  reviewerInstructions: REVIEWER_INSTRUCTIONS,
  summary: {
    overallVerdict: allGatesOk ? 'ALL_PASS' : 'ISSUES_FOUND',
    behaviorTests: { total: behaviorRows.length, pass: passCount, fail: failCount },
    expectedBehaviorCount: expectedTotal,
    includesPluginTests: true,
    headlessTests: quick
      ? { pass: null, fail: null, note: 'not run in quick mode — use npm test or export:verification' }
      : { pass: headlessPass, fail: headlessFail },
    rulesRegistered: rules.length,
    pluginsRegistered: plugins.length,
    qualityGatesAllPass: quick ? null : allGatesOk,
    goldenSnapshotVersion: snapshotVersion,
  },
  qualityGates: quick
    ? { note: 'Skipped in quick export. Run npm test or npm run export:verification for full gates.' }
    : {
        headlessTests: {
          pass: headlessOk,
          passCount: headlessPass,
          failCount: headlessFail,
          exitCode: headlessStatus,
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

const bundlePaste = `${REVIEWER_INSTRUCTIONS}

---
AUDIT SUMMARY
---
Overall: ${report.summary.overallVerdict}
Behaviors: ${passCount}/${behaviorRows.length} PASS
Export mode: ${quick ? 'quick' : 'full'}
Generated: ${report.generatedAt}

---
Paste review task: Read the JSON below. Flag suspicious PASS rows. Summarize OK vs suspicious behavior ids.
---

${JSON.stringify(report, null, 2)}
`;
writeFileSync(OUT_BUNDLE, bundlePaste);

writeFileSync(
  OUT_PROMPT,
  `${REVIEWER_INSTRUCTIONS}

---
SUMMARY: ${report.summary.overallVerdict} — ${passCount}/${behaviorRows.length} behaviors PASS
Mode: ${quick ? 'quick (behaviors only)' : 'full (all gates)'}
---
`
);

const mode = quick ? 'quick' : 'full';
console.log(`export:verification (${mode}) — wrote ${OUT_JSON}`);
console.log(`  behaviors: ${passCount}/${behaviorCount()} PASS`);
if (!quick) {
  console.log(
    `  headless:  ${headlessPass ?? '?'} pass / ${headlessFail ?? '?'} fail (exit ${headlessStatus ?? '?'})`
  );
  if (!allGatesOk) {
    if (!headlessOk) console.log('  gate fail: headless tests');
    for (const [name, g] of Object.entries(gates)) {
      if (!g.ok) console.log(`  gate fail: ${name}`);
    }
  } else {
    console.log('  gates:     all pass');
  }
} else {
  console.log('  gates:     skipped (use full export or npm test)');
}

process.exit(allGatesOk ? 0 : 1);
