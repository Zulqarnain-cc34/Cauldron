import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { stepCombust } from '../shared/combust.js';

function updateFungus(cell, api) {
  if (stepCombust(cell, api, Species.FUNGUS, { igniteRb: 20, spreadEvery: 3 })) return;

  const [dx, dy] = api.randVec8();
  const nbr = api.get(dx, dy);

  if (api.randInt(100) > 85 && nbr.species === Species.WOOD) {
    const spot = api.get(dx, dy);
    if (spot.species === Species.EMPTY) {
      api.set(dx, dy, {
        species: Species.FUNGUS,
        flags: 0,
        ra: cell.ra,
        rb: 0,
      });
    }
  }
}

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
      scope: { rules: ['fungus'] },
      steps: 1,
      setup(w) {
        w.seed = 7;
      },
    },
  ],
};
