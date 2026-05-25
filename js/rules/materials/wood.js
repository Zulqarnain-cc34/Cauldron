import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { stepCombust } from '../shared/combust.js';

function updateWood(cell, api) {
  if (stepCombust(cell, api, Species.WOOD, { igniteRb: 90, spreadEvery: 4 })) return;
}

const SCOPE = { rules: ['wood'] };

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
      description: 'Burn timer rb starts; cell tints ember while species stays wood.',
      slice: { rows: ['BF'] },
      expect: ['BF'],
      scope: SCOPE,
      steps: 1,
      inspect(w) {
        if (w.get(0, 0).rb <= 1) {
          throw new Error(`expected wood rb > 1 after ignite, got ${w.get(0, 0).rb}`);
        }
      },
    },
    {
      id: 'wood-burns-away',
      name: 'Burns away at end of countdown',
      description: 'rb counts down to 1 → cell clears.',
      slice: { rows: ['B'] },
      expect: ['.'],
      scope: SCOPE,
      steps: 2,
      setup(w) {
        w.set(0, 0, { species: Species.WOOD, flags: 0, ra: 128, rb: 2 });
      },
    },
    {
      id: 'wood-spreads-fire',
      name: 'Spreads fire while burning',
      description: 'rb divisible by spreadEvery → spawns fire in empty neighbor.',
      slice: { rows: ['B.'] },
      expect: ['BF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 36;
        w.set(0, 0, { species: Species.WOOD, flags: 0, ra: 128, rb: 4 });
      },
    },
  ],
};
