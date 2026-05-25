import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['steam'] };

export const steamRuleDef = {
  id: 'steam',
  label: 'Steam',
  species: Species.STEAM,
  material: MATERIALS[Species.STEAM],
  phase: 'materials',
  enabledKey: 'water',

  behaviors: [
    {
      id: 'steam-rise-straight',
      name: 'Rises straight up',
      description: 'Empty above → move up one cell.',
      slice: { rows: ['.', '^'] },
      expect: ['^', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'steam-blocked-above',
      name: 'Stays when blocked above',
      description: 'Wall above — cannot rise.',
      slice: { rows: ['#', '^'] },
      expect: ['#', '^'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'steam-rise-two-steps',
      name: 'Rises two cells in two ticks',
      description: 'Keeps rising while empty space is above.',
      slice: { rows: ['.', '.', '^'] },
      expect: ['^', '.', '.'],
      scope: SCOPE,
      steps: 2,
    },
    {
      id: 'steam-diagonal-up-right',
      name: 'Rises diagonally up-right',
      description: 'Blocked straight up; randDir right → up-right empty cell.',
      slice: { rows: ['..#..', '..^..', '.....'] },
      expect: ['..#^.', '.....', '.....'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 1;
      },
    },
  ],
};
