import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { fallLikeSand } from '../shared/combust.js';

const CARDINAL = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

function updateLava(cell, api) {
  for (const [dx, dy] of CARDINAL) {
    const target = api.get(dx, dy);
    if (target.species === Species.WATER) {
      api.set(0, 0, {
        species: Species.STONE,
        flags: 0,
        ra: cell.ra,
        rb: 0,
      });
      api.set(dx, dy, api.world.emptyCell());
      return;
    }
  }

  const [dx, dy] = api.randVec8();
  const target = api.get(dx, dy);

  if (target.species === Species.GAS || target.species === Species.DUST) {
    api.set(dx, dy, {
      species: Species.FIRE,
      flags: 0,
      ra: 150,
      rb: 0,
    });
  }

  fallLikeSand(cell, api);
}

export const lavaRuleDef = {
  id: 'lava',
  label: 'Lava',
  species: Species.LAVA,
  material: MATERIALS[Species.LAVA],
  phase: 'materials',
  customUpdate: updateLava,
  behaviors: [
    {
      id: 'lava-water-stone',
      name: 'Water contact becomes stone',
      slice: { rows: ['VW'] },
      expect: ['T.'],
      scope: { rules: ['lava'] },
      steps: 1,
      setup(w) {
        w.seed = 0;
      },
    },
    {
      id: 'lava-falls',
      name: 'Falls when space below',
      slice: { rows: ['V', '.'] },
      expect: ['.', 'V'],
      scope: { rules: ['lava'] },
      steps: 1,
    },
    {
      id: 'lava-ignites-gas',
      name: 'Ignites adjacent gas',
      slice: { rows: ['gV'] },
      expect: ['FV'],
      scope: { rules: ['lava'] },
      steps: 1,
      setup(w) {
        w.randInt = (n) => (n === 8 ? 3 : 0);
      },
    },
  ],
};
