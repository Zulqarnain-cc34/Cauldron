import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

/** Motion from catalog mobility (fluid). Tests added later. */
export const waterRuleDef = {
  id: 'water',
  label: 'Water',
  species: Species.WATER,
  material: MATERIALS[Species.WATER],
  phase: 'materials',
  behaviors: [],
};
