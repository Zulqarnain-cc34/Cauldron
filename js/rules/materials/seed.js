import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { fallLikeSand } from '../shared/combust.js';

function updateSeed(cell, api) {
  if (fallLikeSand(cell, api)) return;

  const below = api.get(0, 1);
  if (
    (below.species === Species.SAND ||
      below.species === Species.ORGANIC ||
      below.species === Species.FUNGUS) &&
    api.randInt(100) > 92
  ) {
    api.set(0, 0, {
      species: Species.ORGANIC,
      flags: 0,
      ra: cell.ra,
      rb: 0,
    });
  }
}

const SCOPE = { rules: ['seed'] };

export const seedRuleDef = {
  id: 'seed',
  label: 'Seed',
  species: Species.SEED,
  material: MATERIALS[Species.SEED],
  phase: 'materials',
  customUpdate: updateSeed,
  behaviors: [
    {
      id: 'seed-fall-straight',
      name: 'Falls straight down',
      slice: { rows: ['e', '.'] },
      expect: ['.', 'e'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'seed-germinates-sand',
      name: 'Germinates into plant on sand',
      description: 'Resting on sand with lucky roll → organic.',
      slice: { rows: ['e', 'S'] },
      expect: ['O', 'S'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randInt = (n) => (n === 100 ? 93 : 0);
      },
    },
  ],
};
