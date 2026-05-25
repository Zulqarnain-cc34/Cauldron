import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { riseLikeGas } from '../shared/combust.js';

const SCOPE = { rules: ['gas'] };

export const gasRuleDef = {
  id: 'gas',
  label: 'Gas',
  species: Species.GAS,
  material: MATERIALS[Species.GAS],
  phase: 'materials',
  customUpdate: (cell, api) => riseLikeGas(cell, api),
  behaviors: [
    {
      id: 'gas-rise-straight',
      name: 'Rises straight up',
      slice: { rows: ['.', 'g'] },
      expect: ['g', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'gas-blocked-above',
      name: 'Stays when blocked above',
      slice: { rows: ['#', 'g'] },
      expect: ['#', 'g'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'gas-diagonal-up-left',
      name: 'Rises diagonally when blocked straight',
      slice: { rows: ['..#..', '..g..', '.....'] },
      expect: ['.g#..', '.....', '.....'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => -1;
      },
    },
    {
      id: 'gas-one-cell-per-tick',
      name: 'Moves at most one cell per tick',
      slice: { rows: ['.', '.', '.', 'g'] },
      expect: ['.', '.', 'g', '.'],
      scope: SCOPE,
      steps: 1,
    },
  ],
};
