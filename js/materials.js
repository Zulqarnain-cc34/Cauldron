/** Backward-compatible re-exports — prefer js/catalog/* in new code. */
export { Species, SpeciesName, Flags } from './catalog/species.js';
export {
  PALETTE,
  MATERIALS,
  getMaterial,
  isDenser,
  registerMaterial,
} from './catalog/materials.js';
export { Tags } from './catalog/tags.js';
export {
  Mobility,
  GRAVITY,
  scanDirectionFor,
  gravityFor,
} from './catalog/physics.js';

import { Species } from './catalog/species.js';
import { Tags } from './catalog/tags.js';
import { MATERIALS } from './catalog/materials.js';

export const FALLING = new Set(
  Object.values(MATERIALS).filter((m) => m.tags.includes(Tags.FALLING)).map((m) => m.id)
);
export const RISING = new Set(
  Object.values(MATERIALS).filter((m) => m.tags.includes(Tags.RISING)).map((m) => m.id)
);
export const STATIC = new Set(
  Object.values(MATERIALS).filter((m) => m.tags.includes(Tags.STATIC)).map((m) => m.id)
);
