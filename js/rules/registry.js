import { scanMaterials } from '../engine/scanner.js';
import {
  buildUpdaters,
  getMaterialModules,
  getRuleModules,
  getAllBehaviors,
  getTestSuites,
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

function buildRegistry() {
  const registry = {
    emitters: [],
    materials: getMaterialModules().map((mod) => ({
      id: mod.id,
      enabled: (w) => w.ruleEnabled[mod.enabledKey ?? mod.id] ?? true,
      run(world) {
        scanMaterials(world, mod.speciesFilter, UPDATERS, mod.scanDirection ?? 'down');
      },
    })),
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
      if (only && !only.has(rule.id)) continue;
      if (rule.enabled && !rule.enabled(world)) continue;
      rule.run(world);
    }
  }
}

export { getRuleModules, getMaterialModules, getAllBehaviors, getTestSuites };
