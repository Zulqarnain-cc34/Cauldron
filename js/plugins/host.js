import { registerRule } from '../rules/registry.js';

/** @typedef {{ key: string, id: string, label: string, group?: string, defaultEnabled?: boolean, disabled?: boolean }} PluginToggle */

/** @typedef {Object} PluginSetupContext
 * @property {import('../world.js').World} world
 * @property {HTMLElement} canvas
 * @property {(phase: string, rule: object) => void} registerRule
 * @property {(toggle: PluginToggle) => void} registerToggle
 * @property {(fn: (p: object, world: import('../world.js').World) => void) => void} registerRender
 * @property {(fn: (world: import('../world.js').World) => void) => void} onReset
 * @property {(key: string) => Record<string, unknown>} getState
 */

/** @typedef {Object} CauldronPlugin
 * @property {string} id
 * @property {(ctx: PluginSetupContext) => void} setup
 * @property {object[]} [behaviors]
 * @property {string} [suiteLabel]
 * @property {{ summary?: string, controls?: string[] }} [doc]
 */

/** @type {CauldronPlugin[]} */
const plugins = [];

/** @type {PluginToggle[]} */
const pluginToggles = [];

/** @type {((world: import('../world.js').World) => void)[]} */
const resetHooks = [];

/** @type {((p: object, world: import('../world.js').World) => void)[]} */
const renderHooks = [];

/**
 * Register an external plugin. Plugins live outside `js/` and use the engine APIs only.
 * @param {CauldronPlugin} plugin
 */
export function registerPlugin(plugin) {
  if (plugins.some((p) => p.id === plugin.id)) {
    throw new Error(`Plugin "${plugin.id}" already registered`);
  }
  plugins.push(plugin);
}

/** @returns {readonly CauldronPlugin[]} */
export function getRegisteredPlugins() {
  return plugins;
}

/** @returns {PluginToggle[]} */
export function getPluginToggleRules() {
  return pluginToggles.map((t) => ({
    ...t,
    group: t.group ?? 'plugin',
  }));
}

/** @returns {{ id: string, label: string, tests: object[] }[]} */
export function getPluginTestSuites() {
  return plugins
    .filter((p) => p.behaviors?.length)
    .map((p) => ({
      id: p.id,
      label: p.suiteLabel ?? p.id,
      tests: p.behaviors.map((b) => ({
        ...b,
        ruleId: b.ruleId ?? p.id,
        suite: p.id,
        suiteLabel: p.suiteLabel ?? p.id,
        scope: b.scope ?? { rules: [b.ruleId ?? `${p.id}-blast`] },
        rows: b.slice?.rows ?? b.rows,
      })),
    }));
}

/** @type {Set<string>} */
const initializedPlugins = new Set();

/**
 * @param {{ world: import('../world.js').World, canvas: HTMLElement }} opts
 */
export function initPlugins({ world, canvas }) {
  if (!world.plugin) world.plugin = {};

  for (const plugin of plugins) {
    if (initializedPlugins.has(plugin.id)) continue;
    initializedPlugins.add(plugin.id);

    const ctx = {
      world,
      canvas,
      registerRule,
      registerToggle(toggle) {
        if (!pluginToggles.some((t) => t.key === toggle.key)) {
          pluginToggles.push(toggle);
        }
        if (world.ruleEnabled[toggle.key] === undefined) {
          world.ruleEnabled[toggle.key] = toggle.defaultEnabled ?? true;
        }
      },
      onReset(fn) {
        resetHooks.push(fn);
      },
      registerRender(fn) {
        renderHooks.push(fn);
      },
      getState(key) {
        if (!world.plugin[plugin.id][key]) {
          world.plugin[plugin.id][key] = {};
        }
        return world.plugin[plugin.id][key];
      },
    };

    plugin.setup(ctx);
  }
}

/** Clear plugin-owned queues/state after a world reset. */
export function resetPlugins(world) {
  world.plugin = {};
  for (const fn of resetHooks) fn(world);
}

/** Draw plugin overlays after the grid render pass. */
export function renderPlugins(p, world) {
  for (const fn of renderHooks) fn(p, world);
}
