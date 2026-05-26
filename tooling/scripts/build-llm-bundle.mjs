#!/usr/bin/env node
/** Build llm-paste-bundle.txt from verification-report.json — no test runs. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const JSON_PATH = join(ROOT, 'tooling/tests/exports/verification-report.json');
const BUNDLE_PATH = join(ROOT, 'tooling/tests/exports/llm-paste-bundle.txt');

if (!existsSync(JSON_PATH)) {
  console.error('Missing verification-report.json — run: npm run export:verification:quick');
  process.exit(1);
}

const json = readFileSync(JSON_PATH, 'utf8');
const report = JSON.parse(json);
const summary = report.summary ?? {};

const paste = `${report.reviewerInstructions ?? ''}

---
AUDIT SUMMARY
---
Overall: ${summary.overallVerdict ?? 'unknown'}
Behaviors: ${summary.behaviorTests?.pass ?? '?'}/${summary.behaviorTests?.total ?? '?'} PASS
Export mode: ${report.exportMode ?? 'unknown'}
Generated: ${report.generatedAt ?? 'unknown'}

---
Paste review task: Read the JSON below. Flag suspicious PASS rows. Summarize OK vs suspicious behavior ids.
---

${json}
`;

writeFileSync(BUNDLE_PATH, paste);
