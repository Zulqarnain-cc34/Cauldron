/**
 * Single bird appearance + physics profile (no species/kinds).
 */

/**
 * @typedef {object} BirdDef
 * @property {number} size display triangle scale (grid pixels)
 * @property {number} maxSpeed
 * @property {number} maxForce
 * @property {[number, number, number, number]} color rgba
 */

/** @type {BirdDef} */
export const BIRD_DEF = {
  size: 5,
  maxSpeed: 1.35,
  maxForce: 0.055,
  color: [140, 150, 180, 230],
};

export function getBirdDef() {
  return BIRD_DEF;
}
