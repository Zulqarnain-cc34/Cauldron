# Gem Digger game kit

Everything here is **one game's logic**, built on top of Cauldron.

Another title would have its own `apps/my-game/lib/` (or skip inventory/maps entirely).

## Modules

| Folder | Purpose |
|--------|---------|
| `inventory/` | Slots, backpack, jar, item catalog |
| `maps/` | Tab sessions, MapManager, goals |
| `gems/` | Pickups, collect, render |
| `content/` | Level definitions (Tutorial, Shaft, …) |
| `worldgen-bridge.js` | Gem-specific post-pass after library `runWorldGenerator` |

## Imports

```javascript
import { World, runRules } from '../../js/cauldron/app.js';
import { createMapManager, installGemSystem } from './lib/index.js';
```

Do **not** put this code back into `js/cauldron/` — that would force every game to ship Gem Digger.
