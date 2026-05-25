/** Species ids — one byte per cell. Aligned with Sandspiel element set where possible. */
export const Species = {
  EMPTY: 0,
  WALL: 1,
  SAND: 2,
  WATER: 3,
  STONE: 4,
  FIRE: 5,
  ORGANIC: 6, // Sandspiel Plant
  STEAM: 7,
  DUST: 8,
  OIL: 9,
  GAS: 10, // Sandspiel smoke / gas
  ICE: 11,
  LAVA: 12,
  WOOD: 13,
  ACID: 14,
  SEED: 15,
  FUNGUS: 16,
  ROCKET: 18,
};

export const SpeciesName = Object.fromEntries(
  Object.entries(Species).map(([k, v]) => [v, k.toLowerCase()])
);

export const Flags = {
  NONE: 0,
  HOT: 1 << 0,
  WET: 1 << 1,
  ORGANIC: 1 << 2,
};

/** Sandspiel element names for UI / docs. */
export const SANDSPIEL_MAP = {
  [Species.SAND]: 'Sand',
  [Species.DUST]: 'Dust',
  [Species.WATER]: 'Water',
  [Species.STONE]: 'Stone',
  [Species.GAS]: 'Gas',
  [Species.FIRE]: 'Fire',
  [Species.WOOD]: 'Wood',
  [Species.LAVA]: 'Lava',
  [Species.ICE]: 'Ice',
  [Species.ORGANIC]: 'Plant',
  [Species.ACID]: 'Acid',
  [Species.OIL]: 'Oil',
  [Species.FUNGUS]: 'Fungus',
  [Species.SEED]: 'Seed',
  [Species.ROCKET]: 'Rocket',
  [Species.STEAM]: 'Steam',
};
