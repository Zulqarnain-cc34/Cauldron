import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

export const dustRuleDef = {
  id: 'dust',
  label: 'Dust',
  species: Species.DUST,
  material: MATERIALS[Species.DUST],
  phase: 'materials',
  behaviors: [
    {
      id: 'dust-fall-straight',
      name: 'Falls straight down',
      slice: { rows: ['d', '.'] },
      expect: ['.', 'd'],
      scope: { rules: ['dust'] },
      steps: 1,
    },
  ],
};
