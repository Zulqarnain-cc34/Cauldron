# Cauldron — library vs game

This repo is **two products** in one tree:

1. **Cauldron** — falling-sand simulation library (`js/`)
2. **Gem Digger** — one game built on it (`apps/gem-digger/`)

They are decoupled by **folder**, **exports**, **import rules**, and **runtime state**.

---

## Hierarchy (top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  TOOLING          tooling/tests, tooling/scripts            │
│  (validates library; never loaded in browser)                 │
├─────────────────────────────────────────────────────────────┤
│  APPS             apps/gem-digger/  (and future games)      │
│    sketch.js      host loop (p5)                              │
│    ui/            DOM for this game only                      │
│    lib/           game kit (inventory, maps, gems, content) │
├─────────────────────────────────────────────────────────────┤
│  PLUGINS          plugins/  (optional; import SDK only)       │
├─────────────────────────────────────────────────────────────┤
│  LIBRARY          js/                                         │
│    world, catalog, engine, rules, sim  ← kernel               │
│    worldgen/                           ← procedural (no gems) │
│    cauldron/                           ← public SDK           │
└─────────────────────────────────────────────────────────────┘
```

---

## Abstract concepts

| Concept | Layer | Meaning |
|---------|-------|---------|
| **Cell** | Library | Species, flags, physics on a grid |
| **World** | Library | Grid + RNG + brush + rules — no game fields |
| **Material / Rule** | Library | Sand, water, fire, reactions |
| **World generator** | Library | CA caves, surface profile (`js/worldgen/`) |
| **Plugin** | Library extension | Grenade, custom rules (`plugins/`) |
| **Game state** | Game only | Backpack, jar, gem pickups on `World` via Symbol |
| **Map template** | Game only | Tutorial, Shaft — registered in game lib |
| **Map tab instance** | Game only | Open tab with its own saved session |
| **Item catalog** | Game only | Diamond, grenade icons — Gem Digger content |
| **UI** | Game only | Backpack overlay, map tabs, HUD |

The library knows **cells**. The game knows **goals, gems, and inventory**.

---

## How game state attaches to World (decoupling)

The kernel does **not** define `world.backpack` or `world.gemPickups`.

Gem Digger uses a private symbol bag:

```javascript
// apps/gem-digger/lib/game-state.js
import { getGameState } from './lib/game-state.js';

const { backpack, jar, gemPickups } = getGameState(world);
```

Another game can use a different symbol or no inventory at all.

---

## What the library exports (`package.json`)

| Export | Purpose |
|--------|---------|
| `cauldron` | SDK barrel (sim + worldgen) |
| `cauldron/app` | World, runRules, render, input |
| `cauldron/plugin` | Plugins |
| `cauldron/extend` | Materials, reactions |
| `cauldron/worldgen` | `runWorldGenerator`, CA cavern, etc. |
| `cauldron/bootstrap` | Sandbox startup |

There is **no** `cauldron/game` export.

---

## What Gem Digger imports

```javascript
// Library
import { World, runRules, renderWorld } from '../../js/cauldron/app.js';
import { bootstrapSandbox } from '../../js/cauldron/bootstrap.js';

// This game only
import { createMapManager, installGemSystem, BUILTIN_MAPS } from './lib/index.js';
```

---

## Worldgen split

| Piece | Where |
|-------|--------|
| `generateCavernWorld`, CA mask | `js/worldgen/` (library) |
| `placeOreVeins` (gems in walls) | `apps/gem-digger/lib/gems/ore-veins.js` |
| Bridge | `apps/gem-digger/lib/worldgen-bridge.js` |

A space-exploration game could use `cavern` without ore veins. A puzzle game might skip worldgen entirely.

---

## Inventory: not core library

Slot grids (`slot-inventory.js`) live in the **game kit** because:

- Backpack vs jar is Gem Digger UX, not physics
- Another game might use a hotbar, shop, or no inventory

If you reuse slots elsewhere, copy `apps/gem-digger/lib/inventory/` into your game or extract a shared package later — do not put it in `js/cauldron/`.

---

## Extension points (register pattern)

**Library:**

- `registerMaterialPack`, `registerReaction`, `registerPlugin`
- `registerWorldGenerator`

**Game (Gem Digger kit):**

- `registerMapDefinition`

---

## Import rules (enforced in CI)

- `js/**` must **not** import `apps/**`
- `js/worldgen/**` must **not** import gems or inventory
- `plugins/**` import `js/cauldron/**` only
- `apps/gem-digger/lib/**` must **not** import `apps/gem-digger/ui/**`
- `apps/gem-digger/ui/**` imports `cauldron/app` + `../lib/`

Run: `npm run check:layers`

---

## Building another game

1. `apps/my-game/sketch.js` — import `cauldron/app.js`
2. `apps/my-game/lib/` — only systems you need (optional)
3. Do **not** add game code to `js/cauldron/index.js`
4. Reuse `cauldron/worldgen.js` if you want procedural terrain

---

## Review checklist (current status)

| Check | Status |
|-------|--------|
| No `cauldron/game.js` | Done |
| Game code under `apps/gem-digger/lib/` | Done |
| Worldgen in `js/worldgen/` without gems | Done |
| Game state via `game-state.js` Symbol | Done |
| App assets in `apps/gem-digger/assets/` | Done |
| Layer checker blocks cross-imports | Done |
| `npm run verify` | Run after changes |

---

## Commands

```bash
npm start
npm run build
npm test
npm run verify
```
