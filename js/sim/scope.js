/**
 * Describes which rules/constraints are active for one simulation run.
 * @typedef {Object} SimulationScope
 * @property {string[]} [rules] — rule ids to run (omit = all enabled)
 * @property {Record<string, boolean>} [constraints]
 */

/** @param {import('../world.js').World} world */
export function applyScopeToWorld(world, scope) {
  if (!scope?.constraints) return;
  for (const [key, val] of Object.entries(scope.constraints)) {
    if (key in world.ruleEnabled) world.ruleEnabled[key] = val;
  }
}

export function scopeToRunOptions(scope) {
  if (!scope?.rules?.length) return undefined;
  return { only: scope.rules };
}

export function behaviorScope(ruleId) {
  return { rules: [ruleId] };
}

export function normalizeScope(test) {
  if (test.scope) return test.scope;
  if (test.only) return { rules: test.only };
  return { rules: [test.ruleId].filter(Boolean) };
}
