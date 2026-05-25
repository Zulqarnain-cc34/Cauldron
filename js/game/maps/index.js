/**
 * Map session engine — tabbed maps with isolated inventories and settings.
 *
 * @example
 * import { registerMapDefinitions, createMapManager, BUILTIN_MAPS } from './js/cauldron/game.js';
 * registerMapDefinitions(BUILTIN_MAPS);
 * const maps = createMapManager({ world, onSwitch: syncUi });
 * mountMapTabs(maps, document.getElementById('map-tabs'));
 * maps.init('sandbox');
 */

export {
  registerMapDefinition,
  registerMapDefinitions,
  getMapDefinition,
  getAllMapDefinitions,
  clearMapRegistry,
} from './registry.js';

export {
  captureMapSession,
  applyMapSession,
  applyMapSessionWithHooks,
  createFreshMapSession,
  cloneSlotInventory,
} from './session.js';

export { MapManager, createMapManager } from './manager.js';

export {
  computeMapGoalProgress,
  countGemsInWorld,
  countGemsInInventory,
} from './goals.js';

export { BUILTIN_MAPS, sandboxMap, workshopMap } from './definitions/index.js';

export { generateShaftWorld } from './generators/shaft.js';
export { shaftMap } from './definitions/shaft.js';
