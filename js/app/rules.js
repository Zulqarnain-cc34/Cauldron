/**
 * L5 App rules — player-facing rules registered at bootstrap (not in input layer).
 */
import { registerRule } from '../rules/registry.js';
import { applyBrushQueue } from '../input.js';

let registered = false;

/** Register app-layer rules once per process. */
export function registerAppRules() {
  if (registered) return;
  registered = true;
  registerRule('brush', {
    id: 'player-brush',
    enabled: () => true,
    run: applyBrushQueue,
  });
}
