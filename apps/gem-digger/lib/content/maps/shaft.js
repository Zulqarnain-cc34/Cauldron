import { runMapWorldGenerator } from '../../worldgen-bridge.js';

const SHAFT_ORE = [
  { minDepth: 8, maxDepth: 35, count: 4, itemId: 'diamond' },
  { minDepth: 30, maxDepth: 70, count: 3, itemId: 'topaz' },
  { minDepth: 55, maxDepth: 120, count: 2, itemId: 'ruby' },
];

/** Demo map — uses library `cavern` world generator + gem ore pass. */
export function bootstrapShaft(world) {
  runMapWorldGenerator(world, 'cavern', { oreVeins: SHAFT_ORE });
}

/** @type {import('../../maps/registry.js').MapDefinition} */
export const shaftMap = {
  id: 'shaft',
  label: 'Mine Shaft',
  description: 'Dig through hills into static caves — eraser breaks bedrock, gems inside.',
  seed: 88001,
  randomSeedOnReset: true,
  worldGenerator: 'cavern',
  worldGeneratorOptions: { oreVeins: SHAFT_ORE },
  bootstrap: bootstrapShaft,
  goals: { gems: { diamond: 4, topaz: 3, ruby: 2 } },
  defaultRules: { grenade: true },
};
