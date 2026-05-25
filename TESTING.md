# Testing & integration

You do **not** need to open `/tests/` in the browser to know things work. Pick one background safety net and code as usual.

## Three ways to stay green (pick what fits)

| Method | When | What you do |
|--------|------|-------------|
| **CI (GitHub Actions)** | Push or open a PR | Nothing — tests run on the server |
| **`npm run test:watch`** | While coding | One terminal tab; reruns on `js/`, `plugins/`, `tests/` changes |
| **Git pre-commit** | Before each commit | Run once: `npm run setup:hooks` |

All three run the same suite: **92 behavior tests + extension API + layer check**.

```bash
npm test              # run once (what CI runs)
npm run test:watch    # background while you edit
npm run setup:hooks   # optional local gate before commit
```

## Single source of truth: `behaviors[]`

Every material/plugin spec lives in one place. No duplicate test files.

```
js/rules/materials/foo.js   →  fooRuleDef.behaviors[]
plugins/grenade/index.js    →  behaviors[] on the plugin
```

Those arrays automatically feed:

- `npm test` — headless runner (`tests/run-node.js`)
- `/docs/` — live demos per behavior
- `/tests/` — visual runner (debug only; skip for day-to-day)

### Minimal behavior test

```javascript
{
  id: 'sand-falls',
  name: 'Falls straight down',
  slice: { rows: ['S', '.'] },   // ASCII grid
  expect: ['.', 'S'],            // after N ticks
  scope: { rules: ['sand'] },    // which rules enabled
  steps: 1,
}
```

### When ASCII is not enough (burn, internal timers)

```javascript
{
  id: 'fungus-ignite-fire',
  slice: { rows: ['uF'] },
  expect: ['uF'],                // species unchanged
  scope: { rules: ['fungus'] },
  steps: 1,
  inspect(w) {
    if (w.get(0, 0).rb <= 1) throw new Error('expected burn timer after ignite');
  },
}
```

`inspect(world)` runs after steps; failure fails `npm test` with a clear message.

### Deterministic RNG in tests

```javascript
setup(w) {
  w.seed = 42;
  w.randDir = () => 1;
  w.randInt = (n) => (n === 100 ? 90 : 0);
},
```

## Add a feature — checklist

1. **Catalog** — `species.js` + `materials.js` (or `registerMaterialPack`)
2. **Rule** — `js/rules/materials/foo.js` with `behaviors[]`
3. **Manifest** — one line in `js/sim/manifest.js`
4. **Verify** — `npm test` (or rely on watch / CI)

Docs and brush picker update from the registry — no hand-written doc page.

## Debugging a failing test

1. Read the `npm test` diff (Expected vs Actual ASCII).
2. Optional: open `/docs/` → find the behavior → **Run** live demo (see pixels + ticks).
3. Optional: `/tests/` for the full list with filters.

## Layer boundaries

```bash
npm run check:layers   # included in npm test
```

Import rules are enforced so plugins stay on the SDK surface. See [ARCHITECTURE.md](ARCHITECTURE.md).

## CI setup (one time per repo)

Push to GitHub with `.github/workflows/ci.yml` in the repo. Every push/PR to `main`/`master` runs `npm test`. Check the **Actions** tab — no local test run required.
