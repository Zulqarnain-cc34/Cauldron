/**
 * Cauldron — public SDK (Layer 4)
 *
 * Prefer focused subpaths for tree-shaking and clear boundaries:
 *   js/cauldron/plugin.js   — L6 plugin authors
 *   js/cauldron/app.js      — L5 host apps (sketch, UI)
 *   js/cauldron/tooling.js  — L7 docs & tests
 *
 * This barrel re-exports everything for convenience.
 */

export * from './plugin.js';
export * from './app.js';
export * from './tooling.js';
export * from './extend.js';

export { bootstrapSandbox, bootstrapPlugins, loadPlugins } from './bootstrap.js';

/** Back-compat alias */
export { getExtensionToggles as getPluginToggleRules } from '../sim/toggle-registry.js';
