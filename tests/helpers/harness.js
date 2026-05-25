import { normalizeScope } from '../../js/sim/scope.js';
import { WorldSlice } from '../../js/sim/world-slice.js';
import { worldFromAscii, asciiFromWorld, rowsEqual, diffCells } from './grid.js';

export function prepareScenario(test) {
  const rows = test.slice?.rows ?? test.rows;
  const scope = normalizeScope(test);
  const before = rows.map((r) => r);
  const slice = WorldSlice.fromAscii(before, test.seed ?? 1, worldFromAscii);
  slice.applySetup(test.setup);
  return {
    slice,
    scope,
    steps: test.steps ?? 1,
    expect: test.expect.map((r) => r),
    before,
    test,
  };
}

export function stepScenario(slice, scope) {
  slice.step(scope);
}

export function finishScenario(slice, expect) {
  const actual = asciiFromWorld(slice.world);
  const pass = rowsEqual(actual, expect);
  return {
    actual,
    expected: expect,
    pass,
    diffs: pass ? [] : diffCells(actual, expect),
  };
}

export function runScenario(test) {
  const steps = test.steps ?? 1;
  const prep = prepareScenario(test);
  for (let i = 0; i < steps; i++) {
    stepScenario(prep.slice, prep.scope);
  }
  const result = finishScenario(prep.slice, prep.expect);
  let inspectError = null;
  if (test.inspect) {
    try {
      test.inspect(prep.slice.world, { ...result, before: prep.before, steps });
    } catch (err) {
      inspectError = err?.message ?? String(err);
    }
  }
  const pass = result.pass && !inspectError;
  return {
    id: test.id,
    name: test.name,
    description: test.description ?? '',
    pass,
    inspectError,
    before: prep.before,
    actual: result.actual,
    expected: result.expected,
    diffs: result.diffs,
    steps,
    only: prep.scope.rules ?? null,
    scope: prep.scope,
    test,
  };
}

export function runSuite(tests) {
  const results = tests.map(runScenario);
  const passed = results.filter((r) => r.pass).length;
  return {
    results,
    passed,
    failed: results.length - passed,
    total: results.length,
  };
}
