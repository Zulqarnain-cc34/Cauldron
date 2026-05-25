# Testing & integration

**You never review tests one by one.** Write `behaviors[]` in code, then run one command:

```bash
npm run release
```

If it prints `READY FOR RELEASE`, ship it. CI runs the same gate on every push.

## What runs automatically (no manual review)

| Gate | What it catches |
|------|-----------------|
| **92+ headless tests** | Wrong grid output, broken extension API |
| **check:behaviors** | No-op tests, weak ignite specs, tests that pass with wrong expect |
| **check:coverage** | Materials/reactions with zero tests |
| **Golden snapshots** | **Any behavior outcome drift** — regression across all 86 behaviors at once |
| **check:layers** | Plugin import violations |

Golden snapshots live in `tests/snapshots/behaviors.json`. Every behavior's `before` / `after` grid and burn timers are recorded. If you break sand falling, fungus ignite, or anything else, **CI fails and names the behavior id** — you don't open each test.

### When you change sim behavior on purpose

```bash
npm run snapshot:update   # refresh golden file, commit it with your change
npm run release           # confirm green
```

## Day-to-day (zero test UI)

| When | Command |
|------|---------|
| **Before release / deploy** | `npm run release` |
| **While coding** | `npm run test:watch` (background tab) |
| **On git push** | CI (GitHub Actions) — or `npm run setup:hooks` for local pre-push |
| **Debugging one failure** | Read terminal diff → optional `/docs/` demo |

```bash
npm test              # same gates as release, less pretty output
npm run release       # one summary screen — use this before production
npm run test:watch    # auto-rerun on file changes
npm run setup:hooks   # pre-commit (test) + pre-push (release)
```

## Why no LLM in the loop

Deterministic grids + golden snapshots beat probabilistic review. Use AI to draft `behaviors[]` if helpful — **`npm run release` is the judge.**

## Single source of truth: `behaviors[]`

Every material/plugin spec lives in one place:

```
js/rules/materials/foo.js   →  fooRuleDef.behaviors[]
plugins/grenade/index.js    →  behaviors[] on the plugin
```

Those arrays feed: `npm test`, golden snapshots, `/docs/` demos, and `/tests/` (debug only).

### Minimal behavior test

```javascript
{
  id: 'sand-falls',
  name: 'Falls straight down',
  slice: { rows: ['S', '.'] },
  expect: ['.', 'S'],
  scope: { rules: ['sand'] },
  steps: 1,
}
```

### Internal state (burn, timers)

```javascript
{
  id: 'fungus-ignite-fire',
  slice: { rows: ['uF'] },
  expect: ['uF'],
  scope: { rules: ['fungus'] },
  steps: 1,
  inspect(w) {
    if (w.get(0, 0).rb <= 1) throw new Error('expected burn timer after ignite');
  },
}
```

## Add a feature — checklist

1. Catalog + rule file with `behaviors[]`
2. `npm test` (or watch running)
3. If sim output changed intentionally: `npm run snapshot:update`
4. `npm run release` before merge

## If something fails

The terminal names the **behavior id** (e.g. `sand-diagonal-right` or snapshot drift). Fix code or update snapshot. Only open `/docs/` or `/tests/` if you need pixels.

## LLM double-check export

Generate a full audit JSON to paste into any LLM for a second opinion:

```bash
npm run export:verification
```

Or copy straight to clipboard (regenerates + copies in one step):

```bash
npm run copy:llm
```

Paste into any LLM. Use `--no-regenerate` to copy the last export without re-running tests.

Creates:

| File | Purpose |
|------|---------|
| `tests/exports/verification-report.json` | All rules, all 86 behaviors, start/expected/actual grids, pass/fail, quality gates |
| `tests/exports/llm-review-prompt.txt` | Instructions to paste above the JSON |

The JSON includes `reviewerInstructions` telling the LLM what to validate. Regenerate after code changes.

## CI

`.github/workflows/ci.yml` runs `npm run release` on every push/PR. Check GitHub **Actions** — green means all 86 behavior outcomes still match the golden file.
