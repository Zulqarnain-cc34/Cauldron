import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { generateShaftWorld } from '../js/game/maps/generators/shaft.js';
import { shaftMap } from '../js/game/maps/definitions/shaft.js';
import { createFreshMapSession } from '../js/game/maps/session.js';
import { computeMapGoalProgress } from '../js/game/maps/goals.js';

test('generateShaftWorld creates gems and diggable underground', () => {
  const world = new World(280, 200, 12345);
  const { gemCount, shaftX } = generateShaftWorld(world);

  assert.ok(gemCount >= 6);
  assert.ok(shaftX > 0 && shaftX < world.width);
  assert.ok(world.gemPickups.length >= 6);

  let emptyBelowSurface = 0;
  for (let y = 8; y < world.height - 1; y++) {
    for (let x = 0; x < world.width; x++) {
      if (world.get(x, y).species === 0) emptyBelowSurface++;
    }
  }
  assert.ok(emptyBelowSurface > 50, 'caves and shaft should carve air');
});

test('shaft map goals match spawned gem types', () => {
  const world = new World(280, 200, 88001);
  createFreshMapSession(world, shaftMap);

  const progress = computeMapGoalProgress(world, shaftMap);
  assert.equal(progress.gems?.length, 3);

  const byId = Object.fromEntries(progress.gems.map((g) => [g.itemId, g.target]));
  assert.equal(byId.diamond, 3);
  assert.equal(byId.topaz, 2);
  assert.equal(byId.ruby, 1);

  const inWorld = { diamond: 0, topaz: 0, ruby: 0 };
  for (const g of world.gemPickups) {
    inWorld[g.itemId] = (inWorld[g.itemId] ?? 0) + g.count;
  }
  assert.ok(inWorld.diamond >= 3);
  assert.ok(inWorld.topaz >= 2);
  assert.ok(inWorld.ruby >= 1);
});
