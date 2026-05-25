/**
 * Cauldron tooling SDK — docs, tests, and catalog builders.
 */
export {
  buildDocCatalog,
  searchDocEntries,
  getDocEntry,
  getDocStats,
  getAllTestSuites,
  buildTestIndex,
} from '../doc/build-catalog.js';
export { getTestSuites, getAllBehaviors, getRuleModules, getMaterialModules } from '../sim/test-registry.js';

/** @typedef {import('../doc/build-catalog.js').DocEntry} DocEntry */
