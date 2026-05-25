import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { captureMapSession, applyMapSession, createFreshMapSession } from '../js/game/maps/session.js';
import { sandboxMap } from '../js/game/maps/definitions/sandbox.js';
import { addStack } from '../js/game/inventory/slot-inventory.js';

test('map session capture and restore isolates inventories', () => {
  const world = new World(8, 8, 1);
  createFreshMapSession(world, sandboxMap);
  addStack(world.backpack, 'sand', 4);

  const snap = captureMapSession(world, { mapId: 'sandbox', label: 'Sandbox' });
  addStack(world.backpack, 'sand', 99);

  applyMapSession(world, snap);
  assert.equal(world.backpack.slots.filter(Boolean).length, 1);
  const stack = world.backpack.slots.find(Boolean);
  assert.equal(stack?.itemId, 'sand');
  assert.equal(stack?.count, 4);
});
