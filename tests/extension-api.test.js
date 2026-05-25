import test from 'node:test';
import assert from 'node:assert/strict';
import { Mobility } from '../js/cauldron/app.js';
import { registerMaterialPack, registerReaction } from '../js/cauldron/extend.js';
import { Species } from '../js/cauldron/plugin.js';
import { runScenario } from './helpers/harness.js';
import { bootstrapSandbox } from '../js/cauldron/bootstrap.js';
import { World } from '../js/world.js';
import { materialHasTag } from '../js/catalog/material-queries.js';
import { getMaterialModules } from '../js/sim/test-registry.js';

await bootstrapSandbox({
  world: new World(4, 4),
  canvas: { addEventListener() {} },
});

test('Extension API › registerMaterialPack adds falling material', () => {
  const species = registerMaterialPack({
    id: 'test-gravel',
    material: {
      name: 'gravel',
      phase: 'solid',
      mobility: Mobility.GRANULAR,
      density: 2.0,
      tags: ['granular', 'falling'],
      color: [100, 100, 100],
      ascii: 'v',
    },
    ruleDef: {
      id: 'test-gravel',
      behaviors: [],
    },
    brush: false,
  });

  assert.ok(species >= 128);

  const result = runScenario({
    id: 'ext-gravel-falls',
    name: 'Extension gravel falls',
    slice: { rows: ['.v', '..'] },
    expect: ['..', '.v'],
    steps: 1,
    scope: { rules: ['test-gravel'] },
  });

  assert.equal(result.pass, true, result.actual.join('\n'));
});

test('Extension API › registerReaction dedupes by id', () => {
  registerReaction({
    id: 'ext-test-rxn',
    a: Species.ACID,
    b: Species.ICE,
    result: Species.WATER,
    at: 'b',
  });

  registerReaction({
    id: 'ext-test-rxn',
    a: Species.ACID,
    b: Species.ICE,
    result: Species.STEAM,
    at: 'b',
  });

  const result = runScenario({
    id: 'ext-acid-ice',
    name: 'Acid melts ice to water',
    slice: { rows: ['AI'] },
    expect: ['AW'],
    steps: 1,
    scope: { rules: ['reactions'] },
  });

  assert.equal(result.pass, true, result.actual.join('\n'));
});

test('Extension API › runtime burnable tag visible to materialHasTag', () => {
  registerMaterialPack({
    id: 'test-tinder',
    material: {
      name: 'tinder',
      phase: 'solid',
      mobility: Mobility.STATIC,
      density: 0.5,
      tags: ['burnable'],
      color: [200, 150, 50],
      ascii: 'k',
    },
    ruleDef: { id: 'test-tinder', behaviors: [] },
    brush: false,
  });

  const mod = getMaterialModules().find((m) => m.id === 'test-tinder');
  assert.ok(mod);
  assert.equal(materialHasTag(mod.species, 'burnable'), true);
});
