import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['stone'] };

/**
 * Sandspiel-style stone: falls like sand and sinks through lighter fluids (water, steam).
 * Wall stays static — no rule module.
 */
export const stoneRuleDef = {
  id: 'stone',
  label: 'Stone',
  species: Species.STONE,
  material: MATERIALS[Species.STONE],
  phase: 'materials',
  scanDirection: 'down',
  movement: [
    { op: 'moveDown', if: 'empty' },
    { op: 'swapDenserBelow' },
    { op: 'moveDiagRandom', if: 'empty' },
  ],

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
