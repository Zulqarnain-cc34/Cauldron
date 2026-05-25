#!/usr/bin/env node
/**
 * Layer boundary checker — fails CI when imports violate ARCHITECTURE.md.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

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

  for (const spec of importsIn(file)) {
    const target = spec.startsWith('.') ? relative(ROOT, resolvesTo(file, spec)).replace(/\\/g, '/') : spec;

    // L6 Plugins — cauldron SDK only
    if (rel.startsWith('plugins/') && !rel.includes('_template')) {
      if (spec.startsWith('.') && !target.startsWith('js/cauldron/') && !target.startsWith('plugins/')) {
        violations.push(`${rel}: plugin must not import "${spec}" → ${target}`);
      }
    }

    // L0 Kernel — no plugin host
    if (rel === 'js/world.js') {
      if (target.includes('plugins/') || target.includes('plugins/host')) {
        violations.push(`${rel}: kernel must not import plugins (${spec})`);
      }
    }

    // L3 Runtime registry — no plugin host (breaks cycles)
    if (rel === 'js/sim/test-registry.js') {
      if (target.includes('plugins/host')) {
        violations.push(`${rel}: runtime registry must not import plugin host (${spec})`);
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
