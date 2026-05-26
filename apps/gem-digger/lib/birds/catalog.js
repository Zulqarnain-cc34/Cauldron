/** @typedef {'sparrow' | 'eagle' | 'finch'} BirdKind */

/**
 * @typedef {object} BirdKindDef
 * @property {BirdKind} id
 * @property {string} label
 * @property {number} size display triangle scale (grid pixels)
 * @property {number} maxSpeed
 * @property {number} maxForce
 * @property {[number, number, number, number]} color rgba
 */

/** @type {Record<BirdKind, BirdKindDef>} */
export const BIRD_KINDS = {
  sparrow: {
    id: 'sparrow',
    label: 'Sparrow',
    size: 5,
    maxSpeed: 1.35,
    maxForce: 0.055,
    color: [140, 120, 90, 230],
  },
  eagle: {
    id: 'eagle',
    label: 'Eagle',
    size: 8,
    maxSpeed: 1.05,
    maxForce: 0.04,
    color: [70, 55, 40, 240],
  },
  finch: {
    id: 'finch',
    label: 'Finch',
    size: 4.5,
    maxSpeed: 1.5,
    maxForce: 0.06,
    color: [90, 180, 70, 230],
  },
};

/** @param {BirdKind} kind */
export function getBirdKindDef(kind) {
  return BIRD_KINDS[kind] ?? BIRD_KINDS.sparrow;
}
