/**
 * System-level rule toggles (not tied to a single material module).
 * Add new entries here when introducing phases like life, boids, flow, etc.
 */
export const SYSTEM_TOGGLE_RULES = [
  { key: 'reactions', id: 'reactions', label: 'Reactions', group: 'system' },
  { key: 'life', id: 'life', label: 'Life', group: 'system', disabled: true },
  { key: 'boids', id: 'boids', label: 'Boids', group: 'system', disabled: true },
  { key: 'flow', id: 'flow', label: 'Wind / flow', group: 'system', disabled: true },
];

/** @typedef {{ key: string, id: string, label: string, group: string, species?: number, disabled?: boolean }} ToggleableRule */

/**
 * Build searchable rule list from compiled modules + system rules.
 * New material rule modules appear automatically; dedupe shared enabledKey (e.g. water + steam).
 * @param {import('../sim/define-material.js').RuleModule[]} modules
 * @returns {ToggleableRule[]}
 */
export function buildToggleableRules(modules) {
  const out = [];
  const seen = new Set();

  for (const mod of modules) {
    if (mod.phase !== 'materials' || !mod.update) continue;
    const key = mod.enabledKey ?? mod.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      id: mod.id,
      label: mod.label ?? mod.id,
      group: 'materials',
      species: mod.species,
    });
  }

  for (const sys of SYSTEM_TOGGLE_RULES) {
    if (seen.has(sys.key)) continue;
    seen.add(sys.key);
    out.push({ ...sys });
  }

  return out;
}

/**
 * @param {ToggleableRule} rule
 * @param {string} query
 */
export function ruleMatchesQuery(rule, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${rule.label} ${rule.id} ${rule.key} ${rule.group}`.toLowerCase();
  return haystack.includes(q);
}
