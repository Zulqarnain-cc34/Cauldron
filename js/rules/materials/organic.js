import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['organic'] };

/** Sandspiel-style plant: grows toward water, ignites and spreads fire when burning (rb). */
function updateOrganic(cell, api) {
  let rb = cell.rb;
  const [dx, dy] = api.randVec8();
  const nbr = api.get(dx, dy);

  if (rb === 0 && nbr.species === Species.FIRE) {
    api.set(0, 0, { ...cell, rb: 20 });
    return;
  }

  if (rb > 1) {
    api.set(0, 0, { ...cell, rb: rb - 1 });
  } else if (rb === 1) {
    api.clearSelf();
    return;
  }

  if (rb > 1) {
    const spread = api.get(dx, dy);
    if (spread.species === Species.EMPTY) {
      api.set(dx, dy, {
        species: Species.FIRE,
        flags: 0,
        ra: 40 + api.randInt(30),
        rb: 0,
      });
    }
    return;
  }

  if (api.randInt(100) > 80 && nbr.species === Species.WATER) {
    const alt = api.get(-dx, dy);
    if (alt.species === Species.EMPTY || alt.species === Species.WATER) {
      const gx = alt.species === Species.EMPTY ? -dx : dx;
      const gy = dy;
      const spot = api.get(gx, gy);
      if (spot.species === Species.EMPTY) {
        api.set(gx, gy, {
          species: Species.ORGANIC,
          flags: 0,
          ra: cell.ra,
          rb: 0,
        });
      } else if (spot.species === Species.WATER) {
        api.set(gx, gy, { ...cell, rb: 0 });
        api.set(dx, dy, api.world.emptyCell());
      }
    }
  }
}

export const organicRuleDef = {
  id: 'organic',
  label: 'Organic',
  species: Species.ORGANIC,
  material: MATERIALS[Species.ORGANIC],
  phase: 'materials',
  scanDirection: 'down',
  customUpdate: updateOrganic,

  behaviors: [
    {
      id: 'organic-ignite-fire',
      name: 'Ignites when touching fire',
      description: 'Adjacent fire sets rb burn countdown.',
      slice: { rows: ['OF'] },
      expect: ['OF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 7;
      },
    },
    {
      id: 'organic-burns-away',
      name: 'Burns away at end of countdown',
      description: 'rb counts down to 1 → cell clears.',
      slice: { rows: ['O'] },
      expect: ['.'],
      scope: SCOPE,
      steps: 2,
      setup(w) {
        w.set(0, 0, { species: Species.ORGANIC, flags: 0, ra: 128, rb: 2 });
      },
    },
    {
      id: 'organic-spreads-fire-while-burning',
      name: 'Spreads fire while burning',
      description: 'rb > 1 and empty neighbor → spawns fire.',
      slice: { rows: ['O.'] },
      expect: ['OF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 36;
        w.set(0, 0, { species: Species.ORGANIC, flags: 0, ra: 128, rb: 20 });
      },
    },
    {
      id: 'organic-grows-near-water',
      name: 'Grows toward water',
      description: 'Near water + growth roll → new organic cell in empty neighbor.',
      slice: { rows: ['.....', '..OW.', '.....'] },
      expect: ['.....', '.OOW.', '.....'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.randInt = (max) => (max === 8 ? 2 : max === 100 ? 90 : 0);
      },
    },
  ],
};
