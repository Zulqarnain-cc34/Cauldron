import { defineMaterial } from './define-material.js';
import { sandRuleDef } from '../rules/materials/sand.js';
import { waterRuleDef } from '../rules/materials/water.js';
import { steamRuleDef } from '../rules/materials/steam.js';
import { reactionRuleDef } from '../rules/reactions-module.js';

const RULE_DEFS = [sandRuleDef, waterRuleDef, steamRuleDef, reactionRuleDef];

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
