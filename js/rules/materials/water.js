import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import {
  tryMoveDown,
  trySwapWithDenserBelow,
  trySpreadHorizontal,
} from '../../engine/primitives.js';

function updateWater(cell, api) {
  if (tryMoveDown(cell, api)) return;
  if (trySwapWithDenserBelow(cell, api)) return;
  trySpreadHorizontal(cell, api, Species.WATER);
}

/** Custom update — flow memory via rb; behaviors added later. */
export const waterRuleDef = {
  id: 'water',
  label: 'Water',
  species: Species.WATER,
  material: MATERIALS[Species.WATER],
  phase: 'materials',
  scanDirection: 'down',
  customUpdate: updateWater,
  behaviors: [],
};
