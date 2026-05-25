import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['water'] };

export const waterRuleDef = {
  id: 'water',
  label: 'Water',
  species: Species.WATER,
  material: MATERIALS[Species.WATER],
  phase: 'materials',

  behaviors: [
    {
      id: 'water-fall-straight',
      name: 'Falls straight down',
      description: 'Water above empty space moves down one cell.',
      slice: { rows: ['W', '.'] },
      expect: ['.', 'W'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-blocked-below',
      name: 'Stays when blocked below',
      description: 'Wall under water — no movement.',
      slice: { rows: ['W', '#'] },
      expect: ['W', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-fall-two-steps',
      name: 'Falls two cells in two ticks',
      description: 'Keeps falling while empty space is below.',
      slice: { rows: ['W', '.', '.'] },
      expect: ['.', '.', 'W'],
      scope: SCOPE,
      steps: 2,
    },
    {
      id: 'water-rest-on-sand',
      name: 'Rests on denser sand',
      description: 'Less-dense water does not swap through sand below.',
      slice: { rows: ['W', 'S'] },
      expect: ['W', 'S'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-spread-right',
      name: 'Spreads horizontally',
      description: 'On flat floor with empty to the right → flows sideways.',
      slice: { rows: ['.....', '..W..', '#####'] },
      expect: ['.....', '...W.', '#####'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 1;
      },
    },
    {
      id: 'water-spread-left',
      name: 'Spreads left when blocked right',
      description: 'Wall on the right → flows left.',
      slice: { rows: ['.....', '..W#.', '#####'] },
      expect: ['.....', '.W.#.', '#####'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => -1;
      },
    },
    {
      id: 'water-one-cell-per-tick',
      name: 'Moves at most one cell per tick',
      description: 'Tall empty column — one cell per tick.',
      slice: { rows: ['W', '.', '.', '.'] },
      expect: ['.', 'W', '.', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-sinks-steam',
      name: 'Sinks through lighter steam',
      description: 'Denser water swaps with buoyant steam below.',
      slice: { rows: ['W', '^', '.'] },
      expect: ['^', 'W', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-stack-settles',
      name: 'Stack settles one step',
      description: 'Two water cells above empty — both fall one cell.',
      slice: { rows: ['W', 'W', '.'] },
      expect: ['.', 'W', 'W'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-boxed-no-spread',
      name: 'Stays when fully boxed',
      description: 'Surrounded by walls — no horizontal escape.',
      slice: { rows: ['###', '#W#', '###'] },
      expect: ['###', '#W#', '###'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'water-rest-on-stone',
      name: 'Rests on denser stone',
      description: 'Water does not swap through stone below.',
      slice: { rows: ['W', 'T'] },
      expect: ['W', 'T'],
      scope: SCOPE,
      steps: 1,
    },
  ],
};
