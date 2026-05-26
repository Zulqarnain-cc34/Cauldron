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

    if (rel.startsWith('plugins/') && rel.endsWith('.js') && !rel.includes('node_modules')) {
      const allowed =
        target.startsWith('js/cauldron/') ||
        target.startsWith('js/worldgen/') ||
        target.startsWith('js/world.js') ||
        target.startsWith('js/catalog/') ||
        target.startsWith('js/engine/') ||
        target.startsWith('js/rules/') ||
        target.startsWith('js/sim/') ||
        (target.startsWith('plugins/') && target !== rel);
      if (!allowed) {
        violations.push(`${rel}: plugin must import library SDK only, not "${spec}" → ${target}`);
      }
    }

    if (rel === 'js/world.js') {
      if (target.includes('plugins/') || target.startsWith('apps/')) {
        violations.push(`${rel}: kernel must not import plugins or apps (${spec})`);
      }
    }

    if (rel.startsWith('js/sim/')) {
      if (target.startsWith('apps/') || target.startsWith('apps/gem-digger/lib/')) {
        violations.push(`${rel}: sim must not import game kit (${spec}) → ${target}`);
      }
    }

    if (rel.startsWith('js/') && !rel.startsWith('js/cauldron/tooling')) {
      if (target.startsWith('apps/')) {
        violations.push(`${rel}: library must not import game apps (${spec}) → ${target}`);
      }
    }

    if (rel.startsWith('js/cauldron/') && !rel.includes('worldgen.js')) {
      if (target.startsWith('apps/')) {
        violations.push(`${rel}: cauldron SDK must not import game apps (${spec}) → ${target}`);
      }
    }

    if (rel.startsWith('apps/gem-digger/lib/')) {
      if (target.startsWith('apps/gem-digger/ui/')) {
        violations.push(`${rel}: game lib must not import UI (${spec}) → ${target}`);
      }
    }

    if (rel.startsWith('apps/gem-digger/ui/')) {
      if (target.startsWith('js/sim/test-registry') || target.startsWith('js/rules/registry')) {
        violations.push(`${rel}: UI should use cauldron/app.js, not ${target}`);
      }
      if (target.startsWith('js/catalog/') && !target.startsWith('js/cauldron/')) {
        violations.push(`${rel}: UI should use cauldron/app.js, not ${target}`);
      }
      if (target.startsWith('apps/gem-digger/lib/') && !target.includes('/ui/')) {
        /* ok — game UI imports game lib */
      } else if (
        target.startsWith('apps/gem-digger/') &&
        !target.startsWith('apps/gem-digger/lib/')
      ) {
        /* ok sibling ui */
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
