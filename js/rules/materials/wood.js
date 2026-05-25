import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { stepCombust } from '../shared/combust.js';

function updateWood(cell, api) {
  if (stepCombust(cell, api, Species.WOOD, { igniteRb: 90, spreadEvery: 4 })) return;
}

export const woodRuleDef = {
  id: 'wood',
  label: 'Wood',
  species: Species.WOOD,
  material: MATERIALS[Species.WOOD],
  phase: 'materials',
  customUpdate: updateWood,
  behaviors: [
    {
      id: 'wood-ignite-fire',
      name: 'Ignites when touching fire',
      slice: { rows: ['BF'] },
      expect: ['BF'],
      scope: { rules: ['wood'] },
      steps: 1,
      setup(w) {
        w.seed = 7;
      },
    },
  ],
};
