#!/usr/bin/env node
/**
 * Rerun headless tests when js/, plugins/, tests/, or scripts/ change.
 * Layer check runs after a passing test pass (same as npm test, minus initial delay).
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WATCH_DIRS = ['js', 'plugins', 'tests', 'scripts'];

let debounce = null;
let child = null;
let running = false;

function runSuite(label = 'test') {
  if (running) {
    child?.kill('SIGTERM');
  }
  running = true;
  console.log(`\n[test:watch] ${label}…\n`);

  child = spawn(
    process.execPath,
    ['--test', 'tests/run-node.js', 'tests/extension-api.test.js'],
    { cwd: ROOT, stdio: 'inherit' }
  );

  child.on('close', (code) => {
    running = false;
    child = null;
    if (code === 0) {
      const layer = spawn('npm', ['run', 'check:layers', '--silent'], {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
      });
      layer.on('close', (layerCode) => {
        if (layerCode !== 0) {
          console.log('\n[test:watch] layer check failed');
          return;
        }
        const beh = spawn('npm', ['run', 'check:behaviors', '--silent'], {
          cwd: ROOT,
          stdio: 'inherit',
          shell: true,
        });
        beh.on('close', (behCode) => {
          if (behCode !== 0) {
            console.log('\n[test:watch] behavior quality check failed');
            return;
          }
          const snap = spawn('npm', ['run', 'check:snapshots', '--silent'], {
            cwd: ROOT,
            stdio: 'inherit',
            shell: true,
          });
          snap.on('close', (snapCode) => {
            if (snapCode === 0) console.log('\n[test:watch] OK — waiting for changes…');
            else console.log('\n[test:watch] snapshot drift — run npm run snapshot:update if intentional');
          });
        });
      });
    } else {
      console.log(`\n[test:watch] failed (exit ${code}) — waiting for changes…`);
    }
  });
}

function schedule(reason) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => runSuite(reason), 200);
}

console.log('[test:watch] watching', WATCH_DIRS.join(', '));
runSuite('initial run');

for (const dir of WATCH_DIRS) {
  const abs = path.join(ROOT, dir);
  watch(abs, { recursive: true }, (_event, filename) => {
    if (!filename || filename.includes('node_modules')) return;
    schedule(filename);
  });
}
