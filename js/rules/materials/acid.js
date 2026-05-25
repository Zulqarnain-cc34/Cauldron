import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';
import { isEmpty } from '../../engine/primitives.js';

function updateAcid(cell, api) {
  const ra = cell.ra;
  let degraded = { ...cell, ra: Math.max(0, ra - 60) };
  if (degraded.ra < 80) degraded = api.world.emptyCell();

  const dx = api.randDir() || 1;

  if (isEmpty(api.get(0, 1))) {
    api.moveSelf(0, 1, cell);
    return;
  }
  if (isEmpty(api.get(dx, 0))) {
    api.moveSelf(dx, 0, cell);
    return;
  }
  if (isEmpty(api.get(-dx, 0))) {
    api.moveSelf(-dx, 0, cell);
    return;
  }

  for (const [ox, oy] of [
    [0, 1],
    [dx, 0],
    [-dx, 0],
    [0, -1],
  ]) {
    const n = api.get(ox, oy);
    if (n.species === Species.EMPTY || n.species === Species.WALL || n.species === Species.ACID) continue;
    api.set(ox, oy, degraded);
    api.clearSelf();
    return;
  }

  api.set(0, 0, cell);
}

export const acidRuleDef = {
  id: 'acid',
  label: 'Acid',
  species: Species.ACID,
  material: MATERIALS[Species.ACID],
  phase: 'materials',
  customUpdate: updateAcid,
  behaviors: [
    {
      id: 'acid-fall-straight',
      name: 'Falls when space below',
      slice: { rows: ['A', '.'] },
      expect: ['.', 'A'],
      scope: { rules: ['acid'] },
      steps: 1,
    },
  ],
};
