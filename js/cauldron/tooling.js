/**
 * Cauldron tooling SDK — docs, tests, and catalog builders.
 */
export {
  buildDocCatalog,
  searchDocEntries,
  getDocEntry,
  getDocStats,
  getAllTestSuites,
  getAllBehaviors,
  buildTestIndex,
} from '../doc/build-catalog.js';
export {
  getTestSuites,
  getAllBehaviors as getCoreBehaviors,
  getRuleModules,
  getMaterialModules,
} from '../sim/test-registry.js';

/** @typedef {import('../doc/build-catalog.js').DocEntry} DocEntry */
