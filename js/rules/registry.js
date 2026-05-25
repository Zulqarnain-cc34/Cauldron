import { scanMaterials } from '../engine/scanner.js';
import {
  buildUpdaters,
  getMaterialModules,
  getRuleModules,
  getAllBehaviors,
  getTestSuites,
  resolveActiveSpecies,
} from '../sim/test-registry.js';
import { applyReactions } from './reactions-module.js';

export const PHASES = [
  'emitters',
  'materials',
  'reactions',
  'life',
  'forces',
  'agents',
  'brush',
];

const UPDATERS = buildUpdaters();

/** Rule ids that belong to the unified materials phase (for `only` filtering). */
export const MATERIAL_RULE_IDS = new Set(
  getMaterialModules().map((m) => m.id)
);

function shouldRunMaterials(only) {
  if (!only) return true;
  for (const id of only) {
    if (MATERIAL_RULE_IDS.has(id)) return true;
  }
  return false;
}

function runMaterialsPhase(world, only) {
  const { down, up } = resolveActiveSpecies(world, only);
  if (down.size > 0) scanMaterials(world, down, UPDATERS, 'down');
  if (up.size > 0) scanMaterials(world, up, UPDATERS, 'up');
}

function buildRegistry() {
  const registry = {
    emitters: [],
    materials: [
      {
        id: 'materials',
        enabled: () => true,
        run(world, ctx) {
          runMaterialsPhase(world, ctx?.only ?? null);
        },
      },
    ],
    reactions: [
      {
        id: 'reactions',
        enabled: (w) => w.ruleEnabled.reactions,
        run: applyReactions,
      },
    ],
    life: [],
    forces: [],
    agents: [],
    brush: [],
  };
  return registry;
}

let registry = buildRegistry();

export function registerRule(phase, rule) {
  if (!registry[phase]) throw new Error(`Unknown phase: ${phase}`);
  registry[phase].push(rule);
}

/**
 * @param {import('../world.js').World} world
 * @param {{ only?: string[] }} [options]
 */
export function runRules(world, options = {}) {
  const only = options.only ? new Set(options.only) : null;
  world.tick = (world.tick + 1) & 0xffff;

  for (const phase of PHASES) {
    for (const rule of registry[phase]) {
      if (phase === 'materials') {
        if (!shouldRunMaterials(only)) continue;
      } else if (only && !only.has(rule.id)) {
        continue;
      }

      if (rule.enabled && !rule.enabled(world)) continue;
      rule.run(world, only ? { only } : undefined);
    }
  }
}

export { getRuleModules, getMaterialModules, getAllBehaviors, getTestSuites };
