import { Species } from '../../catalog/species.js';
import { MATERIALS } from '../../catalog/materials.js';

const SCOPE = { rules: ['steam'] };

/** Motion from catalog mobility (buoyant). Toggled via water rule. */
export const steamRuleDef = {
  id: 'steam',
  label: 'Steam',
  species: Species.STEAM,
  material: MATERIALS[Species.STEAM],
  phase: 'materials',
  enabledKey: 'water',

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
