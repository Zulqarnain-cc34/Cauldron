import { Species } from '../../../../js/catalog/species.js';
import { getMaterial } from '../../../../js/catalog/materials.js';

/** @typedef {'material' | 'tool' | 'gem'} ItemKind */

/**
 * @typedef {object} ItemDef
 * @property {string} id
 * @property {string} label
 * @property {ItemKind} kind
 * @property {number} stackSize
 * @property {number} [species] material species id
 * @property {string} [icon] image path for tools / custom icons
 */

import { assetIcon } from '../config.js';

/** Demo icon paths (Gem Digger app). Override catalog in your own game content. */

/** @type {Record<string, ItemDef>} */
export const ITEM_CATALOG = {
  sand: {
    id: 'sand',
    label: 'Sand',
    kind: 'material',
    species: Species.SAND,
    stackSize: 64,
  },
  water: {
    id: 'water',
    label: 'Water',
    kind: 'material',
    species: Species.WATER,
    stackSize: 64,
  },
  stone: {
    id: 'stone',
    label: 'Stone',
    kind: 'material',
    species: Species.STONE,
    stackSize: 64,
  },
  grenade: {
    id: 'grenade',
    label: 'Grenade',
    kind: 'tool',
    stackSize: 16,
    icon: assetIcon('grenade'),
  },
  diamond: {
    id: 'diamond',
    label: 'Diamond',
    kind: 'gem',
    stackSize: 99,
    icon: assetIcon('diamond'),
  },
  topaz: {
    id: 'topaz',
    label: 'Topaz',
    kind: 'gem',
    stackSize: 99,
    icon: assetIcon('topaz'),
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby',
    kind: 'gem',
    stackSize: 99,
    icon: assetIcon('ruby'),
  },
};

/** All gemstone item ids (world pickups + inventory). */
export const GEM_ITEM_IDS = ['diamond', 'topaz', 'ruby'];

/** @param {string} itemId */
export function getItemDef(itemId) {
  return ITEM_CATALOG[itemId] ?? null;
}

/** @param {string} itemId @param {number} [count] */
export function createStack(itemId, count = 1) {
  const def = getItemDef(itemId);
  if (!def) return null;
  return { itemId, count: Math.max(1, count), label: def.label };
}

/** @param {number} species */
export function itemIdForSpecies(species) {
  for (const def of Object.values(ITEM_CATALOG)) {
    if (def.kind === 'material' && def.species === species) return def.id;
  }
  return null;
}

/**
 * @param {ItemDef} def
 * @returns {string | null} css rgb() for material swatches
 */
export function itemSwatchColor(def) {
  if (def.species == null) return null;
  const [r, g, b] = getMaterial(def.species).color;
  return `rgb(${r}, ${g}, ${b})`;
}

/** @param {string} itemId */
export function isStorableItem(itemId) {
  return itemId in ITEM_CATALOG;
}

/** @param {string} itemId */
export function isGemItem(itemId) {
  return getItemDef(itemId)?.kind === 'gem';
}
