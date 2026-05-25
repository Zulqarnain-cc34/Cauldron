import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

/** Tests run with only this rule active — same scope for headless + live demo. */
const SCOPE = { rules: ['sand'] };

/**
 * Sand — tests + catalog registration. Motion from catalog mobility (granular).
 */
export const sandRuleDef = {
  id: 'sand',
  label: 'Sand',
  species: Species.SAND,
  material: MATERIALS[Species.SAND],
  phase: 'materials',

  behaviors: [
    {
      id: 'sand-fall-straight',
      name: 'Falls straight down',
      description: 'One grain above empty space moves down one cell.',
      slice: { rows: ['S', '.'] },
      expect: ['.', 'S'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-blocked-below',
      name: 'Stays when blocked below',
      description: 'Wall under sand — no escape, grain stays.',
      slice: { rows: ['S', '#'] },
      expect: ['S', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-stack-settles',
      name: 'Stack settles one step',
      description: 'Two grains above empty — both fall one cell.',
      slice: { rows: ['S', 'S', '.'] },
      expect: ['.', 'S', 'S'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-on-floor',
      name: 'Does not pass through wall',
      description: 'Sand sitting on wall stays put.',
      slice: { rows: ['.', 'S', '#'] },
      expect: ['.', 'S', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-fall-two-steps',
      name: 'Falls two cells in two ticks',
      description: 'Keeps falling while empty space is below.',
      slice: { rows: ['S', '.', '.'] },
      expect: ['.', '.', 'S'],
      scope: SCOPE,
      steps: 2,
    },
    {
      id: 'sand-diagonal-left',
      name: 'Slides down-left',
      description: 'Blocked below; randDir forced left → down-left empty cell.',
      slice: { rows: ['..S..', '..#..', '..#..'] },
      expect: ['.....', '.S#..', '..#..'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => -1;
      },
    },
    {
      id: 'sand-diagonal-right',
      name: 'Slides down-right',
      description: 'Blocked below; randDir forced right → down-right empty cell.',
      slice: { rows: ['..S..', '..#..', '..#..'] },
      expect: ['.....', '..#S.', '..#..'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 1;
      },
    },
    {
      id: 'sand-diagonal-blocked-no-retry',
      name: 'Stays when chosen diagonal is blocked',
      description: 'One random try per tick — open other diagonal is not attempted.',
      slice: { rows: ['..S..', '.##..', '.....'] },
      expect: ['..S..', '.##..', '.....'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => -1;
      },
    },
    {
      id: 'sand-no-move-rand-zero',
      name: 'Stays when rand picks straight (0)',
      description: 'randDir=0 checks down-diagonal only — still blocked.',
      slice: { rows: ['S', '#', '.'] },
      expect: ['S', '#', '.'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randDir = () => 0;
      },
    },
    {
      id: 'sand-one-cell-per-tick',
      name: 'Moves at most one cell per tick',
      description: 'Tall empty column — one cell per tick, not teleport to bottom.',
      slice: { rows: ['S', '.', '.', '.'] },
      expect: ['.', 'S', '.', '.'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-on-sand-on-wall',
      name: 'Stack on wall with no gap stays put',
      description: 'Sand on sand on wall — no empty cell, nothing moves.',
      slice: { rows: ['S', 'S', '#'] },
      expect: ['S', 'S', '#'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-flat-floor-center',
      name: 'Rests on flat floor without sliding',
      description: 'Centered on floor — diagonals blocked, stays put.',
      slice: { rows: ['...', '.S.', '###'] },
      expect: ['...', '.S.', '###'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-three-stack-settles',
      name: 'Three-grain stack settles one step',
      description: 'Bottom-up scan: stack drops one cell when space below.',
      slice: { rows: ['S', 'S', 'S', '.'] },
      expect: ['.', 'S', 'S', 'S'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'sand-rest-on-water',
      name: 'Rests on water without sinking',
      description: 'Granular sand has sinkThroughLighter off — floats on water surface.',
      slice: { rows: ['S', 'W'] },
      expect: ['S', 'W'],
      scope: SCOPE,
      steps: 1,
    },
  ],
};
