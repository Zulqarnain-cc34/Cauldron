import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import {
  registerMapDefinitions,
  clearMapRegistry,
  createMapManager,
} from '../js/game/maps/index.js';
import { sandboxMap } from '../js/game/maps/definitions/sandbox.js';
import { workshopMap } from '../js/game/maps/definitions/workshop.js';
import { addStack } from '../js/game/inventory/slot-inventory.js';
import { spawnGemPickup } from '../js/game/gems/pickups.js';

test('switchTo keeps separate map sessions like two apps', () => {
  clearMapRegistry();
  registerMapDefinitions([sandboxMap, workshopMap]);

  const world = new World(32, 32, 1);
  const manager = createMapManager({ world, initialMapId: 'sandbox' });
  manager.init('sandbox');

  addStack(world.backpack, 'sand', 2);
  spawnGemPickup(world, 10, 10, 'diamond', 1);
  const sandboxTick = world.tick;
  const sandboxCells = new Uint8Array(world.cells);

  manager.switchTo('workshop');
  assert.equal(manager.getActiveMapId(), 'workshop');
  assert.notDeepEqual(world.cells, sandboxCells);
  assert.equal(world.backpack.slots.filter(Boolean).length, 1);
  assert.equal(world.backpack.slots.find(Boolean)?.itemId, 'stone');

  addStack(world.jar, 'sand', 7);
  const workshopTick = world.tick;

  manager.switchTo('sandbox');
  assert.equal(manager.getActiveMapId(), 'sandbox');
  assert.deepEqual(world.cells, sandboxCells);
  assert.equal(world.tick, sandboxTick);
  assert.equal(world.backpack.slots.find(Boolean)?.count, 2);
  assert.equal(world.gemPickups.length, 4);

  manager.switchTo('workshop');
  assert.equal(world.tick, workshopTick);
  assert.equal(world.jar.slots.find(Boolean)?.count, 12);
});
