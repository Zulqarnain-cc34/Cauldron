import { runWorldGenerator } from '../../../js/worldgen/registry.js';
import { placeOreVeins } from './gems/ore-veins.js';

/**
 * Run a library world generator, then apply Gem Digger–specific post steps (ore veins).
 * @param {import('../../../js/world.js').World} world
 * @param {string} generatorId
 * @param {Record<string, unknown>} [options]
 */
export function runMapWorldGenerator(world, generatorId, options = {}) {
  const { oreVeins, ...genOpts } = options;
  const result = runWorldGenerator(world, generatorId, genOpts);
  if (oreVeins?.length && result?.surfaceY) {
    placeOreVeins(world, result.surfaceY, oreVeins);
  }
  return result;
}
