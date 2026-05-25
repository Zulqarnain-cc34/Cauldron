import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['stone'] };

/** Motion from catalog mobility (granular + sinkThroughLighter). */
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
  ],
};
