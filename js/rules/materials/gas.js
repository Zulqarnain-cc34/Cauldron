import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

export const gasRuleDef = {
  id: 'gas',
  label: 'Gas',
  species: Species.GAS,
  material: MATERIALS[Species.GAS],
  phase: 'materials',
  behaviors: [
    {
      id: 'gas-rise-straight',
      name: 'Rises straight up',
      slice: { rows: ['.', 'g'] },
      expect: ['g', '.'],
      scope: { rules: ['gas'] },
      steps: 1,
    },
  ],
};
