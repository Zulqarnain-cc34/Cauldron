import { Species } from '../catalog/species.js';

const REACTIONS = [
  { a: Species.WATER, b: Species.FIRE, result: Species.STEAM, clearA: true, at: 'b' },
  { a: Species.FIRE, b: Species.ORGANIC, result: Species.FIRE, at: 'b' },
];

export function applyReactions(world) {
  const { width, height } = world;

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const cell = world.get(x, y);
      if (cell.species === Species.EMPTY) continue;

      for (const rxn of REACTIONS) {
        if (cell.species !== rxn.a) continue;

        for (const [dx, dy] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const n = world.get(x + dx, y + dy);
          if (n.species !== rxn.b) continue;

          const tx = rxn.at === 'b' ? x + dx : x;
          const ty = rxn.at === 'b' ? y + dy : y;
          world.set(tx, ty, {
            species: rxn.result,
            flags: 0,
            ra: world.randInt(255),
            rb: 0,
          });
          if (rxn.clearA) world.set(x, y, world.emptyCell());
          break;
        }
      }
    }
  }
}

export const reactionRuleDef = {
  id: 'reactions',
  label: 'Reactions',
  phase: 'reactions',
  customUpdate: null,
  run: applyReactions,

  behaviors: [
    {
      id: 'reaction-water-fire-steam',
      name: 'Water and fire make steam',
      description: 'Adjacent water + fire → steam at fire cell, water cleared.',
      slice: { rows: ['WF'] },
      expect: ['.^'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-fire-organic-ignites',
      name: 'Fire ignites organic',
      description: 'Adjacent fire + organic → organic becomes fire.',
      slice: { rows: ['FO'] },
      expect: ['FF'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-no-op-when-separated',
      name: 'No reaction without contact',
      description: 'Water and fire with gap → unchanged.',
      slice: { rows: ['W.F'] },
      expect: ['W.F'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
  ],
};
