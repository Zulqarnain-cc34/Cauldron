/**
 * Wire rule defs from rule-store into phased registry (materials use scanner; others use registerRule).
 */
import { registerRuleDef as pushRuleDef, getRegisteredRuleDefs } from './rule-store.js';
import { invalidateRuleCache } from './test-registry.js';

/** @type {Set<string>} */
const wiredIds = new Set();

/** @type {((phase: string, rule: object) => void) | null} */
let registerRuleFn = null;

/**
 * Called once from rules/registry.js to avoid circular import at load time.
 * @param {(phase: string, rule: object) => void} fn
 */
export function attachRuleRegistry(fn) {
  registerRuleFn = fn;
}

/**
 * @param {object} def
 */
export function wireRuleDef(def) {
  if (!registerRuleFn) return;
  const phase = def.phase ?? 'materials';
  if (phase === 'materials' && !def.run) return;
  if (!def.run) return;
  if (wiredIds.has(def.id)) return;
  wiredIds.add(def.id);

  const enabled =
    typeof def.enabled === 'function'
      ? def.enabled
      : phase === 'reactions'
        ? (w) => w.ruleEnabled.reactions ?? true
        : () => (def.enabled ?? true);

  registerRuleFn(phase, { id: def.id, enabled, run: def.run });
}

/** Wire all defs already in rule-store (after manifest load). */
export function wireAllStoredRuleDefs() {
  for (const def of getRegisteredRuleDefs()) wireRuleDef(def);
}

/**
 * Register a rule def: store + invalidate cache + wire non-material phases.
 * @param {object} def
 */
export function registerRuntimeRuleDef(def) {
  pushRuleDef(def);
  invalidateRuleCache();
  wireRuleDef(def);
}

/** @param {string} [id] */
export function clearWiredRuleDefs(id) {
  if (id) wiredIds.delete(id);
  else wiredIds.clear();
}
