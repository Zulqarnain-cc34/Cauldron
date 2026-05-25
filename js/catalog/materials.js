import { Species } from './species.js';
import { Tags } from './tags.js';
import { Mobility } from './physics.js';

/**
 * @typedef {import('./physics.js').MaterialPhysics} MaterialPhysics
 *
 * @typedef {Object} MaterialDef
 * @property {number} id
 * @property {string} name
 * @property {'solid'|'liquid'|'gas'} phase — rendering / broad category
 * @property {import('./physics.js').Mobility} mobility — drives shared physics code path
 * @property {number} density — relative to water = 1.0 (real-world inspired)
 * @property {string[]} tags
 * @property {[number,number,number]} color
 * @property {string} [ascii]
 * @property {boolean} [sinkThroughLighter]
 * @property {boolean} [spreadBlockSame]
 * @property {number} [thermalDecay]
 * @property {number} [condenseAt]
 */

/**
 * Material catalog — data only. Behavior comes from mobility + density via material-physics.
 * Real density ratios (water≈1000 kg/m³ as 1.0): sand≈1.6, granite≈2.7, steam≪1.
 *
 * @type {Record<number, MaterialDef>}
 */
export const MATERIALS = {
  [Species.EMPTY]: {
    id: Species.EMPTY,
    name: 'empty',
    phase: 'solid',
    mobility: Mobility.STATIC,
    density: 0,
    tags: [],
    color: [8, 8, 14],
    ascii: '.',
  },
  [Species.WALL]: {
    id: Species.WALL,
    name: 'wall',
    phase: 'solid',
    mobility: Mobility.STATIC,
    density: 999,
    tags: [Tags.STATIC, Tags.SOLID],
    color: [42, 42, 52],
    ascii: '#',
  },
  [Species.SAND]: {
    id: Species.SAND,
    name: 'sand',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 1.6,
    sinkThroughLighter: false,
    tags: [Tags.SOLID, Tags.GRANULAR, Tags.FALLING],
    color: [220, 180, 60],
    ascii: 'S',
  },
  [Species.WATER]: {
    id: Species.WATER,
    name: 'water',
    phase: 'liquid',
    mobility: Mobility.FLUID,
    density: 1.0,
    spreadBlockSame: true,
    tags: [Tags.LIQUID, Tags.FALLING],
    color: [40, 120, 220],
    ascii: 'W',
  },
  [Species.STONE]: {
    id: Species.STONE,
    name: 'stone',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 2.7,
    sinkThroughLighter: true,
    tags: [Tags.SOLID, Tags.GRANULAR, Tags.FALLING],
    color: [90, 90, 100],
    ascii: 'T',
  },
  [Species.FIRE]: {
    id: Species.FIRE,
    name: 'fire',
    phase: 'gas',
    mobility: Mobility.PLASMA,
    density: 0,
    tags: [Tags.GAS, Tags.RISING, Tags.HOT],
    color: [255, 120, 40],
    ascii: 'F',
  },
  [Species.ORGANIC]: {
    id: Species.ORGANIC,
    name: 'organic',
    phase: 'solid',
    mobility: Mobility.LIFE,
    density: 0.9,
    tags: [Tags.SOLID, Tags.BURNABLE],
    color: [50, 160, 70],
    ascii: 'O',
  },
  [Species.STEAM]: {
    id: Species.STEAM,
    name: 'steam',
    phase: 'gas',
    mobility: Mobility.BUOYANT,
    density: 0.001,
    thermalDecay: 1,
    condenseAt: 10,
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

/** @param {number} a species id @param {number} b species id */
export function isDenser(a, b) {
  return getMaterial(a).density > getMaterial(b).density;
}

/**
 * Register a new material at runtime (future data packs / mods).
 * @param {MaterialDef} def
 */
export function registerMaterial(def) {
  if (MATERIALS[def.id]) {
    throw new Error(`Material id ${def.id} already registered`);
  }
  MATERIALS[def.id] = def;
}
