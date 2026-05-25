import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { sandboxMap } from '../js/game/maps/definitions/sandbox.js';
import { createFreshMapSession } from '../js/game/maps/session.js';
import { computeMapGoalProgress } from '../js/game/maps/goals.js';
import { tryCollectGem } from '../js/game/gems/collect.js';
import { spawnGemPickup } from '../js/game/gems/pickups.js';

test('computeMapGoalProgress tracks collected diamonds', () => {
  const world = new World(32, 32, 1);
  createFreshMapSession(world, sandboxMap);

  let progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.mapLabel, 'Sandbox');
  assert.equal(progress.gems?.[0]?.collected, 0);
  assert.equal(progress.gems?.[0]?.target, 3);
  assert.equal(progress.allComplete, false);

  tryCollectGem(world, 120, 40);
  progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.gems?.[0]?.collected, 1);
  assert.equal(progress.allComplete, false);
});

test('computeMapGoalProgress marks level complete when all gems stored', () => {
  const world = new World(32, 32, 1);
  createFreshMapSession(world, sandboxMap);

  for (const gem of [...world.gemPickups]) {
    tryCollectGem(world, gem.x, gem.y);
  }

  const progress = computeMapGoalProgress(world, sandboxMap);
  assert.equal(progress.gems?.[0]?.collected, 3);
  assert.equal(progress.gems?.[0]?.complete, true);
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
