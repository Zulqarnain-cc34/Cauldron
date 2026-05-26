#!/usr/bin/env node
/**
 * One command before release — runs the full gate and prints a single verdict.
 * You never need to open individual tests; read this summary only.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {{ name: string, cmd: string, args: string[] }[]} */
const STEPS = [
  { name: 'Headless tests (behaviors)', cmd: 'node', args: ['--test', 'tooling/tests/run-node.js'] },
  { name: 'Layer boundaries', cmd: 'node', args: ['tooling/scripts/check-layers.mjs'] },
  { name: 'Behavior quality', cmd: 'node', args: ['tooling/scripts/check-behaviors.mjs'] },
  { name: 'Catalog coverage', cmd: 'node', args: ['tooling/scripts/check-coverage.mjs'] },
  { name: 'Golden snapshots', cmd: 'node', args: ['tooling/scripts/behavior-snapshot.mjs'] },
];

console.log('');
console.log('══════════════════════════════════════════');
console.log('  CAULDRON RELEASE CHECK');
console.log('══════════════════════════════════════════');
console.log('');

/** @type {{ name: string, ok: boolean, detail?: string }[]} */
const results = [];

for (const step of STEPS) {
  process.stdout.write(`  … ${step.name}\n`);
  const r = spawnSync(step.cmd, step.args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  const ok = r.status === 0;
  results.push({
    name: step.name,
    ok,
    detail: ok ? undefined : (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join('\n'),
  });
}

console.log('');

let snapCount = '?';
const snapPath = join(ROOT, 'tooling/tests/snapshots/behaviors.json');
if (existsSync(snapPath)) {
  try {
    snapCount = String(JSON.parse(readFileSync(snapPath, 'utf8')).behaviorCount ?? '?');
  } catch {
    snapCount = '?';
  }
}

for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}`);
  if (!r.ok && r.detail) {
    for (const line of r.detail.split('\n')) console.log(`      ${line}`);
  }
}

const allOk = results.every((r) => r.ok);

console.log('');
if (allOk) {
  console.log('  ────────────────────────────────────────');
  console.log(`  READY FOR RELEASE (${snapCount} behaviors snapshotted)`);
  console.log('  ────────────────────────────────────────');
  console.log('');
  console.log('  No manual test review needed — golden snapshots');
  console.log('  will fail CI if any behavior outcome drifts.');
  console.log('');
  process.exit(0);
}

console.log('  ────────────────────────────────────────');
console.log('  NOT READY — fix failures above');
console.log('  ────────────────────────────────────────');
console.log('');
console.log('  If you changed sim behavior on purpose:');
console.log('    npm run snapshot:update');
console.log('');
process.exit(1);
