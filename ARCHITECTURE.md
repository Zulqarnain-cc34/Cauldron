# Cauldron architecture

Structured for a **growing library** — four buckets, one rule per bucket.

```
cauldron/
├── js/                 LIBRARY (sim + SDK + game framework)
├── apps/               BROWSER APPS (game, docs site, test UI)
├── plugins/            OPTIONAL EXTENSIONS
└── tooling/
    ├── tests/          Node test harness + snapshots
    └── scripts/        build, CI, layer checks
```

---

## Should you keep it like this?

**Yes — shift complete.** The old layout scattered browser apps (`docs/`, `tests/` UI) and Node tooling (`scripts/`) at the repo root next to the library. That made it hard to see what was “the library” vs “stuff around the library.”

Now:

| Bucket | Contains | Shipped to games? |
|--------|----------|-------------------|
| `js/` | Everything you import | Yes |
| `apps/` | HTML pages that use the library | No (examples) |
| `plugins/` | Optional extensions | Optional |
| `tooling/` | `npm test`, CI, snapshots | No |

---

## `js/` — the library

```
js/
├── world.js              grid, RNG, brush
├── catalog/              species, materials, physics
├── engine/               movement, scanner
├── rules/                material rules + behaviors[] specs
├── sim/                  registry, manifest, tick pipeline
├── cauldron/             PUBLIC SDK — only import from here
├── game/
│   ├── worldgen/         algorithms (CA, caverns, veins)
│   ├── maps/             MapManager, sessions
│   ├── inventory/        backpack, jar
│   ├── gems/             collect, render
│   └── content/          demo levels (your game replaces this)
├── doc/                  catalog builder (used by apps/docs)
├── input.js, render.js   host helpers
└── plugins/host.js       plugin registry
```

**Layers:** L0 kernel → L1 catalog → L2 engine → L3 rules/sim → **L4 cauldron SDK** → L5 game framework.

---

## `apps/` — browser apps (not the library)

| App | URL |
|-----|-----|
| Gem Digger demo | `/apps/gem-digger/` |
| Live docs | `/apps/docs/` |
| Visual test runner | `/apps/test-runner/` |

Root `/` redirects to the game. Old `/docs/` and `/tests/` redirect to the new paths.

Each app is just `index.html` + JS that imports `../../js/cauldron/`.

---

## `plugins/` — extensions

Same pattern as npm plugins. Import **`js/cauldron/plugin.js` only**.

Example: `plugins/grenade/` — blast tool, sprite render.

---

## `tooling/` — development only

### `tooling/tests/`

| Part | Role |
|------|------|
| `run-node.js` | `npm test` entry |
| `helpers/` | grid harness, ASCII compare |
| `snapshots/` | golden expected outcomes |
| `exports/` | LLM audit bundles |

**Specs live in the library** (`behaviors[]` on each rule). `tooling/tests/` is the runner — like Jest or Vitest for this project.

### `tooling/scripts/`

Build validation, layer boundary checks, snapshot compare, release gate.

---

## Register pattern (core + plugins + worldgen + maps)

Everything extends via registries — never edit god-files:

```javascript
registerPlugin(grenadePlugin);
registerMaterialPack({ id: 'gravel', ... });
registerWorldGenerator('cavern', generateCavernWorld);
registerMapDefinition(myLevel);
```

Compose algorithms in maps:

```javascript
worldGenerator: 'cavern',
worldGeneratorOptions: { oreVeins: [...] },
```

---

## Import rules

Enforced by `npm run check:layers`:

- Plugins → `js/cauldron/*` only
- `js/sim/` → never imports `js/game/`
- `js/game/` → never imports `apps/`
- `apps/*/ui/` → import SDK barrels, not deep paths

---

## npm scripts

```bash
npm run build      # library modules resolve
npm test           # 89 behavior specs (tooling/tests)
npm run verify     # build + test + layers + snapshots
npm run release    # single release verdict
```

---

## Build your big game

1. Keep extending **`js/game/worldgen/`** with new algorithms
2. Register and compose them in **`js/game/content/`** (or your own content folder)
3. Copy **`apps/gem-digger/`** as your app shell
4. Never fork **`js/rules/`** for one-off effects — use plugins or worldgen options

The library stays stable. You swap algorithms, maps, and apps on top.
