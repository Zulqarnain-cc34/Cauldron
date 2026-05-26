import { registerRule } from '../rules/registry.js';
import { registerExtensionToggle, applyToggleDefault } from '../sim/toggle-registry.js';
import { onWorldReset } from '../sim/lifecycle.js';
import { registerMaterialPack } from '../sim/material-pack.js';
import { registerReaction } from '../sim/reaction-store.js';
import { registerBrushTool } from '../sim/brush-registry.js';
import { registerRuntimeRuleDef } from '../sim/register-rule-def.js';

export const CAULDRON_API_VERSION = 1;

/** @typedef {{ key: string, id: string, label: string, group?: string, defaultEnabled?: boolean, disabled?: boolean }} PluginToggle */

/** @typedef {Object} PluginSetupContext
 * @property {import('../world.js').World} world
 * @property {HTMLElement} canvas
 * @property {(phase: string, rule: object) => void} registerRule
 * @property {(toggle: PluginToggle) => void} registerToggle
 * @property {(pack: import('../sim/material-pack.js').MaterialPack) => number} registerMaterialPack
 * @property {(rxn: import('../sim/reaction-store.js').ReactionDef) => void} registerReaction
 * @property {(tool: import('../sim/brush-registry.js').BrushTool) => void} registerBrushTool
 * @property {(def: object) => void} registerRuleDef
 * @property {(fn: (overlay: import('../overlay.js').OverlayContext, world: import('../world.js').World) => void) => void} registerRender
 * @property {(fn: (world: import('../world.js').World) => void) => void} onReset
 * @property {(key: string) => Record<string, unknown>} getState
 */

/** @typedef {Object} CauldronPlugin
 * @property {string} id
 * @property {number} [apiVersion]
 * @property {(ctx: PluginSetupContext) => void} setup
 * @property {object[]} [behaviors]
 * @property {string} [suiteLabel]
 * @property {{ summary?: string, controls?: string[] }} [doc]
 */

/** @type {CauldronPlugin[]} */
const plugins = [];

/** @type {((overlay: import('../overlay.js').OverlayContext, world: import('../world.js').World) => void)[]} */
const renderHooks = [];

/**
 * Register an external plugin. Plugins live outside `js/` and use the engine APIs only.
 * @param {CauldronPlugin} plugin
 */
export function registerPlugin(plugin) {
  if (plugins.some((p) => p.id === plugin.id)) {
    throw new Error(`Plugin "${plugin.id}" already registered`);
  }
  if (plugin.apiVersion != null && plugin.apiVersion > CAULDRON_API_VERSION) {
    console.warn(
      `[cauldron] Plugin "${plugin.id}" targets API v${plugin.apiVersion}; runtime is v${CAULDRON_API_VERSION}`
    );
  }
  plugins.push(plugin);
}

/** @returns {readonly CauldronPlugin[]} */
export function getRegisteredPlugins() {
  return plugins;
}

/** @deprecated Use getExtensionToggles from sim/toggle-registry */
export function getPluginToggleRules() {
  return [];
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
      registerMaterialPack,
      registerReaction,
      registerBrushTool,
      registerRuleDef: registerRuntimeRuleDef,
      registerToggle(toggle) {
        registerExtensionToggle(toggle);
        applyToggleDefault(world, toggle);
      },
      onReset(fn) {
        onWorldReset(fn);
      },
      registerRender(fn) {
        renderHooks.push(fn);
      },
      getState(key) {
        if (!world.plugin[plugin.id]) world.plugin[plugin.id] = {};
        if (!world.plugin[plugin.id][key]) {
          world.plugin[plugin.id][key] = {};
        }
        return world.plugin[plugin.id][key];
      },
    };

    plugin.setup(ctx);
  }
}

/** Clear plugin-owned state after a world reset. Registered via bootstrap lifecycle. */
export function resetPlugins(world) {
  world.plugin = {};
}

/** Draw plugin overlays after the grid render pass. */
export function renderPlugins(overlay, world) {
  for (const fn of renderHooks) fn(overlay, world);
}
