/**
 * Gem Digger game kit — NOT part of the Cauldron library.
 * Another game would copy this folder as a template or write its own kit.
 */

export * from './inventory/index.js';
export * from './maps/index.js';
export * from './gems/index.js';
export { runMapWorldGenerator } from './worldgen-bridge.js';

export { BUILTIN_MAPS, sandboxMap, shaftMap, workshopMap } from './content/index.js';
export { blankMap } from './content/maps/blank.js';
