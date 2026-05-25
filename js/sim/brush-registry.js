/**
 * L3 Brush registry — extension paint tools (plugins, material packs).
 */

/** @typedef {{ id: string, species: number, label: string, group?: string }} BrushTool */

/** @type {BrushTool[]} */
const extensionBrushes = [];

/**
 * @param {BrushTool} tool
 */
export function registerBrushTool(tool) {
  if (extensionBrushes.some((t) => t.id === tool.id)) return;
  extensionBrushes.push({ group: tool.group ?? 'extension', ...tool });
}

/** @returns {readonly BrushTool[]} */
export function getExtensionBrushTools() {
  return extensionBrushes;
}
