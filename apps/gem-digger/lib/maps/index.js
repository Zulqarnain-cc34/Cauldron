/**
 * Map session engine — tabbed maps with isolated inventories and settings.
 *
 * @example
 * import { registerMapDefinitions, createMapManager } from '../lib/index.js';
 * import { BUILTIN_MAPS } from '../lib/content/index.js';
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
