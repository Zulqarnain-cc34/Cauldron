# Cauldron architecture

How this repo is organized: **library first**, demo game second, tooling at the edges.

---

## The big picture

```
┌─────────────────────────────────────────────────────────────┐
│  TOOLING (not shipped)     tests/  docs/  scripts/  .github │
├─────────────────────────────────────────────────────────────┤
│  YOUR GAME (optional)      apps/gem-digger/                 │
├─────────────────────────────────────────────────────────────┤
│  GAME FRAMEWORK (optional) js/game/  maps, worldgen, gems   │
├─────────────────────────────────────────────────────────────┤
│  PUBLIC SDK                js/cauldron/  ← import from here │
├─────────────────────────────────────────────────────────────┤
│  SIM ENGINE                js/world.js, catalog, engine,    │
│                            rules, sim, plugins/             │
└─────────────────────────────────────────────────────────────┘
```

You build **on top of** `js/cauldron/`. You do not fork the engine for one-off effects.

---

## Why are `docs/`, `tests/`, `scripts/`, `assets/` outside `js/`?

**This is normal and correct for a library.**

| Folder | Role | Why outside `js/` |
|--------|------|-------------------|
| **`js/`** | The library — code consumers import | Must stay clean; only runtime modules |
| **`apps/`** | Runnable games (Gem Digger demo) | Not part of the library package |
| **`plugins/`** | Optional extensions | Same pattern as npm plugins; import SDK only |
| **`tests/`** | Test harness + golden snapshots | Tests the library; not bundled in apps |
| **`docs/`** | Live documentation site | Dev/reference UI, served at `/docs/` |
| **`scripts/`** | Build, CI, layer checks | Node tooling; never loaded in browser |
| **`.github/`** | CI workflows | Infrastructure |

**Rule of thumb:** if it runs in the browser as part of your game → `apps/` or `js/`. If it validates, documents, or builds → top-level tooling folder.

Demo PNG icons live in **`apps/gem-digger/assets/`** (game-specific), not in the library root.

---

## Layer model (inside `js/`)

| Layer | Path | What it does |
|-------|------|--------------|
| **L0 Kernel** | `js/world.js` | Grid, cells, RNG, brush queue |
| **L1 Catalog** | `js/catalog/` | Species, materials, physics, colors |
| **L2 Engine** | `js/engine/` | Scanner, movement helpers |
| **L3 Runtime** | `js/sim/`, `js/rules/` | Rule registry, tick phases, materials |
| **L4 SDK** | `js/cauldron/` | **Public API** — only import from here in plugins/apps |
| **L5 Game framework** | `js/game/` | Maps engine, worldgen, inventory, gems (optional) |

### Public exports (`package.json`)

| Import | Use when you… |
|--------|----------------|
| `cauldron/app.js` | Host a sim (World, runRules, render, input) |
| `cauldron/plugin.js` | Write a plugin |
| `cauldron/extend.js` | Add materials / reactions |
| `cauldron/game.js` | Use maps, inventory, worldgen APIs |
| `cauldron/game/content` | Load **demo** map definitions (not required) |
| `cauldron/bootstrap.js` | Quick sandbox startup |

---

## Library vs game vs content

Three separate ideas — keep them separate in your head:

### 1. Simulation library (`js/cauldron/` + L0–L3)

Falling sand physics, materials, reactions, plugins.  
**No maps, no gems, no UI.** Works without any game code.

### 2. Game framework (`js/game/`)

Reusable systems for games built on Cauldron:

- **`maps/`** — tabbed worlds, sessions, goals
- **`worldgen/`** — procedural algorithms (CA caves, ore veins, …)
- **`inventory/`** — backpack, jar, items
- **`gems/`** — pickups, collect, render

Register things; don't edit core files:

```javascript
registerWorldGenerator('cavern', generateCavernWorld);
registerMapDefinition(myMap);
```

### 3. Game content (`js/game/content/`)

**Your** levels — Tutorial, Workshop, Mine Shaft.  
Demo-only; your real game replaces this with its own maps.

### 4. Runnable app (`apps/gem-digger/`)

The **playable** Gem Digger demo:

```
apps/gem-digger/
├── index.html      # page shell
├── sketch.js       # p5 host loop — wires library + UI
├── styles.css      # demo styling
├── ui/             # DOM panels (not library code)
└── assets/         # PNG icons for this game
```

Open: `http://localhost:3456/apps/gem-digger/`  
Root `/` redirects there.

---

## Extensions: plugins vs worldgen vs maps

Same **register pattern**, different layers:

| Kind | Register API | Example |
|------|--------------|---------|
| **Plugin** | `registerPlugin()` | Grenade blast |
| **Material pack** | `registerMaterialPack()` | Custom gravel |
| **World generator** | `registerWorldGenerator()` | CA cavern, noise caves |
| **Map** | `registerMapDefinition()` | A level with goals |

Compose algorithms in a map bootstrap or `worldGenerator` field:

```javascript
export const shaftMap = {
  id: 'shaft',
  worldGenerator: 'cavern',
  worldGeneratorOptions: { oreVeins: [...] },
  goals: { gems: { diamond: 4 } },
};
```

Add a new cave algorithm → `js/game/worldgen/my-caves.js` → `registerWorldGenerator('my-caves', fn)`.

---

## One simulation tick

```
Input (brush, gems, plugins)
  → runRules(world)     // L3 physics phases
  → gems.tick()         // L5 game (optional)
  → renderWorld()       // pixels
  → renderPlugins()     // grenade sprites, etc.
```

Map tabs snapshot the whole `World` (grid + inventories + gem pickups) when you switch.

---

## Import rules (enforced by `npm run check:layers`)

- **Plugins** → `js/cauldron/*` only
- **Sim (`js/sim/`)** → never imports `js/game/`
- **Game framework (`js/game/`)** → never imports `apps/`
- **App UI (`apps/*/ui/`)** → import `cauldron/app.js` or `cauldron/game.js`, not deep paths

---

## Adding your own game

1. Copy `apps/gem-digger/` → `apps/my-game/`
2. Change `sketch.js` to register **your** maps from `js/game/content/` or a new folder
3. Add worldgen in `js/game/worldgen/` and register it
4. Keep all sim logic in the library; keep levels in content; keep HTML/CSS/UI in `apps/`

---

## Commands

```bash
npm start          # static server (port 3456)
npm run build      # verify library modules load
npm test           # 89 behavior specs
npm run verify     # build + test + layer/behavior checks
npm run release    # full release gate
```

---

## Mental model

> **Cauldron** = falling-sand engine + SDK  
> **`js/game/`** = optional toolkit for map-based games  
> **`apps/gem-digger/`** = one game built with that toolkit  
> **`tests/docs/scripts/`** = quality and documentation around the library  

Build the library once. Swap algorithms, maps, and apps on top.
