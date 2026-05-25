import { MATERIALS } from './materials.js';
import { Tags } from './tags.js';

/**
 * @param {string | string[]} tagOrTags
 * @returns {number[]}
 */
export function getSpeciesByTag(tagOrTags) {
  const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags];
  return Object.values(MATERIALS)
    .filter((m) => tags.every((t) => m.tags?.includes(t)))
    .map((m) => m.id);
}

/** @param {number} species @param {string} tag */
export function materialHasTag(species, tag) {
  return MATERIALS[species]?.tags?.includes(tag) ?? false;
}

/** Burnable species set — shared by reactions, grenade, combust helpers. */
export function getBurnableSpecies() {
  return getSpeciesByTag(Tags.BURNABLE);
}

/** Static / indestructible solids for blast immunity checks. */
export function getBlastImmuneSpecies() {
  return getSpeciesByTag(Tags.STATIC);
}
