# Cauldron library (`js/`)

All importable runtime code. **Start at `cauldron/`** — that is the public SDK.

## Layers (inside → out)

```
world.js, catalog/, engine/, rules/, sim/   ← sim engine (L0–L3)
cauldron/                                    ← public SDK (L4) — IMPORT HERE
game/                                        ← optional game framework (L5)
  ├── worldgen/    procedural algorithms (CA caves, ore veins)
  ├── maps/        tabbed worlds, sessions, goals
  ├── inventory/   backpack, jar, items
  ├── gems/        pickups, collect
  └── content/     demo map definitions (replace with yours)
doc/               builds live doc catalog from registries
input.js, render.js   browser host helpers (exported via cauldron/app.js)
```

## Package exports

Consumers import:

```javascript
import { World, runRules } from 'cauldron/app.js';
import { registerWorldGenerator } from 'cauldron/game.js';
import { registerPlugin } from 'cauldron/plugin.js';
```

Do **not** import deep paths like `js/rules/materials/sand.js` from apps or plugins.

## Adding features

| Feature | Where |
|---------|-------|
| New material | `rules/materials/` + `behaviors[]` |
| New plugin | `plugins/` (imports SDK only) |
| New worldgen algo | `game/worldgen/` + `registerWorldGenerator` |
| New map/level | `game/content/maps/` |

See [ARCHITECTURE.md](../ARCHITECTURE.md).
