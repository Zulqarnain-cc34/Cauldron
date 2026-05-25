import { Species } from '../catalog/species.js';
import { applyRegisteredReactions } from '../sim/reaction-store.js';
import '../sim/core-reactions.js';

export function applyReactions(world) {
  applyRegisteredReactions(world);
}

export const reactionRuleDef = {
  id: 'reactions',
  label: 'Reactions',
  phase: 'reactions',
  customUpdate: null,
  run: applyReactions,
  doc: {
    summary: 'Adjacency chemistry — water extinguishes fire into steam, fire ignites burnables.',
  },

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
    {
      id: 'reaction-water-fire-vertical',
      name: 'Water above fire makes steam',
      description: 'Stacked water + fire → steam at fire, water cleared.',
      slice: { rows: ['W', 'F'] },
      expect: ['.', '^'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-fire-water-horizontal',
      name: 'Fire left of water makes steam',
      description: 'Fire as cell a still reacts when water is neighbor b.',
      slice: { rows: ['FW'] },
      expect: ['^.'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-fire-wood',
      name: 'Fire ignites wood',
      description: 'Adjacent fire + wood → wood becomes fire.',
      slice: { rows: ['FB'] },
      expect: ['FF'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-fire-fungus',
      name: 'Fire ignites fungus',
      slice: { rows: ['Fu'] },
      expect: ['FF'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
    {
      id: 'reaction-fire-oil',
      name: 'Fire ignites oil',
      slice: { rows: ['Fl'] },
      expect: ['FF'],
      scope: { rules: ['reactions'] },
      steps: 1,
    },
  ],
};
