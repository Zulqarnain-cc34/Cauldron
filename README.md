# Cauldron

A falling-sand cellular automata **sandbox** you can run locally, extend with plugins, and document automatically from code.

## Quick start (sandbox)

```bash
npm start
```

Open in your browser:

| URL | What |
|-----|------|
| http://localhost:3456/ | Redirects to **Gem Digger** demo |
| http://localhost:3456/apps/gem-digger/ | **Play** — maps, gems, dig caves |
| http://localhost:3456/docs/ | **Live docs** — materials & plugins with runnable tests |
| http://localhost:3456/tests/ | **Test runner** — all behavior specs |

No build step. Static files + ES modules.

## Commands

```bash
npm start              # sandbox server (port 3456)
npm run release        # ← before production: one verdict, all gates
npm test               # same checks, plain output
npm run test:watch     # background auto-rerun while coding
npm run snapshot:update  # after intentional sim changes
npm run export:verification  # JSON audit for LLM second opinion
npm run copy:llm             # ~0.3s clipboard (pre-built bundle)
bash scripts/copy-llm.sh     # ~0.02s — fastest, no npm
npm run copy:llm -- --fresh  # ~1s — refresh behaviors then copy
npm run setup:hooks    # optional git pre-commit + pre-push gates
```

**You never review tests one by one.** `npm run release` runs headless tests, quality gates, catalog coverage, and golden snapshots for all **89 behaviors** (86 core + 3 grenade plugin). See [TESTING.md](TESTING.md).

## Extend the library

See **[EXTENDING.md](EXTENDING.md)** — materials, reactions, rules, plugins, brushes.

SDK entry points (`package.json` exports):

| Import | Use |
|--------|-----|
| `cauldron/plugin.js` | Plugins |
| `cauldron/extend.js` | Material packs, reactions, runtime rules |
| `cauldron/app.js` | Host apps |
| `cauldron/bootstrap.js` | Startup |

## Architecture (layers)

See [ARCHITECTURE.md](ARCHITECTURE.md). **Plugins import `js/cauldron/plugin.js`** — the public SDK boundary.

```
L0 Kernel → L1 Catalog → L2 Engine → L3 Runtime → L4 SDK (cauldron) → L6 Plugins
```

## Add your own plugin

1. Copy `plugins/_template/` → `plugins/my-thing/`
2. Import from `js/cauldron/index.js` only
3. Register one line in `plugins/index.js`

```javascript
import { registerPlugin } from '../js/cauldron/index.js';
import { myThingPlugin } from './my-thing/index.js';
registerPlugin(myThingPlugin);
```

Reload the sim. Your plugin appears in **Rules** (searchable dropdown) and **Docs** automatically.

See [plugins/README.md](plugins/README.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for the full layout and API.

## Project layout

```
js/              Library — sim engine + cauldron SDK + game framework
apps/            Runnable games (gem-digger demo)
plugins/         Optional extensions (grenade, …)
docs/            Live documentation UI
tests/           Behavior specs + golden snapshots
scripts/         Build, CI, layer checks
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full library vs game vs tooling split.

## Architecture (why it scales)

- **Materials** — register in catalog + one rule file with `behaviors[]` tests
- **Plugins** — external packages using `registerRule`, `registerToggle`, `behaviors[]`
- **Docs** — built from registry at runtime (`js/doc/build-catalog.js`), not hand-written pages
- **Tests** — same `behaviors[]` arrays power `npm test`, visual runner, and live docs demos

Adding 100,000 elements later = more rule modules + search in docs/UI (already capped/filtered).
