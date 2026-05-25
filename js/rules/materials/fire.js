import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['fire'] };

/** Sandspiel-style fire: heat in ra decays, drifts to empty cells, dies in water or when cool. */
function updateFire(cell, api) {
  const ra = cell.ra || 150;
  const heatLoss = 2 + api.randDir() + 1;
  const degraded = { ...cell, ra: Math.max(0, ra - heatLoss) };

  const [dx, dy] = api.randVec8();
  const target = api.get(dx, dy);

  if (degraded.ra < 5 || target.species === Species.WATER) {
    api.clearSelf();
    return;
  }

  if (target.species === Species.ORGANIC) {
    api.set(dx, dy, {
      species: Species.FIRE,
      flags: 0,
      ra: 120 + api.randInt(30),
      rb: 0,
    });
    api.set(0, 0, degraded);
    return;
  }

  if (target.species === Species.EMPTY) {
    api.clearSelf();
    api.set(dx, dy, degraded);
    return;
  }

  api.set(0, 0, degraded);
}

export const fireRuleDef = {
  id: 'fire',
  label: 'Fire',
  species: Species.FIRE,
  material: MATERIALS[Species.FIRE],
  phase: 'materials',
  scanDirection: 'up',
  customUpdate: updateFire,

  behaviors: [
    {
      id: 'fire-burns-out',
      name: 'Burns out when heat is low',
      description: 'ra below 5 → cell clears (extinguished / spent).',
      slice: { rows: ['F'] },
      expect: ['.'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.set(0, 0, { species: Species.FIRE, flags: 0, ra: 3, rb: 0 });
      },
    },
    {
      id: 'fire-extinguish-water',
      name: 'Dies on contact with water',
      description: 'Random neighbor is water → fire clears.',
      slice: { rows: ['WWW', 'WFW', 'WWW'] },
      expect: ['WWW', 'W.W', 'WWW'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.set(1, 1, { species: Species.FIRE, flags: 0, ra: 150, rb: 0 });
      },
    },
    {
      id: 'fire-drifts-to-empty',
      name: 'Drifts into empty neighbor',
      description: 'Hot fire moves into adjacent empty cell.',
      slice: { rows: ['#F.', '###'] },
      expect: ['#.F', '###'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 100;
        w.set(1, 0, { species: Species.FIRE, flags: 0, ra: 150, rb: 0 });
      },
    },
    {
      id: 'fire-ignites-organic',
      name: 'Ignites organic neighbor',
      description: 'Random neighbor is organic → spawns fire there.',
      slice: { rows: ['FO'] },
      expect: ['FF'],
      scope: SCOPE,
      steps: 1,
      setup(w) {
        w.seed = 0;
        w.set(0, 0, { species: Species.FIRE, flags: 0, ra: 150, rb: 0 });
      },
    },
  ],
};
