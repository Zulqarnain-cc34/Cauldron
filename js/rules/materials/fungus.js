import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { stepCombust } from '../shared/combust.js';

function updateFungus(cell, api) {
  if (stepCombust(cell, api, Species.FUNGUS, { igniteRb: 20, spreadEvery: 3 })) return;

  const [dx, dy] = api.randVec8();
  const nbr = api.get(dx, dy);

  if (api.randInt(100) > 85 && nbr.species === Species.WOOD) {
    for (const [ox, oy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const spot = api.get(ox, oy);
      if (spot.species === Species.EMPTY) {
        api.set(ox, oy, {
          species: Species.FUNGUS,
          flags: 0,
          ra: cell.ra,
          rb: 0,
        });
        return;
      }
    }
  }
}

const SCOPE = { rules: ['fungus'] };

export const fungusRuleDef = {
  id: 'fungus',
  label: 'Fungus',
  species: Species.FUNGUS,
  material: MATERIALS[Species.FUNGUS],
  phase: 'materials',
  customUpdate: updateFungus,
  behaviors: [
    {
      id: 'fungus-ignite-fire',
      name: 'Ignites when touching fire',
      slice: { rows: ['uF'] },
      expect: ['uF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 7;
      },
    },
    {
      id: 'fungus-burns-away',
      name: 'Burns away at end of countdown',
      slice: { rows: ['u'] },
      expect: ['.'],
      scope: SCOPE,
      steps: 2,
      setup(w) {
        w.set(0, 0, { species: Species.FUNGUS, flags: 0, ra: 128, rb: 2 });
      },
    },
    {
      id: 'fungus-grows-on-wood',
      name: 'Spreads into empty cell beside wood',
      slice: { rows: ['Bu.'] },
      expect: ['Buu'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randInt = (n) => (n === 100 ? 90 : n === 8 ? 3 : 0);
      },
    },
  ],
};
