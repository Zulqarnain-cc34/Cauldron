#!/usr/bin/env node
/**
 * Validate library export graph — no bundler; ES modules load directly in browser.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/** @type {string[]} */
const exportEntries = Object.values(pkg.exports ?? {});

/** @type {string[]} */
const libraryModules = [
  ...exportEntries.map((p) => join(ROOT, p.replace(/^\.\//, ''))),
  join(ROOT, 'js/game/index.js'),
  join(ROOT, 'js/game/worldgen/index.js'),
];

for (const file of libraryModules) {
  await import(pathToFileURL(file).href);
}

console.log(`build OK — ${libraryModules.length} library modules resolve`);
