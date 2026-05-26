# Cauldron architecture

Hierarchical split: **library** → **optional worldgen** → **your game app**.

```
cauldron/
├── js/                      LIBRARY (simulation)
│   ├── world.js, catalog/, engine/, rules/, sim/
│   ├── worldgen/            procedural algorithms (no gems, no UI)
│   └── cauldron/            public SDK (app, plugin, extend, worldgen)
├── plugins/                 optional extensions (import SDK only)
├── apps/
│   └── gem-digger/          ONE GAME
│       ├── lib/             game kit (inventory, maps, gems) ← not the library
│       ├── ui/              HTML/DOM for this game only
│       └── sketch.js        host loop
└── tooling/                 tests + CI (never imported in browser)
```

---

## What is the library?

**Cauldron** = falling-sand engine + plugin SDK + optional worldgen.

```javascript
import { World, runRules, renderWorld } from 'cauldron/app.js';
import { registerPlugin } from 'cauldron/plugin.js';
import { runWorldGenerator } from 'cauldron/worldgen.js';
```

That is enough to build a **new** game. No inventory, no backpack, no gem tabs.

---

## What is NOT the library?

| Feature | Where | Why |
|---------|-------|-----|
| Backpack, jar, slots | `apps/gem-digger/lib/inventory/` | UI metaphor for Gem Digger |
| Map tabs + / × | `apps/gem-digger/lib/maps/` + `ui/map-tabs.js` | This game's level flow |
| Gem pickups, Alt+collect | `apps/gem-digger/lib/gems/` | This game's mechanics |
| Tutorial, Mine Shaft | `apps/gem-digger/lib/content/` | This game's levels |
| Ore veins in caves | `apps/gem-digger/lib/gems/ore-veins.js` | Game content on top of `cavern` |

`world.backpack`, `world.jar`, `world.gemPickups` are **convention fields** the game kit attaches to `World` — the core `World` class does not define them.

---

## Building another game

1. Create `apps/my-game/sketch.js` — import `cauldron/app.js` only.
2. Optionally import `cauldron/worldgen.js` for terrain.
3. Add `apps/my-game/lib/` only for systems you need (or skip inventory entirely).
4. Do **not** extend `js/cauldron/index.js` with game code.

---

## Gem Digger imports

```javascript
// Library
import { World, runRules } from '../../js/cauldron/app.js';

// This game only
import { createMapManager, installGemSystem } from './lib/index.js';
```

---

## Register pattern (library)

| Extension | API |
|-----------|-----|
| Material | `registerMaterialPack` |
| Plugin | `registerPlugin` |
| World generator | `registerWorldGenerator` |

Game-only:

| Extension | API |
|-----------|-----|
| Map template | `registerMapDefinition` (in game lib) |

---

## Commands

```bash
npm start
npm run build    # library modules only
npm test
npm run verify
```
