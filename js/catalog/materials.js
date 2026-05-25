import { Species } from './species.js';
import { Tags } from './tags.js';

/**
 * @typedef MaterialDef
 * @property {number} id
 * @property {string} name
 * @property {'solid'|'liquid'|'gas'} phase
 * @property {number} density
 * @property {string[]} tags
 * @property {[number,number,number]} color
 * @property {string} [ascii]
 */

/** @type {Record<number, MaterialDef>} */
export const MATERIALS = {
  [Species.EMPTY]: {
    id: Species.EMPTY,
    name: 'empty',
    phase: 'solid',
    density: 0,
    tags: [],
    color: [8, 8, 14],
    ascii: '.',
  },
  [Species.WALL]: {
    id: Species.WALL,
    name: 'wall',
    phase: 'solid',
    density: 100,
    tags: [Tags.STATIC, Tags.SOLID],
    color: [42, 42, 52],
    ascii: '#',
  },
  [Species.SAND]: {
    id: Species.SAND,
    name: 'sand',
    phase: 'solid',
    density: 3,
    tags: [Tags.SOLID, Tags.GRANULAR, Tags.FALLING],
    color: [220, 180, 60],
    ascii: 'S',
  },
  [Species.WATER]: {
    id: Species.WATER,
    name: 'water',
    phase: 'liquid',
    density: 2,
    tags: [Tags.LIQUID, Tags.FALLING],
    color: [40, 120, 220],
    ascii: 'W',
  },
  [Species.STONE]: {
    id: Species.STONE,
    name: 'stone',
    phase: 'solid',
    density: 5,
    tags: [Tags.STATIC, Tags.SOLID],
    color: [90, 90, 100],
    ascii: 'T',
  },
  [Species.FIRE]: {
    id: Species.FIRE,
    name: 'fire',
    phase: 'gas',
    density: 0,
    tags: [Tags.GAS, Tags.RISING, Tags.HOT],
    color: [255, 120, 40],
    ascii: 'F',
  },
  [Species.ORGANIC]: {
    id: Species.ORGANIC,
    name: 'organic',
    phase: 'solid',
    density: 2,
    tags: [Tags.SOLID, Tags.BURNABLE],
    color: [50, 160, 70],
    ascii: 'O',
  },
  [Species.STEAM]: {
    id: Species.STEAM,
    name: 'steam',
    phase: 'gas',
    density: 0,
    tags: [Tags.GAS, Tags.RISING],
    color: [180, 200, 220],
    ascii: '^',
  },
};

export const PALETTE = Object.fromEntries(
  Object.values(MATERIALS).map((m) => [m.id, m.color])
);

export function getMaterial(species) {
  return MATERIALS[species] ?? MATERIALS[Species.EMPTY];
}

export function isDenser(a, b) {
  return getMaterial(a).density > getMaterial(b).density;
}
