import { defineMaterial } from './define-material.js';
import { buildToggleableRules } from '../catalog/rule-toggle-catalog.js';
import { getExtensionToggles, applyToggleDefault } from './toggle-registry.js';
import { getRegisteredRuleDefs } from './rule-store.js';
import './manifest.js';
import './core-reactions.js';

/** @type {import('./define-material.js').RuleModule[] | null} */
let compiled = null;

/** Drop compiled rule modules so new registrations take effect. */
export function invalidateRuleCache() {
  compiled = null;
}

export function getRuleModules() {
  if (!compiled) {
    compiled = getRegisteredRuleDefs().map((def) => {
      if (def.run) return def;
      return defineMaterial(def);
    });
  }
  return compiled;
}

export function getMaterialModules() {
  return getRuleModules().filter((m) => m.phase === 'materials' && m.update);
}

/** All rules exposed in the UI toggle picker (materials + system + extensions). */
export function getToggleableRules() {
  const out = buildToggleableRules(getRuleModules());
  const seen = new Set(out.map((r) => r.key));
  for (const toggle of getExtensionToggles()) {
    if (seen.has(toggle.key)) continue;
    seen.add(toggle.key);
    out.push(toggle);
  }
  return out;
}

export function getAllBehaviors() {
  const out = [];
  for (const mod of getRuleModules()) {
    for (const b of mod.behaviors ?? []) {
      out.push({
        ...b,
        ruleId: mod.id,
        suite: mod.id,
        suiteLabel: mod.label ?? mod.id,
        scope: b.scope ?? { rules: [mod.id] },
        rows: b.slice?.rows ?? b.rows,
      });
    }
  }
  return out;
}

export function getTestSuites() {
  const map = new Map();
  for (const b of getAllBehaviors()) {
    if (!map.has(b.suite)) {
      map.set(b.suite, { id: b.suite, label: b.suiteLabel, tests: [] });
    }
    map.get(b.suite).tests.push(b);
  }
  return [...map.values()];
}

export function buildUpdaters() {
  const updaters = {};
  for (const mod of getMaterialModules()) {
    updaters[mod.species] = mod.update;
  }
  return updaters;
}

export function resolveActiveSpecies(world, onlyRuleIds) {
  const down = new Set();
  const up = new Set();

  for (const mod of getMaterialModules()) {
    if (onlyRuleIds && !onlyRuleIds.has(mod.id)) continue;

    const key = mod.enabledKey ?? mod.id;
    if (!(world.ruleEnabled[key] ?? true)) continue;

    const dir = mod.scanDirection ?? 'down';
    if (dir === 'up') up.add(mod.species);
    else down.add(mod.species);
  }

  return { down, up };
}

/**
 * Sync world.ruleEnabled keys from compiled modules + extension toggles.
 * Call after plugins init so toggles exist before first sim tick.
 * @param {import('../world.js').World} world
 */
export function syncRuleEnabledDefaults(world) {
  for (const mod of getMaterialModules()) {
    const key = mod.enabledKey ?? mod.id;
    if (world.ruleEnabled[key] === undefined) world.ruleEnabled[key] = true;
  }
  for (const toggle of getExtensionToggles()) {
    applyToggleDefault(world, toggle);
  }
}
