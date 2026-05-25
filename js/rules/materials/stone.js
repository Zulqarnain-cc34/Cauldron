import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['stone'] };

export const stoneRuleDef = {
  id: 'stone',
  label: 'Stone',
  species: Species.STONE,
  material: MATERIALS[Species.STONE],
  phase: 'materials',

  behaviors: [
    {
      id: 'stone-fall-straight',
      name: 'Falls straight down',
      description: 'Stone above empty space moves down one cell.',
      slice: { rows: ['T', '.'] },
      expect: ['.', 'T'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'stone-sinks-water',
      name: 'Sinks through water',
      description: 'Denser stone swaps upward with lighter water below.',
      slice: { rows: ['T', 'W', '.'] },
      expect: ['W', 'T', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'stone-blocked-below',
      name: 'Stays when blocked below',
      description: 'Wall under stone — no movement.',
      slice: { rows: ['T', '#'] },
      expect: ['T', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'stone-on-floor',
      name: 'Does not pass through wall',
      description: 'Stone sitting on wall stays put.',
      slice: { rows: ['.', 'T', '#'] },
      expect: ['.', 'T', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'stone-stack-settles',
      name: 'Stack settles one step',
      description: 'Two stones above empty — both fall one cell.',
      slice: { rows: ['T', 'T', '.'] },
      expect: ['.', 'T', 'T'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'stone-diagonal-right',
      name: 'Slides down-right',
      description: 'Blocked below; randDir forced right → down-right empty cell.',
      slice: { rows: ['..T..', '..#..', '..#..'] },
      expect: ['.....', '..#T.', '..#..'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 1;
      },
    },
  ],
};
