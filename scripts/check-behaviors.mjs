#!/usr/bin/env node
/**
 * Behavior test quality gate — catches no-op / weak specs without an LLM.
 *
 * Rules:
 *  1. Tests whose name implies change must move the grid OR use inspect().
 *  2. Ignite/burn tests with unchanged ASCII must use inspect().
 *  3. Mutation: wrong expect must fail (detects tests that pass regardless).
 */
import { bootstrapSandbox } from '../js/cauldron/bootstrap.js';
import { World } from '../js/world.js';
import { getAllBehaviors } from '../js/cauldron/tooling.js';
import { runScenario } from '../tests/helpers/harness.js';

await bootstrapSandbox({
  world: new World(4, 4),
  canvas: { addEventListener() {} },
});

const UNCHANGED_OK =
  /\b(stays?|blocked|static|rests?|above|unchanged|no retry|one cell per|does not|holds|remains)\b/i;
const MUST_CHANGE =
  /\b(falls?|slides?|spreads?|moves?|diagonal|sinks?|rises?|flows?|germinat|corrod|freez|extinguish|burns away|clears?|destroy|blast|melts?|turns?)\b/i;
const INTERNAL_STATE =
  /\b(ignite|burn|countdown|timer|rb|smolder|ember)\b/i;

/** @param {string[]} rows */
function rowsKey(rows) {
  return rows.join('|');
}

/** @param {string[]} actual */
function wrongExpect(actual) {
  const chars = actual.map((r) => [...r]);
  for (let y = 0; y < chars.length; y++) {
    for (let x = 0; x < chars[y].length; x++) {
      const c = chars[y][x];
      if (c === '#') continue;
      chars[y][x] = c === '.' ? 'X' : '.';
      return chars.map((r) => r.join(''));
    }
  }
  return null;
}

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

for (const behavior of getAllBehaviors()) {
  const label = `${behavior.suite} › ${behavior.id ?? behavior.name}`;
  const text = `${behavior.id ?? ''} ${behavior.name ?? ''} ${behavior.description ?? ''}`;
  const hasInspect = typeof behavior.inspect === 'function';

  let result;
  try {
    result = runScenario(behavior);
  } catch (err) {
    errors.push(`${label}: threw — ${err.message}`);
    continue;
  }

  if (!result.pass) {
    errors.push(`${label}: scenario fails headless — ${result.inspectError ?? 'grid mismatch'}`);
    continue;
  }

  const before = result.before;
  const after = result.actual;
  const gridMoved = rowsKey(before) !== rowsKey(after);

  if (INTERNAL_STATE.test(text) && !gridMoved && !hasInspect) {
    errors.push(
      `${label}: claims internal burn/ignite state but has no inspect() — ASCII alone cannot prove it`
    );
  }

  if (MUST_CHANGE.test(text) && !UNCHANGED_OK.test(text) && !gridMoved && !hasInspect) {
    errors.push(
      `${label}: name implies visible change but grid is unchanged and no inspect() — likely no-op test`
    );
  }

  const bogus = wrongExpect(after);
  if (bogus) {
    const mutant = runScenario({ ...behavior, expect: bogus });
    if (mutant.pass) {
      errors.push(
        `${label}: passes with deliberately wrong expect — test does not constrain outcome`
      );
    }
  }

  if (!behavior.description && MUST_CHANGE.test(text)) {
    warnings.push(`${label}: missing description (recommended for docs)`);
  }
}

if (warnings.length) {
  console.warn(`\ncheck:behaviors — ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error(`\ncheck:behaviors — ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(`check:behaviors OK — ${getAllBehaviors().length} behaviors verified`);
