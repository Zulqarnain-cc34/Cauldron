import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { sandboxMap } from '../js/game/maps/definitions/sandbox.js';
import { createFreshMapSession } from '../js/game/maps/session.js';
import { computeMapGoalProgress } from '../js/game/maps/goals.js';
import { tryCollectGem } from '../js/game/gems/collect.js';
import { spawnGemPickup } from '../js/game/gems/pickups.js';

test('computeMapGoalProgress tracks collected diamonds', () => {
  const world = new World(280, 200, 1);
  createFreshMapSession(world, sandboxMap);

  let progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.mapLabel, 'Tutorial');
  assert.equal(progress.gems?.[0]?.collected, 0);
  assert.equal(progress.gems?.[0]?.target, 2);
  assert.equal(progress.allComplete, false);

  const gem = world.gemPickups[0];
  tryCollectGem(world, gem.x, gem.y);
  progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.gems?.[0]?.collected, 1);
  assert.equal(progress.allComplete, false);
});

test('computeMapGoalProgress marks level complete when all gems stored', () => {
  const world = new World(280, 200, 1);
  createFreshMapSession(world, sandboxMap);

  for (const gem of [...world.gemPickups]) {
    tryCollectGem(world, gem.x, gem.y);
  }

  const progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.gems?.find((g) => g.itemId === 'diamond')?.collected, 2);
  assert.equal(progress.allComplete, true);
});

test('computeMapGoalProgress ignores gems still in world', () => {
  const world = new World(16, 16, 1);
  spawnGemPickup(world, 4, 4, 'diamond', 1);
  spawnGemPickup(world, 8, 8, 'diamond', 1);

  const progress = computeMapGoalProgress(world, {
    ...sandboxMap,
    goals: { gems: { diamond: 2 } },
  });

  assert.equal(progress.gems?.[0]?.collected, 0);
  assert.equal(progress.allComplete, false);
});
