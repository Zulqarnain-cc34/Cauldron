# Cauldron

A falling-sand cellular automata **sandbox** you can run locally, extend with plugins, and document automatically from code.

## Quick start (sandbox)

```bash
npm start
```

Open in your browser:

| URL | What |
|-----|------|
| http://localhost:3456/ | **Sim** — paint and play |
| http://localhost:3456/docs/ | **Live docs** — materials & plugins with runnable tests |
| http://localhost:3456/help/ | **Help** — how to run, extend, and build plugins |
| http://localhost:3456/tests/ | **Test runner** — all behavior specs |

No build step. Static files + ES modules.

## Commands

```bash
npm start          # sandbox server (port 3456)
npm test           # 92 behavior + extension tests + layer check
npm run test:watch # rerun tests when js/plugins/tests change (background)
npm run verify     # alias for npm test
npm run setup:hooks # optional: run tests before each git commit
npm run check:layers  # import boundary enforcement
```

**You don't need to open `/tests/` every time.** Use CI (GitHub Actions), `test:watch` in a terminal tab, or optional git hooks. See [TESTING.md](TESTING.md).

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

See [plugins/README.md](plugins/README.md) and [help/index.html](help/index.html) for the full API.

## Project layout

```
js/           Core engine (catalog, physics, rules, UI) — do not fork for one-off effects
plugins/      Your extensions (grenade, custom tools, etc.)
docs/         Auto-generated live documentation UI
tests/        Behavior specs (also feed docs)
help/         Getting started & plugin authoring guide
```

## Architecture (why it scales)

- **Materials** — register in catalog + one rule file with `behaviors[]` tests
- **Plugins** — external packages using `registerRule`, `registerToggle`, `behaviors[]`
- **Docs** — built from registry at runtime (`js/doc/build-catalog.js`), not hand-written pages
- **Tests** — same `behaviors[]` arrays power `npm test`, visual runner, and live docs demos

Adding 100,000 elements later = more rule modules + search in docs/UI (already capped/filtered).
