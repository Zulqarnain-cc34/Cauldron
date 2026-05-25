import { Species } from './species.js';
import { Mobility } from './physics.js';

/**
 * Full material catalog — Sandspiel-aligned element set.
 * @type {Record<number, import('./materials.js').MaterialDef>}
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
    tags: ['static', 'solid'],
    color: [42, 42, 52],
    ascii: '#',
  },
  [Species.SAND]: {
    id: Species.SAND,
    name: 'sand',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 1.6,
    sinkThroughLighter: true,
    tags: ['solid', 'granular', 'falling'],
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
    tags: ['liquid', 'falling'],
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
    tags: ['solid', 'granular', 'falling'],
    color: [90, 90, 100],
    ascii: 'T',
  },
  [Species.FIRE]: {
    id: Species.FIRE,
    name: 'fire',
    phase: 'gas',
    mobility: Mobility.PLASMA,
    density: 0,
    tags: ['gas', 'rising', 'hot'],
    color: [255, 120, 40],
    ascii: 'F',
  },
  [Species.ORGANIC]: {
    id: Species.ORGANIC,
    name: 'plant',
    phase: 'solid',
    mobility: Mobility.LIFE,
    density: 0.9,
    tags: ['solid', 'burnable'],
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
    tags: ['gas', 'rising'],
    color: [180, 200, 220],
    ascii: '^',
  },
  [Species.DUST]: {
    id: Species.DUST,
    name: 'dust',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 0.3,
    sinkThroughLighter: true,
    tags: ['granular', 'falling', 'burnable'],
    color: [200, 170, 140],
    ascii: 'd',
  },
  [Species.OIL]: {
    id: Species.OIL,
    name: 'oil',
    phase: 'liquid',
    mobility: Mobility.FLUID,
    density: 0.85,
    spreadBlockSame: true,
    tags: ['liquid', 'falling', 'burnable'],
    color: [30, 20, 10],
    ascii: 'l',
  },
  [Species.GAS]: {
    id: Species.GAS,
    name: 'gas',
    phase: 'gas',
    mobility: Mobility.BUOYANT,
    density: 0.0005,
    thermalDecay: 1,
    condenseAt: 5,
    tags: ['gas', 'rising'],
    color: [120, 120, 130],
    ascii: 'g',
  },
  [Species.ICE]: {
    id: Species.ICE,
    name: 'ice',
    phase: 'solid',
    mobility: Mobility.STATIC,
    density: 0.95,
    tags: ['solid', 'static'],
    color: [180, 220, 255],
    ascii: 'I',
  },
  [Species.LAVA]: {
    id: Species.LAVA,
    name: 'lava',
    phase: 'liquid',
    mobility: Mobility.PLASMA,
    density: 2.5,
    tags: ['liquid', 'hot', 'falling'],
    color: [255, 60, 20],
    ascii: 'V',
  },
  [Species.WOOD]: {
    id: Species.WOOD,
    name: 'wood',
    phase: 'solid',
    mobility: Mobility.LIFE,
    density: 0.7,
    tags: ['solid', 'burnable'],
    color: [120, 80, 40],
    ascii: 'B',
  },
  [Species.ACID]: {
    id: Species.ACID,
    name: 'acid',
    phase: 'liquid',
    mobility: Mobility.FLUID,
    density: 1.2,
    spreadBlockSame: false,
    tags: ['liquid', 'falling'],
    color: [140, 255, 80],
    ascii: 'A',
  },
  [Species.SEED]: {
    id: Species.SEED,
    name: 'seed',
    phase: 'solid',
    mobility: Mobility.LIFE,
    density: 1.1,
    sinkThroughLighter: true,
    tags: ['granular', 'falling', 'burnable'],
    color: [90, 130, 50],
    ascii: 'e',
  },
  [Species.FUNGUS]: {
    id: Species.FUNGUS,
    name: 'fungus',
    phase: 'solid',
    mobility: Mobility.LIFE,
    density: 0.85,
    tags: ['solid', 'burnable'],
    color: [160, 100, 180],
    ascii: 'u',
  },
  [Species.ROCKET]: {
    id: Species.ROCKET,
    name: 'rocket',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 1.8,
    sinkThroughLighter: true,
    tags: ['granular', 'falling'],
    color: [255, 255, 255],
    ascii: 'R',
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

export function registerMaterial(def) {
  if (MATERIALS[def.id]) {
    throw new Error(`Material id ${def.id} already registered`);
  }
  MATERIALS[def.id] = def;
  PALETTE[def.id] = def.color;
}

/** All paintable brush species (excluding empty/wall optional). */
export function getBrushMaterials() {
  return Object.values(MATERIALS).filter(
    (m) => m.id !== Species.EMPTY && m.ascii
  );
}
