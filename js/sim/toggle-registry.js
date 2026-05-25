/**
 * L3 Toggle registry — extension toggles without host ↔ runtime cycles.
 * @module sim/toggle-registry
 */

/** @typedef {{ key: string, id: string, label: string, group?: string, defaultEnabled?: boolean, disabled?: boolean, species?: number }} ToggleEntry */

/** @type {ToggleEntry[]} */
const extensionToggles = [];

/**
 * Register a toggle from a plugin or extension package.
 * @param {ToggleEntry} toggle
 */
export function registerExtensionToggle(toggle) {
  if (extensionToggles.some((t) => t.key === toggle.key)) return;
  extensionToggles.push({
    ...toggle,
    group: toggle.group ?? 'plugin',
  });
}

/** @returns {readonly ToggleEntry[]} */
export function getExtensionToggles() {
  return extensionToggles;
}

/**
 * Apply default enabled state for a toggle on a world instance.
 * @param {import('../world.js').World} world
 * @param {ToggleEntry} toggle
 */
export function applyToggleDefault(world, toggle) {
  if (world.ruleEnabled[toggle.key] === undefined) {
    world.ruleEnabled[toggle.key] = toggle.defaultEnabled ?? true;
  }
}
