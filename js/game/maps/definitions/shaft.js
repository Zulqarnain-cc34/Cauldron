import { generateShaftWorld } from '../generators/shaft.js';

/** Procedural mine — layout from world.seed (changes on Reset). */
export function bootstrapShaft(world) {
  generateShaftWorld(world);
}

/** @type {import('../registry.js').MapDefinition} */
export const shaftMap = {
  id: 'shaft',
  label: 'Mine Shaft',
  description: 'Dig down through caves — diamonds shallow, topaz deeper, ruby deep.',
  seed: 88001,
  randomSeedOnReset: true,
  bootstrap: bootstrapShaft,
  goals: { gems: { diamond: 3, topaz: 2, ruby: 1 } },
  defaultRules: { grenade: true },
};
