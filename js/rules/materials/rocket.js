import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { fallLikeSand } from '../shared/combust.js';
import { tryMoveDown } from '../../engine/primitives.js';

function updateRocket(cell, api) {
  if (tryMoveDown(cell, api)) {
    api.set(0, 0, {
      species: Species.SAND,
      flags: 0,
      ra: api.randInt(255),
      rb: 0,
    });
    return;
  }
  fallLikeSand(cell, api);
}

export const rocketRuleDef = {
  id: 'rocket',
  label: 'Rocket',
  species: Species.ROCKET,
  material: MATERIALS[Species.ROCKET],
  phase: 'materials',
  customUpdate: updateRocket,
  behaviors: [
    {
      id: 'rocket-fall-straight',
      name: 'Falls straight down leaving sand',
      description: 'Rocket moves down and leaves a sand grain behind (Sandspiel-style exhaust).',
      slice: { rows: ['R', '.'] },
      expect: ['S', 'R'],
      scope: { rules: ['rocket'] },
      steps: 1,
    },
  ],
};
