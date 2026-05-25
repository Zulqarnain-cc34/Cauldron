import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { tryMoveUp, tryDiagRandom } from '../../engine/primitives.js';

const SCOPE = { rules: ['steam'] };

/** Rises like gas; ra cools until it fades (Sandspiel gas-style decay). */
function updateSteam(cell, api) {
  if (tryMoveUp(cell, api)) return;
  if (tryDiagRandom(cell, api, -1)) return;

  const ra = cell.ra;
  if (ra <= 10 && api.randInt(100) > 70) {
    api.clearSelf();
    return;
  }
  if (ra > 0) {
    api.set(0, 0, { ...cell, ra: ra - 1 });
  }
}

export const steamRuleDef = {
  id: 'steam',
  label: 'Steam',
  species: Species.STEAM,
  material: MATERIALS[Species.STEAM],
  phase: 'materials',
  scanDirection: 'up',
  enabledKey: 'water',
  customUpdate: updateSteam,

  behaviors: [
    {
      id: 'steam-rise-straight',
      name: 'Rises straight up',
      description: 'Empty above → move up one cell.',
      slice: { rows: ['.', '^'] },
      expect: ['^', '.'],
      scope: SCOPE,
      steps: 1,
    },
  ],
};
