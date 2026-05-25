import { defineMaterial } from './define-material.js';
import { sandRuleDef } from '../rules/materials/sand.js';
import { waterRuleDef } from '../rules/materials/water.js';
import { steamRuleDef } from '../rules/materials/steam.js';
import { fireRuleDef } from '../rules/materials/fire.js';
import { organicRuleDef } from '../rules/materials/organic.js';
import { stoneRuleDef } from '../rules/materials/stone.js';
import { reactionRuleDef } from '../rules/reactions-module.js';

const RULE_DEFS = [
  sandRuleDef,
  waterRuleDef,
  steamRuleDef,
  fireRuleDef,
  organicRuleDef,
  stoneRuleDef,
  reactionRuleDef,
];

/** @type {import('./define-material.js').RuleModule[] | null} */
let compiled = null;

export function getRuleModules() {
  if (!compiled) {
    compiled = RULE_DEFS.map((def) => {
      if (def.run) return def;
      return defineMaterial(def);
    });
  }
  return compiled;
}

export function getMaterialModules() {
  return getRuleModules().filter((m) => m.phase === 'materials' && m.update);
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

/**
 * Which species to simulate this tick — respects rule toggles and test `only` scope.
 * @param {import('../world.js').World} world
 * @param {Set<string>|null} onlyRuleIds
 * @returns {{ down: Set<number>, up: Set<number> }}
 */
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
