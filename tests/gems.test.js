import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { spawnGemPickup } from '../js/game/gems/pickups.js';
import { tryCollectGem } from '../js/game/gems/collect.js';
import { createBackpackInventory } from '../js/game/inventory/backpack-inventory.js';

test('spawn and collect diamond are separate actions', () => {
  const world = new World(16, 16, 1);
  world.backpack = createBackpackInventory();

  const gem = spawnGemPickup(world, 8, 4, 'diamond', 1);
  assert.ok(gem);
  assert.equal(world.gemPickups.length, 1);

  const miss = tryCollectGem(world, 2, 2);
  assert.equal(miss.collected, false);
  assert.equal(world.gemPickups.length, 1);

  const hit = tryCollectGem(world, 8, 4);
  assert.equal(hit.collected, true);
  assert.equal(hit.itemId, 'diamond');
  assert.equal(world.gemPickups.length, 0);
  assert.equal(world.backpack.slots.filter(Boolean).length, 1);
});

test('topaz and ruby collect into backpack like diamond', () => {
  const world = new World(16, 16, 1);
  world.backpack = createBackpackInventory();

  spawnGemPickup(world, 4, 4, 'topaz', 1);
  spawnGemPickup(world, 8, 8, 'ruby', 1);

  assert.equal(tryCollectGem(world, 4, 4).itemId, 'topaz');
  assert.equal(tryCollectGem(world, 8, 8).itemId, 'ruby');
  assert.equal(world.backpack.slots.filter(Boolean).length, 2);
});
