import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { wrapFluidUpdate } from '../shared/combust.js';

function updateOil(cell, api) {
  const wrapped = wrapFluidUpdate(Species.OIL);
  if (cell.rb === 0) {
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const hot = api.get(dx, dy).species;
      if (hot === Species.FIRE || hot === Species.LAVA) {
        api.set(0, 0, { ...cell, rb: 50 });
        return;
      }
    }
  }
  const [dx, dy] = api.randVec8();
  const nbr = api.get(dx, dy);
  if (cell.rb > 1) {
    api.set(0, 0, { ...cell, rb: cell.rb - 1 });
    if (cell.rb % 4 !== 0 && nbr.species === Species.EMPTY) {
      api.set(dx, dy, { species: Species.FIRE, flags: 0, ra: 40 + api.randInt(30), rb: 0 });
    }
    return;
  }
  if (cell.rb === 1) {
    api.clearSelf();
    return;
  }
  wrapped(cell, api);
}

const SCOPE = { rules: ['oil'] };

export const oilRuleDef = {
  id: 'oil',
  label: 'Oil',
  species: Species.OIL,
  material: MATERIALS[Species.OIL],
  phase: 'materials',
  customUpdate: updateOil,
  behaviors: [
    {
      id: 'oil-floats-water',
      name: 'Rests above water',
      description: 'Less dense than water — does not sink through water below.',
      slice: { rows: ['l', 'W'] },
      expect: ['l', 'W'],
      scope: SCOPE,
      steps: 1,
    },
    {
      id: 'oil-ignite-lava',
      name: 'Ignites when touching lava',
      slice: { rows: ['lV'] },
      expect: ['lV'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 7;
        w.randInt = (n) => (n === 8 ? 0 : 0);
      },
    },
    {
      id: 'oil-burns-away',
      name: 'Burns away at end of countdown',
      slice: { rows: ['l'] },
      expect: ['.'],
      scope: SCOPE,
      steps: 2,
      setup(w) {
        w.set(0, 0, { species: Species.OIL, flags: 0, ra: 128, rb: 2 });
      },
    },
    {
      id: 'oil-spreads-fire',
      name: 'Spreads fire while burning',
      slice: { rows: ['l.'] },
      expect: ['lF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 36;
        w.set(0, 0, { species: Species.OIL, flags: 0, ra: 128, rb: 5 });
      },
    },
  ],
};
