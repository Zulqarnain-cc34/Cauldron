import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['dust'] };

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
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'dust-blocked-below',
      name: 'Stays when blocked below',
      slice: { rows: ['d', '#'] },
      expect: ['d', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'dust-floats-on-water',
      name: 'Rests above water',
      description: 'Lighter than water — stays on top.',
      slice: { rows: ['d', 'W'] },
      expect: ['d', 'W'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'dust-diagonal-right',
      name: 'Slides down-right when blocked below',
      description: 'Blocked below; randDir forced right → down-right empty cell.',
      slice: { rows: ['..d..', '..#..', '..#..'] },
      expect: ['.....', '..#d.', '..#..'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 1;
      },
    },
  ],
};
