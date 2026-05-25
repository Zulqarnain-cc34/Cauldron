#!/usr/bin/env node
/**
 * Golden snapshot of every behavior outcome.
 *   npm run snapshot:update   — refresh after intentional sim changes
 *   npm run check:snapshots   — fail CI if any outcome drifted (regression detector)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectBehaviorSnapshots, behaviorCount } from './lib/behavior-outcomes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = join(ROOT, 'tests/snapshots/behaviors.json');
const write = process.argv.includes('--write');

const current = await collectBehaviorSnapshots();
const ids = Object.keys(current).sort();

const payload = {
  version: 1,
  behaviorCount: behaviorCount(),
  ids,
  behaviors: current,
};

if (write) {
  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  const failed = ids.filter((id) => (current[id].verdict ?? (current[id].pass ? 'PASS' : 'FAIL')) !== 'PASS');
  console.log(`snapshot:update — wrote ${ids.length} behaviors → tests/snapshots/behaviors.json`);
  if (failed.length) {
    console.error(`  ✗ ${failed.length} behavior(s) failing — fix before release:`);
    for (const id of failed) console.error(`    - ${id}`);
    process.exit(1);
  }
  process.exit(0);
}

if (!existsSync(SNAPSHOT_PATH)) {
  console.error('Missing tests/snapshots/behaviors.json — run: npm run snapshot:update');
  process.exit(1);
}

const saved = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
/** @type {string[]} */
const errors = [];

if (saved.behaviorCount !== behaviorCount()) {
  errors.push(`behavior count ${behaviorCount()} !== snapshot ${saved.behaviorCount} — run snapshot:update`);
}

for (const id of ids) {
  if (!saved.behaviors?.[id]) {
    errors.push(`new behavior missing from snapshot: ${id} — run snapshot:update`);
    continue;
  }
  const a = saved.behaviors[id];
  const b = current[id];
  const bPass = b.verdict === 'PASS' || b.pass === true;
  if (!bPass) {
    errors.push(`${id}: currently failing — ${b.failure ?? b.inspectError ?? b.error ?? 'grid mismatch'}`);
    continue;
  }
  if (JSON.stringify(pick(a)) !== JSON.stringify(pick(b))) {
    errors.push(`${id}: outcome changed (regression or intentional — run snapshot:update if expected)`);
  }
}

for (const id of saved.ids ?? Object.keys(saved.behaviors ?? {})) {
  if (!current[id]) errors.push(`removed behavior still in snapshot: ${id} — run snapshot:update`);
}

if (errors.length) {
  console.error(`\ncheck:snapshots — ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(`check:snapshots OK — ${ids.length} behavior outcomes match golden file`);

function pick(o) {
  return {
    before: o.startGrid ?? o.before,
    after: o.actualGrid ?? o.after,
    rb: o.rbState ?? o.rb ?? '',
  };
}
