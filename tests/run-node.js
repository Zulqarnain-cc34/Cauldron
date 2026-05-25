import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/cauldron/app.js';
import { getAllTestSuites } from '../js/cauldron/tooling.js';
import { bootstrapSandbox } from '../js/cauldron/bootstrap.js';
import { runScenario } from './helpers/harness.js';

await bootstrapSandbox({
  world: new World(4, 4),
  canvas: { addEventListener() {} },
});

for (const suite of getAllTestSuites()) {
  for (const scenario of suite.tests) {
    test(`${suite.label} › ${scenario.name}`, () => {
      const result = runScenario(scenario);
      assert.equal(
        result.pass,
        true,
        result.inspectError
          ? `inspect: ${result.inspectError}`
          : `\nExpected:\n${result.expected.join('\n')}\n\nActual:\n${result.actual.join('\n')}`
      );
    });
  }
}
