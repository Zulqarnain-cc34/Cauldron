/**
 * Built-in adjacency reactions — registered at load via reaction-store.
 */
import { Species } from '../catalog/species.js';
import { registerReaction } from './reaction-store.js';

let loaded = false;

export function loadCoreReactions() {
  if (loaded) return;
  loaded = true;

  registerReaction({ id: 'water-fire-steam', a: Species.WATER, b: Species.FIRE, result: Species.STEAM, clearA: true, at: 'b' });
  registerReaction({ id: 'fire-organic', a: Species.FIRE, b: Species.ORGANIC, result: Species.FIRE, at: 'b' });
  registerReaction({ id: 'fire-wood', a: Species.FIRE, b: Species.WOOD, result: Species.FIRE, at: 'b' });
  registerReaction({ id: 'fire-fungus', a: Species.FIRE, b: Species.FUNGUS, result: Species.FIRE, at: 'b' });
  registerReaction({ id: 'fire-oil', a: Species.FIRE, b: Species.OIL, result: Species.FIRE, at: 'b' });
  registerReaction({ id: 'lava-water', a: Species.LAVA, b: Species.WATER, result: Species.STONE, clearA: false, at: 'a' });
}

loadCoreReactions();
