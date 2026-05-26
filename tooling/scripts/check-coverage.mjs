#!/usr/bin/env node
/**
 * Catalog coverage — every core material/reaction rule must have at least one behavior.
 */
import { ensureTestBootstrap } from './lib/behavior-outcomes.mjs';
import { getRuleModules } from '../../js/cauldron/tooling.js';
import { getRegisteredPlugins } from '../../js/plugins/host.js';

await ensureTestBootstrap();

const MIN_BEHAVIORS = {
  materials: 1,
  reactions: 3,
  default: 1,
};

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

for (const mod of getRuleModules()) {
  const count = mod.behaviors?.length ?? 0;
  const min = MIN_BEHAVIORS[mod.phase] ?? MIN_BEHAVIORS.default;
  const label = `${mod.phase}/${mod.id}`;

  if (count === 0) {
    errors.push(`${label}: no behaviors[] — untested rule`);
  } else if (count < 2 && mod.phase === 'materials') {
    warnings.push(`${label}: only ${count} behavior — consider adding edge cases`);
  } else if (count < min) {
    errors.push(`${label}: ${count} behaviors (need ≥ ${min})`);
  }
}

for (const plugin of getRegisteredPlugins()) {
  const count = plugin.behaviors?.length ?? 0;
  if (count === 0) {
    warnings.push(`plugin/${plugin.id}: no behaviors[] — consider adding specs`);
  }
}

if (warnings.length) {
  console.warn(`\ncheck:coverage — ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error(`\ncheck:coverage — ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const ruleTotal = getRuleModules().reduce((n, m) => n + (m.behaviors?.length ?? 0), 0);
const pluginTotal = getRegisteredPlugins().reduce((n, p) => n + (p.behaviors?.length ?? 0), 0);
console.log(
  `check:coverage OK — ${getRuleModules().length} rules (${ruleTotal} behaviors), ${getRegisteredPlugins().length} plugins (${pluginTotal} behaviors)`
);
