/**
 * Cauldron — public SDK (simulation library only)
 *
 * Subpaths:
 *   cauldron/app.js      — host: World, runRules, render, input
 *   cauldron/plugin.js   — plugins
 *   cauldron/extend.js   — materials, reactions
 *   cauldron/worldgen.js — procedural terrain (optional)
 *   cauldron/bootstrap.js — quick sandbox startup
 *
 * Games (inventory, maps, gems) live under apps/<your-game>/lib/ — not here.
 */

export * from './plugin.js';
export * from './app.js';
export * from './tooling.js';
export * from './extend.js';
export * from './worldgen.js';

export { bootstrapSandbox, bootstrapPlugins, loadPlugins } from './bootstrap.js';

/** Back-compat alias */
export { getExtensionToggles as getPluginToggleRules } from '../sim/toggle-registry.js';
