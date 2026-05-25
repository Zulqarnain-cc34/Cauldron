import test from 'node:test';
import assert from 'node:assert/strict';
import { getTestSuites } from '../js/sim/test-registry.js';
import { runScenario } from './helpers/harness.js';

for (const suite of getTestSuites()) {
  for (const scenario of suite.tests) {
    test(`${suite.label} › ${scenario.name}`, () => {
      const result = runScenario(scenario);
      assert.equal(
        result.pass,
        true,
        `\nExpected:\n${result.expected.join('\n')}\n\nActual:\n${result.actual.join('\n')}`
      );
    });
  }
}
