/**
 * App bootstrap — wires core rules, plugins, and lifecycle into a sandbox.
 */
import { initPlugins, resetPlugins } from '../plugins/host.js';
import { onWorldReset } from '../sim/lifecycle.js';
import { syncRuleEnabledDefaults } from '../sim/test-registry.js';
import { registerAppRules } from '../app/rules.js';

/**
 * Load the default plugin manifest (`plugins/index.js`).
 */
export async function loadPlugins() {
  await import('../../plugins/index.js');
}

/**
 * Full sandbox bootstrap for host apps (sketch.js, docs runner).
 * @param {{ world: import('../world.js').World, canvas: HTMLElement }} opts
 */
export async function bootstrapSandbox(opts) {
  registerAppRules();
  await loadPlugins();
  onWorldReset(resetPlugins);
  initPlugins(opts);
  syncRuleEnabledDefaults(opts.world);
}

/** @deprecated Use bootstrapSandbox */
export async function bootstrapPlugins(opts) {
  return bootstrapSandbox(opts);
}
