# PROJECT CONTEXT — Cauldron

**Last Updated:** 2026-05-25  
**Version:** 0.1.0 (milestone: Gem Digger foundations — maps, inventory, gems, map HUD)

> **Canonical layout:** See [`ARCHITECTURE.md`](ARCHITECTURE.md) for library vs game decoupling.  
> Game kit lives in **`apps/gem-digger/lib/`** (not `js/game/`). There is no `cauldron/game` export.

---

## 1. PROJECT OVERVIEW

### What this project does

**Cauldron** is a browser-based **falling-sand cellular automata** simulation library and playable sandbox, inspired by Sandspiel. Players paint materials (sand, water, fire, stone, etc.) on a 2D grid; physics and reaction rules run each tick. The project is structured as a **layered, extensible library** with a public SDK (`js/cauldron/`) and a **plugin system** for game features (e.g., throwable grenades).

Recent product direction (in progress): evolve toward a **“Gem Digger”** game — dig through sand/terrain, collect gemstone pickups (diamonds), store them in backpack/jar inventories, complete per-map goals, and switch between map “levels” like separate app sessions.

### Who it's for / what problem it solves

| Audience | Need |
|----------|------|
| **Players / demo users** | Run locally, paint sand, throw grenades, collect gems |
| **Library authors** | Add materials, reactions, rules without forking core engine |
| **Plugin authors** | Build isolated features (grenade, future tools) via SDK |
| **Maintainers** | Self-documenting `behaviors[]` tests, golden snapshots, layer enforcement |

There is **no backend server application**. It is a static ES-module site served locally (`npm start`), with Node.js used only for testing and CI scripts.

### Tech stack summary (one paragraph)

The runtime is **vanilla JavaScript (ES modules)**, rendered with **p5.js 1.11.13** (loaded from jsDelivr CDN in `index.html`). The simulation kernel uses typed arrays (`Uint8Array` grid), deterministic LCG randomness, and a phased rule registry. UI is hand-built DOM (no React/Vue). Testing uses **Node.js 22** built-in test runner (`node --test`). CI runs `npm run release` via GitHub Actions. There is **no bundler, no TypeScript, no database, no LangGraph, no FastAPI**.

### Project maturity

**Estimated ~70% toward “Gem Digger v1” prototype.** Core sim, plugins, docs, and 89 golden behavior tests are stable. Game layer (maps, inventory, gems, HUD) is working in-session but **not persisted to disk**. Legacy/orphan files from a reverted 3D branch still exist on disk but are unused. Map authoring is code-only (line definitions, not a visual editor.

---

## 2. ARCHITECTURE

### High-level layer diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  L7 Tooling     tests/  docs/  help/  scripts/  .github/workflows/      │
├─────────────────────────────────────────────────────────────────────────┤
│  L6 Plugins     plugins/grenade/  plugins/acid-grenade/ (unregistered)  │
├─────────────────────────────────────────────────────────────────────────┤
│  L5 App         sketch.js  js/ui/  js/input.js  js/render.js  js/app/  │
│                 js/game/  (maps, inventory, gems — NOT core sim)        │
├─────────────────────────────────────────────────────────────────────────┤
│  L4 SDK         js/cauldron/  ◄── PUBLIC API (plugin, app, game, …)     │
├─────────────────────────────────────────────────────────────────────────┤
│  L3 Runtime     js/sim/  js/rules/  (registry, manifest, toggles)       │
├─────────────────────────────────────────────────────────────────────────┤
│  L2 Engine      js/engine/  (scanner, physics primitives, cell-api)     │
├─────────────────────────────────────────────────────────────────────────┤
│  L1 Catalog     js/catalog/  (species, materials, tags, colors)         │
├─────────────────────────────────────────────────────────────────────────┤
│  L0 Kernel      js/world.js  (grid, RNG, brush, agents)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### How major components interact

```
index.html
   └── sketch.js (p5 host)
         ├── bootstrapSandbox()     → rules, plugins, lifecycle
         ├── World (single grid)    → shared by sim + game layer
         ├── setupInput()           → paint/erase on canvas
         ├── MapManager             → tab sessions swap world state
         ├── installGemSystem()     → gem physics + collect input
         ├── mountPanel/backpack/jar/map-tabs/map-hud
         └── p.draw loop:
               runRules(world) → renderWorld → renderPlugins → gems.render
```

**Single World instance:** One `World` object holds the active grid. `MapManager` **snapshots and restores** the entire world state (cells, inventories, gems, toggles) when switching map tabs. This mimics “two apps” without multiple canvas instances.

### Data flow (input → processing → output)

1. **Input:** Mouse on canvas → `queueBrush` / gem collect (capture phase) / grenade throw (keyboard G).
2. **Tick:** If not paused, `runRules(world)` advances `world.tick` and runs phases: `emitters → materials → reactions → life → forces → agents → brush`.
3. **Materials phase:** Scanner walks active species; each material’s updater moves/transforms cells.
4. **Game layer tick:** `tickGemPickups(world)` — gems fall through empty/water.
5. **Render:** `renderWorld` uploads pixel buffer; plugins/gems draw overlays; p5 scales canvas by `DISPLAY_SCALE` (1.3).
6. **Map switch:** `captureMapSession` → store in `MapManager.sessions` → `applyMapSession` for target map → UI sync callbacks.

### Key design decisions and WHY

| Decision | Why |
|----------|-----|
| **Strict layering + `check:layers`** | Prevents plugins importing UI; keeps kernel pure at scale |
| **SDK subpaths** (`cauldron/plugin.js`, `app.js`, `game.js`) | Minimal surface for each audience; tree-shaking friendly |
| **Register, don’t edit god-files** | New materials = one manifest line; new plugins = one `registerPlugin` |
| **`behaviors[]` as single test source** | Same specs feed `npm test`, `/docs/` demos, golden snapshots |
| **Game layer separate from L3 sim** | Inventory/maps/gems are not cell physics — avoids polluting rules |
| **Map sessions in RAM** | Fast tab switching; persistence deferred to Phase 2 |
| **Spawn vs collect as separate APIs** | Clear game design: `spawnGemPickup` ≠ `tryCollectGem` |
| **Reverted 3D branch** | User chose 2D path; 3D render files left orphaned intentionally (see §10) |

---

## 3. TECH STACK & VERSIONS

| Technology | Version | Role | Why chosen |
|------------|---------|------|------------|
| **JavaScript (ES modules)** | — | Entire codebase | No build step; import maps via relative paths |
| **p5.js** | **1.11.13** (CDN) | Canvas + draw loop | Simple 2D pixel rendering; familiar creative-coding API |
| **Node.js** | **22** (CI/local test) | Test runner, scripts | Native `node --test`; no Jest dependency |
| **serve** | via `npx serve` | Static dev server | Zero config; port **3456** |
| **GitHub Actions** | checkout@v4, setup-node@v4 | CI | Runs `npm run release` on push/PR |

### Non-obvious configurations

- **`"type": "module"`** in `package.json` — all `.js` files are ESM.
- **Package exports** map subpaths (`cauldron/game`, `cauldron/plugin`, etc.) — plugins must import SDK paths only.
- **Grid size:** `280×200` cells, `CELL_PX=2`, displayed at **`DISPLAY_SCALE=1.3`** → canvas ~728×520 px.
- **Cell stride:** 5 bytes per cell in `Uint8Array` (species, flags, ra, rb, clock).
- **No `.env` file** — nothing to configure for local run except Node/npm.

---

## 4. PROJECT STRUCTURE

### Full tree with descriptions

```
project/
├── index.html              # Main sim entry — p5 CDN, map tabs, sim host
├── sketch.js               # ★ PRIMARY APP ENTRY — p5 setup/draw, wires all UI/game
├── styles.css              # All UI styling (panel, inventories, map tabs, HUD)
├── package.json            # Scripts, exports map, version 0.1.0
├── README.md               # Quick start, commands
├── ARCHITECTURE.md         # Layer rules (authoritative for imports)
├── EXTENDING.md            # How to add materials/plugins
├── TESTING.md              # Test workflow, golden snapshots
├── context.md              # ★ THIS FILE — onboarding context for AI/devs
│
├── assets/
│   ├── backpack.png        # Toolbar + inventory icon
│   ├── jar.png
│   ├── grenade.png
│   └── diamond.png         # Gem pickup + inventory icon
│
├── js/
│   ├── world.js            # ★ L0 World class, GRID_W/H, display scaling
│   ├── materials.js        # Back-compat re-export → prefer js/catalog/*
│   ├── input.js            # Mouse brush painting, buildBrushTools()
│   ├── render.js           # ★ 2D pixel buffer render (active path)
│   ├── render-canvas.js    # Alternate render helper (legacy/auxiliary)
│   ├── cell-api.js         # Back-compat re-export of engine/cell-api
│   │
│   ├── catalog/            # L1 — species ids, materials, physics, colors, tags
│   │   ├── species.js      # Species enum (SAND, WATER, …)
│   │   ├── materials.js    # Material defs (density, color, tags)
│   │   ├── cell-color.js   # Burn glow rendering
│   │   ├── physics.js      # Mobility, gravity direction
│   │   ├── tags.js
│   │   ├── rule-defaults.js
│   │   ├── rule-toggle-catalog.js
│   │   ├── species-allocator.js  # Plugin species ID allocation
│   │   ├── material-queries.js
│   │   └── ascii-map.js    # ASCII grid encoding for tests
│   │
│   ├── engine/             # L2 — movement primitives, scanner
│   │   ├── scanner.js
│   │   ├── primitives.js   # tryMoveDown, trySpreadHorizontal, …
│   │   ├── cell-api.js
│   │   └── material-physics.js
│   │
│   ├── rules/              # L3 — material rule modules + registry
│   │   ├── registry.js     # ★ runRules(), PHASES, registerRule()
│   │   ├── reactions-module.js
│   │   ├── reactions.js
│   │   ├── shared/combust.js
│   │   └── materials/      # One file per material (sand, water, fire, …)
│   │
│   ├── sim/                # L3 runtime infrastructure
│   │   ├── manifest.js     # ★ Lists all core rule defs
│   │   ├── rule-store.js
│   │   ├── test-registry.js # Compiles behaviors → test suites
│   │   ├── toggle-registry.js
│   │   ├── lifecycle.js    # onWorldReset hooks
│   │   ├── world-slice.js  # ASCII test grid slices
│   │   ├── reaction-store.js
│   │   ├── brush-registry.js
│   │   └── …
│   │
│   ├── cauldron/           # ★ L4 PUBLIC SDK
│   │   ├── index.js        # Barrel export
│   │   ├── plugin.js       # Plugin authors
│   │   ├── app.js          # Host apps (sim + render + input)
│   │   ├── game.js         # Maps, inventory, gems
│   │   ├── bootstrap.js    # bootstrapSandbox()
│   │   ├── extend.js       # Material packs, allocateSpecies
│   │   └── tooling.js      # Docs/test-proxy
│   │
│   ├── game/               # L5 game features (NOT sim physics)
│   │   ├── inventory/      # Backpack 9×3, jar 4×2, item catalog
│   │   ├── maps/           # ★ Active map system
│   │   │   ├── manager.js  # MapManager — tab switch engine
│   │   │   ├── session.js  # capture/apply MapSession snapshots
│   │   │   ├── registry.js # MapDefinition registry
│   │   │   ├── goals.js    # Gem goal progress computation
│   │   │   └── definitions/
│   │   │       ├── sandbox.js
│   │   │       ├── workshop.js
│   │   │       └── index.js  # BUILTIN_MAPS
│   │   └── gems/           # Pickup spawn, collect, render, input
│   │
│   ├── ui/                 # L5 DOM UI (imports cauldron/app + game)
│   │   ├── panel.js        # Top bar, brush, rules, pause/reset
│   │   ├── map-tabs.js     # Sandbox | Workshop tabs
│   │   ├── map-hud.js      # Map name, description, gem progress
│   │   ├── backpack.js / jar.js / inventory-ui.js / rule-picker.js
│   │
│   ├── app/rules.js        # App-level brush rule registration
│   ├── plugins/host.js     # registerPlugin, initPlugins, renderPlugins
│   ├── doc/                # Runtime doc catalog builder
│   │
│   ├── maps/               # ⚠ ORPHAN — duplicate of old map path; NOT imported
│   └── render/             # ⚠ ORPHAN — 3D WebGL files from reverted branch; NOT imported
│
├── plugins/
│   ├── index.js            # ★ Plugin manifest — registers grenade only
│   ├── grenade/            # Active throwable grenade plugin
│   ├── acid-grenade/       # ⚠ EXISTS but NOT registered in plugins/index.js
│   └── _template/          # Copy for new plugins
│
├── docs/                   # Live documentation UI (/docs/)
├── help/                   # Help pages (/help/)
├── tests/                  # Node tests + browser test runner (/tests/)
└── scripts/                # CI gates: layers, behaviors, snapshots, coverage
```

### Critical vs boilerplate

| Critical (touch with care) | Boilerplate / optional |
|----------------------------|------------------------|
| `js/world.js`, `js/rules/registry.js`, `js/sim/manifest.js` | `js/maps/` (orphan duplicate) |
| `js/cauldron/*`, `sketch.js`, `plugins/index.js` | `js/render/` (orphan 3D) |
| `js/game/maps/*`, `js/game/gems/*`, `js/game/inventory/*` | `plugins/acid-grenade/` (dormant) |
| `tests/snapshots/behaviors.json` | `tests/exports/*` (LLM audit artifacts) |

### Entry points

| URL / File | Purpose |
|------------|---------|
| **`/` → `index.html` + `sketch.js`** | Main playable sim |
| **`/docs/`** | Live material/plugin documentation |
| **`/help/`** | Authoring guide |
| **`/tests/`** | Browser test runner (debug) |
| **`tests/run-node.js`** | Headless behavior test entry (via `npm test`) |

---

## 5. CORE MODULES & COMPONENTS

### L0 — `World` (`js/world.js`)

**What:** Dense grid simulation state.

**Key API:**
- `get(x,y)` / `set(x,y, cell)` — cell access (species, flags, ra, rb)
- `reset()` — clears grid, fires lifecycle hooks
- `rand()` / `randInt()` — deterministic LCG
- `brush` — `{ species, radius, queue[] }` for deferred painting
- `ruleEnabled` — toggle map for rules/plugins
- `agents[]` — non-cell entities (grenades)
- `plugin` — plugin-owned namespaced state (serialized in map sessions)
- `backpack` / `jar` — added by game layer (not in constructor)
- `gemPickups[]` — added by gem system

**Gotcha:** `world.js` imports `./materials.js` (shim), not `./catalog/` directly.

---

### L3 — Rule engine (`js/rules/registry.js`)

**Phases (in order):** `emitters`, `materials`, `reactions`, `life`, `forces`, `agents`, `brush`

**Key functions:**
- `runRules(world, { only?: string[] })` — one simulation tick
- `registerRule(phase, { id, enabled, run })` — extend sim

**Gotcha:** `materials` phase uses scanner + updaters; other phases run registered rules directly. Plugin grenade registers in `agents` and `forces`.

---

### L4 — Bootstrap (`js/cauldron/bootstrap.js`)

**Sequence:**
1. `registerAppRules()` — brush application rule
2. `loadPlugins()` — dynamic import `plugins/index.js`
3. `onWorldReset(resetPlugins)`
4. `initPlugins({ world, canvas })`
5. `syncRuleEnabledDefaults(world)`

**Gotcha:** `bootstrapSandbox` does **not** paint map terrain — that is `MapDefinition.bootstrap()` via `MapManager.init()`.

---

### Game — MapManager (`js/game/maps/manager.js`)

**What:** Per-tab session engine.

**Key methods:**
- `init(mapId)` — first load
- `switchTo(mapId)` — persist current → restore target
- `resetActiveMap()` — re-run bootstrap; keeps inventories unless `resetClearsInventory`
- `resetAllMaps()` — wipe all saved sessions

**Connects to:** `session.js` (snapshots), `registry.js` (definitions), gem/inventory modules.

**Gotcha:** `onSwitch` callback is **wrapped** by both `map-tabs.js` and `map-hud.js` — order matters (last mounted wraps first).

---

### Game — MapSession (`js/game/maps/session.js`)

**Serialized fields:**
```javascript
{
  mapId, label, tick, seed,
  cells: Uint8Array,
  agents: object[],
  paused, brush, ruleEnabled, plugin,
  backpack, jar,
  gemPickups: GemPickup[],
  custom: {}
}
```

**Gotcha:** Grid size must match on apply or throws.

---

### Game — Gems (`js/game/gems/`)

| Module | Responsibility |
|--------|----------------|
| `pickups.js` | `spawnGemPickup`, `tickGemPickups` (fall), session clone/set |
| `collect.js` | `tryCollectGem` → backpack or jar |
| `input.js` | Alt+click → backpack; Alt+Shift → jar; right-click collect |
| `render.js` | Draw diamond sprites on canvas |
| `index.js` | `installGemSystem(p, world, canvas, { onCollected })` |

**Gotcha:** Gem collect uses **capture-phase** mousedown to preempt erase. Right-click collect only blocks erase when a gem is actually hit.

---

### Game — Inventory (`js/game/inventory/`)

- **Backpack:** 9×3 slots (`BACKPACK_COLS/ROWS`)
- **Jar:** 4×2 slots
- **Items:** sand, water, stone, grenade, diamond (`item-catalog.js`)
- **API:** `addStack`, `removeStack`, `countItem`, `createBackpackInventory`, …

**Gotcha:** Materials on grid ≠ inventory items unless collected via game mechanics.

---

### UI modules (`js/ui/`)

| Module | Role |
|--------|------|
| `panel.js` | Top bar: title, **map-hud host**, pause, reset, tick; side brush/rules |
| `map-tabs.js` | Tab buttons + keyboard `1`/`2` |
| `map-hud.js` | Active map label, description, diamond progress, “Level complete” |
| `backpack.js` / `jar.js` | Toolbar buttons, modal overlays; hotkeys **E** / **J** |
| `inventory-ui.js` | Shared slot grid renderer |
| `rule-picker.js` | Searchable rule toggle dropdown |

---

### Plugin — Grenade (`plugins/grenade/`)

**Registered in** `plugins/index.js`.

**Features:** Throw with **G** or middle-click; arc + blast; toggled via `world.ruleEnabled.grenade`.

**Tests:** 3 plugin behaviors included in golden snapshot suite.

---

## 6. LANGGRAPH AGENT ARCHITECTURE

**NOT APPLICABLE.** This project has no LangGraph, no LLM agents, and no agent orchestration graph.

### Equivalent: Simulation tick pipeline

Instead of agent nodes, Cauldron uses a **fixed-phase rule pipeline** each frame:

```
┌─────────────┐
│  Input      │  mouse brush, gem collect, grenade throw
└──────┬──────┘
       ▼
┌─────────────┐
│  runRules   │  for each phase in PHASES:
│  (1 tick)   │    for each rule in phase:
└──────┬──────┘      if enabled → rule.run(world)
       ▼
┌─────────────┐
│  Game tick  │  tickGemPickups (gems fall)
└──────┬──────┘
       ▼
┌─────────────┐
│  Render     │  renderWorld → renderPlugins → renderGemPickups
└─────────────┘
```

### State schema (World + session)

There is no LangGraph `StateGraph` — state is the **`World` object** plus optional **`MapSession` snapshots**:

| State field | Type | Flow |
|-------------|------|------|
| `cells` | `Uint8Array` | Mutated every tick by rules |
| `tick` | number | Incremented in `runRules` |
| `ruleEnabled` | `Record<string, boolean>` | UI toggles / map session |
| `agents` | array | Grenade projectiles |
| `plugin` | object | Plugin namespaced data |
| `gemPickups` | array | Spawn/collect game layer |
| `backpack` / `jar` | SlotInventory | Per-map session |

### “Tools” available to plugins (PluginSetupContext)

Via `registerPlugin` → `setup(ctx)`:

- `ctx.registerRule(phase, rule)`
- `ctx.registerToggle({ key, id, label, … })`
- `ctx.registerRender(fn)`
- `ctx.registerMaterialPack`, `registerReaction`, `registerBrushTool`, `registerRuleDef`
- `ctx.onReset(fn)`, `ctx.getState(key)`

### Memory / persistence

| Layer | Persistence |
|-------|-------------|
| In-session map tabs | RAM via `MapManager.sessions` |
| Page refresh | **Lost** (no localStorage yet) |
| Golden snapshots | `tests/snapshots/behaviors.json` (test regression only) |

---

## 7. FASTAPI ROUTES & ENDPOINTS

**NOT APPLICABLE.** There is no FastAPI, no HTTP API server, and no REST endpoints.

### Equivalent: Static “routes” (pages)

| Path | Method | Purpose |
|------|--------|---------|
| `/` | GET | Main sim (`index.html`) |
| `/docs/` | GET | Live documentation browser |
| `/help/` | GET | Help / plugin authoring |
| `/tests/` | GET | Visual test runner |
| `/assets/*` | GET | PNG icons (backpack, jar, grenade, diamond) |
| `/js/*` | GET | ES module sources |

**Server:** `npx serve . -p 3456` — static file only.

### Authentication / middleware / background tasks

**None.**

---

## 8. DATA MODELS & SCHEMAS

**NOT APPLICABLE (Pydantic/SQLAlchemy).** All models are plain JavaScript objects and typedefs (JSDoc).

### Cell (runtime)

```javascript
{ species: uint8, flags: uint8, ra: uint8, rb: uint8 }
// + clock byte at index+4 in flat array
```

### ItemDef (`js/game/inventory/item-catalog.js`)

```javascript
{
  id: string,           // e.g. 'diamond'
  label: string,
  kind: 'material' | 'tool' | 'gem',
  stackSize: number,
  species?: number,     // for materials
  icon?: string         // for tools/gems
}
```

### SlotInventory

```javascript
{ cols: number, rows: number, slots: (Stack|null)[] }
// Stack: { itemId, count, label? }
```

### GemPickup

```javascript
{ id: string, itemId: string, is: 'diamond', x: number, y: number, count: number }
```

### MapDefinition (`js/game/maps/registry.js`)

```javascript
{
  id: string,              // slug, e.g. 'sandbox'
  label: string,           // tab title
  description?: string,    // HUD objective text
  bootstrap: (world) => void,
  seed?: number,
  defaultPaused?: boolean,
  defaultBrush?: { species?, radius? },
  defaultRules?: Record<string, boolean>,
  resetClearsInventory?: boolean,
  goals?: { gems?: Record<string, number> },  // e.g. { diamond: 3 }
  hooks?: { afterBootstrap, capture, apply, initialCustom }
}
```

### MapSession — see §5 (full snapshot for tab switching)

### Plugin definition

```javascript
{
  id: string,
  apiVersion?: number,
  setup: (ctx) => void,
  behaviors?: BehaviorSpec[],
  suiteLabel?: string,
  doc?: { summary, controls }
}
```

### BehaviorSpec (tests/docs)

```javascript
{
  id, name,
  slice: { rows: string[] },  // ASCII grid
  expect: string[],
  scope: { rules: string[] },
  steps?: number,
  inspect?: (world) => void   // optional internal state assert
}
```

### Validation logic

- `registerMapDefinition` throws if missing `id` or `bootstrap`
- `registerPlugin` throws on duplicate id
- `applyMapSession` throws on grid size mismatch
- `spawnGemPickup` returns null if out of bounds or unknown item
- Layer checker enforces import boundaries at CI time

---

## 9. ENVIRONMENT & CONFIGURATION

### Environment variables

**None required.** The project runs entirely client-side with a static server.

### External services

| Service | Usage |
|---------|--------|
| **jsDelivr CDN** | Loads p5.js in `index.html` |
| **GitHub** | Remote repo, CI (`Zulqarnain-cc34/Cauldron`) |

### Secrets management

**None.** No API keys, no `.env` files in use.

### Optional local setup

- `npm run setup:hooks` — installs git pre-commit/pre-push hooks running tests

---

## 10. CURRENT STATE OF THE PROJECT

### Fully working and stable

- 2D falling-sand simulation with **17 core rule modules** (sand, water, fire, …)
- **89 golden behavior tests** + CI gates (layers, coverage, snapshots)
- Plugin system with **grenade** registered and tested
- Live docs (`/docs/`) and help pages
- **Map tab switching** (Sandbox / Workshop) with isolated sessions
- **Backpack + jar** inventories with UI (E / J hotkeys)
- **Gem system:** spawn, fall, collect, render
- **Map HUD:** name, description, diamond progress, level complete badge
- Keyboard: Space pause, R reset, 1/2 map tabs, G grenade

### Partially implemented

- **Gem Digger game loop** — goals exist; no win screen beyond HUD badge; no sound/particles
- **Map authoring** — code-only bootstrap functions; no JSON editor
- **Inventory ↔ world** — collect gems works; placing inventory items back on grid not implemented
- **TESTING.md** says “92+ tests” but `npm test` currently reports **94** Node tests + separate check scripts

### Broken / known issues

- **`js/maps/` orphan directory** — duplicate of pre-refactor map code; **not imported** anywhere active. Safe to delete but still on disk.
- **`js/render/` WebGL/3D files** — leftover from reverted 3D branch; **not imported** by active `render.js`.
- **`plugins/acid-grenade/`** — code exists but **not registered** in `plugins/index.js` (intentionally dropped when reverting to 2D).
- **No persistence** — refreshing browser loses all map progress.
- **Panel reset button** calls `world.reset()` before `mapManager.resetActiveMap()` — redundant double-reset (harmless but messy).

### Not started (planned)

- **Phase 2:** `localStorage` save/load for `MapManager.sessions`
- **Phase 3:** Map thumbnails, win screen, map select polish
- **Phase 4:** Visual/json map authoring tool
- Additional gem types (user to supply PNGs per gem)
- Deploying inventory items (grenade) from backpack onto canvas

### Explicitly decided NOT to do (for now)

- **3D voxel rendering** — reverted; remote was force-pushed to 2D history (2026-05-25)
- **Acid grenade plugin** — present on disk but not registered
- **Backend/API** — remains static client-only

---

## 11. RECENT CHANGES & DECISIONS LOG

| When | What | Why | Files |
|------|------|-----|-------|
| 2026-05-25 | Map HUD + goals | Professional game UI — show map name, objective, gem progress | `map-hud.js`, `goals.js`, sandbox/workshop defs, styles |
| 2026-05-25 | Map tab styling + keyboard 1/2 | Visible level switching | `map-tabs.js`, `styles.css` |
| 2026-05-25 | Gem system (spawn ≠ collect) | Gem Digger mechanics | `js/game/gems/*`, catalog, session |
| 2026-05-25 | Game layer refactor | Move maps/inventory out of sim | `js/game/`, `js/cauldron/game.js`, ARCHITECTURE |
| 2026-05-25 | Force push main to 2D history | Remote had 3D commits; user reverted locally | git only |
| 2026-05-25 | Display scale 1.3 | ~30% larger canvas | `world.js`, styles |
| 2026-05-25 | Backpack/jar UI | Minecraft-style inventory | `js/ui/backpack.js`, `jar.js`, assets |
| 2026-05-25 | Map session snapshots | Tab = separate app state | `session.js`, `manager.js` |
| 2026-05-25 | Sandbox import path fix | Wrong `../gems` broke maps-session test | `definitions/sandbox.js` |
| Earlier | Layer checker + SDK split | Scale to many plugins/materials | `scripts/check-layers.mjs`, `js/cauldron/*` |
| Earlier | Golden behavior snapshots | Regression without manual test review | `tests/snapshots/behaviors.json` |
| Earlier | Grenade plugin | Throwable explosive | `plugins/grenade/` |
| Earlier | 17 Sandspiel-like materials | Core sim parity | `js/rules/materials/*` |
| Earlier | Revert from 3D branch | User preference for 2D gameplay | removed from active path |

---

## 12. BUGS & FIXES LOG

### Fixed

| Bug | Cause | Fix |
|-----|-------|-----|
| Maps session test module not found | `sandbox.js` imported `../../gems` instead of `../../gems` from wrong folder (`../gems/pickups` from definitions resolved to `js/game/maps/gems/`) | Corrected to `../../gems/pickups.js` |
| Map tabs invisible | No CSS for `#map-tabs` | Added fixed tab bar styles |
| Remote/local diverged after revert | Local 2D commits vs remote 3D commits | `git push --force-with-lease origin main` |
| UI not syncing on map switch | Brush/rules not refreshed | `syncSessionUi()` calls `syncBrush`, `syncRules`, `mapHud.refresh` |

### Open / known

| Issue | Severity | Workaround |
|-------|----------|------------|
| No save on refresh | Medium | Keep tab open; Phase 2 planned |
| Orphan `js/maps/` + `js/render/` dirs | Low | Ignore; do not import |
| `acid-grenade` dormant | Low | Register in `plugins/index.js` if needed |
| Double reset on R/button | Low | `resetActiveMap` re-bootstraps anyway |
| Gem right-click vs erase | Low | Collect handler runs capture phase; erase skipped only on successful collect |

---

## 13. IMPORTANT PATTERNS & CONVENTIONS

### Naming

- **Map ids:** lowercase slug (`sandbox`, `workshop`)
- **Rule ids:** kebab-case (`sand`, `grenade-blast`)
- **Plugin ids:** lowercase (`grenade`)
- **Item ids:** lowercase (`diamond`, `sand`)
- **Files:** kebab-case for multi-word (`map-hud.js`, `slot-inventory.js`)

### Import rules (enforced by CI)

- Plugins → **`js/cauldron/plugin.js` only**
- UI/sketch → **`cauldron/app.js` + `cauldron/game.js`**
- Game layer → L0–L3 + `js/game/*` (never `js/ui/`)
- Sim → L0–L2 only

### Error handling

- Registration functions **throw** on duplicates/invalid defs
- Tests use `assert.equal` with grid diff output
- Plugins warn on API version mismatch (console.warn)

### Logging

- Minimal production logging
- No structured logger; `console.warn` in plugin host only

### Repeating patterns

1. **Register, don’t mutate core lists** — manifest, plugin index, map registry
2. **`behaviors[]` colocated with feature** — tests + docs auto-wire
3. **Mount functions return `{ refresh }`** — UI sync pattern
4. **Session capture/apply** — clone via `structuredClone` / `Uint8Array` copy
5. **Separate spawn vs collect** for game entities

---

## 14. EXTERNAL DEPENDENCIES & INTEGRATIONS

| Dependency | Integration | Auth | Constraints |
|------------|-------------|------|-------------|
| **p5.js (jsDelivr)** | `<script>` in index.html | None | Requires network on first load unless cached |
| **serve (npx)** | Dev static server | None | Port 3456 |
| **GitHub Actions** | CI on push/PR | Repo token (CI) | Runs `npm run release` |
| **Node.js built-in test** | Headless tests | None | Node 22 recommended |

No databases, payment APIs, auth providers, or LLM APIs in runtime.

---

## 15. TESTING

### What exists

| Type | Location | Count / scope |
|------|----------|---------------|
| **Behavior tests (headless)** | `tests/run-node.js` | **89** material/plugin scenarios from registry |
| **Extension API test** | `tests/extension-api.test.js` | SDK surface |
| **Map session test** | `tests/maps-session.test.js` | Inventory isolation |
| **Map switch test** | `tests/maps-switch.test.js` | Tab session separation |
| **Gem tests** | `tests/gems.test.js` | Spawn vs collect |
| **Map goals test** | `tests/maps-goals.test.js` | HUD progress logic |
| **Golden snapshots** | `tests/snapshots/behaviors.json` | All behavior outcomes |
| **Layer check** | `scripts/check-layers.mjs` | Import boundaries |
| **Behavior quality** | `scripts/check-behaviors.mjs` | Weak test detection |
| **Coverage check** | `scripts/check-coverage.mjs` | Untested materials |
| **Browser runner** | `/tests/` | Visual debug |

### How to run

```bash
npm test          # Full gate (94 node tests + checks)
npm run release   # Pretty summary — use before ship
npm run test:watch
npm run snapshot:update   # After intentional sim changes
```

### Not tested yet

- Browser E2E (Playwright/Cypress) — manual only
- Map HUD DOM integration
- localStorage persistence (not implemented)
- Full p5 render pipeline in Node (software render only via behavior grids)

---

## 16. HOW TO RUN THE PROJECT

### From scratch

```bash
git clone git@github.com:Zulqarnain-cc34/Cauldron.git
cd Cauldron
npm start
```

Open http://localhost:3456/

### Prerequisites

- Node.js **22+** (for tests/CI)
- npm
- Modern browser with ES module support

### No seeding required

Maps bootstrap automatically on first tab visit via `MapManager.init('sandbox')`.

### Verify install

```bash
npm test
# Expect: pass 94, fail 0, all check:* OK
```

---

## 17. NEXT STEPS & ROADMAP

### Immediate next tasks (where work left off)

1. **Phase 2 — localStorage persistence** for `MapManager.sessions` + active map id
2. **Third map level** — first custom “Gem Digger” cave using template in `definitions/`
3. **Win screen** — modal when `allComplete` (HUD badge exists; full screen not done)
4. **Cleanup orphans** — delete `js/maps/` duplicate and unused `js/render/` 3D files (confirm with user first)

### Short-term goals

- More gem types in `ITEM_CATALOG` + PNG assets
- Map definition `gemSpawns` array (declarative vs hardcoded in bootstrap)
- Deploy grenade from backpack to world
- Optional map thumbnails in tab bar

### Long-term goals

- JSON/visual map editor
- Multiplayer — **not planned** (architecture is single-player local)
- npm package publish — exports exist in `package.json` but primary use is local sandbox

### Do NOT pursue without explicit request

- Re-introducing 3D/WebGL rendering path
- Registering acid-grenade without UX review
- Adding React/build toolchain
- Force-pushing git history

---

## 18. CONTEXT FOR AI ASSISTANTS

### Preferred coding style

- **Minimal diffs** — solve the ticket, don’t refactor adjacent code
- **Match existing patterns** — mount/refresh UI, register APIs, JSDoc typedefs
- **ES modules** — relative imports, no CommonJS
- **No TypeScript** unless project converts wholesale
- **Comments** only for non-obvious business logic

### Never change without explicit request

- `tests/snapshots/behaviors.json` (use `npm run snapshot:update` with intentional sim changes)
- Layer import rules / crossing L6→L5 boundaries
- Git history (no force push to main unless user asks)
- `world.js` cell stride / grid format
- Golden behavior expected outcomes without user approval

### Recurring mistakes to avoid

1. Importing `js/ui/` from `js/game/` or `js/sim/` (layer violation)
2. Putting inventory/gem logic inside material rules (wrong layer)
3. Importing from orphan `js/maps/` instead of **`js/game/maps/`**
4. Using wrong gem import path from map definitions (`../../gems/` not `../gems/`)
5. Calling `bootstrapSandbox` expecting map terrain — terrain comes from **`MapDefinition.bootstrap`**
6. Assuming 3D render files are active — **`js/render.js`** is the 2D path
7. Registering plugins without adding to **`plugins/index.js`**
8. Forgetting to export new game APIs from **`js/cauldron/game.js`**

### Final decisions (do not re-debate)

- **2D p5 pixel renderer** is the active rendering path
- **Game layer (`js/game/`)** owns maps, inventory, gems — not sim rules
- **Map tabs = separate sessions** in one World instance
- **Gem spawn and collect are separate actions** (`spawnGemPickup` vs `tryCollectGem`)
- **Plugins use `cauldron/plugin.js` SDK only**
- **Tests are behavior-driven** — don’t hand-edit snapshot JSON without running update script

### Key commands cheat sheet

```bash
npm start                    # play
npm test                     # verify
npm run snapshot:update      # after sim behavior change
npm run check:layers         # import boundaries only
```

### Key files for common tasks

| Task | Files |
|------|-------|
| Add map | `js/game/maps/definitions/*.js`, `definitions/index.js` |
| Add item | `js/game/inventory/item-catalog.js`, asset PNG |
| Add material | `catalog/species.js`, `rules/materials/foo.js`, `sim/manifest.js` |
| Add plugin | `plugins/my-thing/`, `plugins/index.js` |
| Wire UI | `sketch.js`, `js/ui/*`, `styles.css` |
| Public game API | `js/cauldron/game.js` |

---

*End of context document. When in doubt, read `ARCHITECTURE.md` for layer rules and `TESTING.md` for verification workflow.*
