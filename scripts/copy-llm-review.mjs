#!/usr/bin/env node
/**
 * Regenerate verification export and copy LLM paste bundle to clipboard.
 *   npm run copy:llm
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tests/exports');
const JSON_PATH = join(OUT_DIR, 'verification-report.json');
const skipRegenerate = process.argv.includes('--no-regenerate');

if (!skipRegenerate) {
  console.log('Regenerating verification export…');
  const gen = spawnSync('node', [join(ROOT, 'scripts/export-verification.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (gen.status !== 0) {
    console.warn('');
    console.warn('Export reported issues (see above).');
    if (!existsSync(JSON_PATH)) {
      console.error('No verification-report.json written — cannot copy.');
      process.exit(gen.status ?? 1);
    }
    console.warn('Copying anyway — JSON was generated; review summary in the paste.');
  }
}

if (!existsSync(JSON_PATH)) {
  console.error('Missing tests/exports/verification-report.json — run: npm run export:verification');
  process.exit(1);
}

const report = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const json = readFileSync(JSON_PATH, 'utf8');

const summary = report.summary ?? {};
const paste = `${report.reviewerInstructions ?? ''}

---
AUDIT SUMMARY
---
Overall: ${summary.overallVerdict ?? 'unknown'}
Behaviors: ${summary.behaviorTests?.pass ?? '?'}/${summary.behaviorTests?.total ?? '?'} PASS
Headless: ${summary.headlessTests?.pass ?? '?'} pass / ${summary.headlessTests?.fail ?? '?'} fail
Quality gates: ${summary.qualityGatesAllPass ? 'all pass' : 'some failed'}
Generated: ${report.generatedAt ?? 'unknown'}

---
Paste review task: Read the JSON below. Flag suspicious PASS rows. Summarize OK vs suspicious behavior ids.
---

${json}
`;

/** @param {string} text */
function copyToClipboard(text) {
  const attempts = [
    ['wl-copy', [], 'wl-copy (Wayland)'],
    ['xclip', ['-selection', 'clipboard'], 'xclip (X11)'],
    ['xsel', ['--clipboard', '--input'], 'xsel (X11)'],
  ];

  for (const [cmd, args, label] of attempts) {
    const r = spawnSync(cmd, args, { input: text, encoding: 'utf8' });
    if (r.error?.code === 'ENOENT') continue;
    if (r.status === 0) return label;
  }
  return null;
}

const via = copyToClipboard(paste);

if (via) {
  const kb = (Buffer.byteLength(paste, 'utf8') / 1024).toFixed(1);
  console.log('');
  console.log(`Copied to clipboard via ${via} (${kb} KB)`);
  console.log('Paste into your LLM now — prompt + full verification JSON included.');
  process.exit(0);
}

console.error('');
console.error('Could not copy — no clipboard tool found.');
console.error('Install one of: wl-clipboard, xclip, or xsel');
console.error('');
console.error('Fallback: npm run export:verification');
console.error('Then open tests/exports/verification-report.json manually.');
process.exit(1);
