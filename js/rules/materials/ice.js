import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const CARDINAL = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

function updateIce(cell, api) {
  for (const [dx, dy] of CARDINAL) {
    const nbr = api.get(dx, dy);
    if (nbr.species === Species.FIRE || nbr.species === Species.LAVA) {
      api.set(0, 0, {
        species: Species.WATER,
        flags: 0,
        ra: cell.ra,
        rb: 0,
      });
      return;
    }
  }

  const [dx, dy] = CARDINAL[api.randInt(4)];
  const nbr = api.get(dx, dy);
  if (nbr.species === Species.WATER && api.randInt(100) < 7) {
    api.set(dx, dy, {
      species: Species.ICE,
      flags: 0,
      ra: cell.ra,
      rb: 0,
    });
  }
}

export const iceRuleDef = {
  id: 'ice',
  label: 'Ice',
  species: Species.ICE,
  material: MATERIALS[Species.ICE],
  phase: 'materials',
  customUpdate: updateIce,
  behaviors: [
    {
      id: 'ice-melts-fire',
      name: 'Melts into water near fire',
      slice: { rows: ['IF'] },
      expect: ['WF'],
      scope: { rules: ['ice'] },
      steps: 1,
      setup(w) {
        w.seed = 0;
      },
    },
    {
      id: 'ice-static',
      name: 'Does not fall',
      description: 'Static solid — stays when empty below.',
      slice: { rows: ['I', '.'] },
      expect: ['I', '.'],
      scope: { rules: ['ice'] },
      steps: 1,
    },
    {
      id: 'ice-freezes-water',
      name: 'Freezes adjacent water',
      slice: { rows: ['IW'] },
      expect: ['II'],
      scope: { rules: ['ice'] },
      steps: 1,
      setup(w) {
        w.randInt = (n) => (n === 4 ? 2 : 0);
      },
    },
  ],
};
