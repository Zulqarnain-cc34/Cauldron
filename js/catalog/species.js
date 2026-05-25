/** Species ids — one byte per cell. */
export const Species = {
  EMPTY: 0,
  WALL: 1,
  SAND: 2,
  WATER: 3,
  STONE: 4,
  FIRE: 5,
  ORGANIC: 6,
  STEAM: 7,
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
