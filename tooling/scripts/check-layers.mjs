#!/usr/bin/env node
/**
 * Layer boundary checker — fails CI when imports violate ARCHITECTURE.md.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** @param {string} dir */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules') continue;
      walk(p, out);
    } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
      out.push(p);
    }
  }
  return out;
}

/** @param {string} file */
function importsIn(file) {
  const text = readFileSync(file, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]/g;
  /** @type {string[]} */
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

/** @param {string} file @param {string} spec */
function resolvesTo(file, spec) {
  if (spec.startsWith('.')) {
    const base = join(file, '..', spec);
    for (const ext of ['', '.js', '/index.js']) {
      try {
        const p = base.endsWith('.js') ? base : base + ext;
        statSync(p);
        return p;
      } catch {
        /* try next */
      }
    }
  }
  return spec;
}

const violations = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (rel.startsWith('node_modules/')) continue;

  for (const spec of importsIn(file)) {
    if (!spec.startsWith('.')) continue;
    const target = relative(ROOT, resolvesTo(file, spec)).replace(/\\/g, '/');

    // L6 Plugins — cauldron SDK only (all plugin files, not just top-level)
    if (rel.startsWith('plugins/') && rel.endsWith('.js') && !rel.includes('node_modules')) {
      const allowed =
        target.startsWith('js/cauldron/') ||
        (target.startsWith('plugins/') && target !== rel);
      if (!allowed) {
        violations.push(`${rel}: plugin must import cauldron SDK only, not "${spec}" → ${target}`);
      }
    }

    // L0 Kernel — no plugins or sim lifecycle from plugins host
    if (rel === 'js/world.js') {
      if (target.includes('plugins/')) {
        violations.push(`${rel}: kernel must not import plugins (${spec})`);
      }
    }

    // L3 Runtime registry — no plugin host (breaks cycles)
    if (rel === 'js/sim/test-registry.js') {
      if (target.includes('plugins/host')) {
        violations.push(`${rel}: runtime registry must not import plugin host (${spec})`);
      }
    }

    // L3 Sim — no game layer (inventory/maps are L5 game, not core sim)
    if (rel.startsWith('js/sim/')) {
      if (target.startsWith('js/game/')) {
        violations.push(`${rel}: sim runtime must not import game layer (${spec}) → ${target}`);
      }
    }

    // L5 Game — no UI (presentation mounts from app host)
    if (rel.startsWith('js/game/')) {
      if (target.startsWith('apps/')) {
        violations.push(`${rel}: game layer must not import app UI (${spec}) → ${target}`);
      }
    }

    // L5 App UI — use SDK barrels, not deep L1/L3/game paths
    if (rel.startsWith('apps/') && rel.includes('/ui/')) {
      if (target.startsWith('js/sim/test-registry') || target.startsWith('js/rules/registry')) {
        violations.push(`${rel}: UI should import cauldron/app.js, not ${target}`);
      }
      if (target.startsWith('js/catalog/')) {
        violations.push(`${rel}: UI should import cauldron/app.js, not ${target}`);
      }
      if (target.startsWith('js/sim/')) {
        violations.push(`${rel}: UI should import cauldron/app.js or cauldron/game.js, not ${target}`);
      }
      if (target.startsWith('js/game/')) {
        violations.push(`${rel}: UI should import cauldron/game.js, not ${target}`);
      }
    }
  }
}

if (violations.length) {
  console.error('Layer boundary violations:\n');
  for (const v of violations) console.error('  •', v);
  process.exit(1);
}

console.log('Layer boundaries OK');
