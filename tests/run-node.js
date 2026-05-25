import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { getAllTestSuites } from '../js/doc/build-catalog.js';
import { initPlugins } from '../js/plugins/host.js';
import { runScenario } from './helpers/harness.js';
import '../plugins/index.js';

initPlugins({
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
        `\nExpected:\n${result.expected.join('\n')}\n\nActual:\n${result.actual.join('\n')}`
      );
    });
  }
}
