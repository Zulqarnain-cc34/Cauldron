# Cauldron library (`js/`)

**Simulation library only** — falling-sand physics, materials, plugins, optional worldgen.

Games live under `apps/<name>/` and import this layer; they do not live inside `js/`.

## Import map

| You need | Import |
|----------|--------|
| World, rules, render | `cauldron/app.js` |
| Plugins | `cauldron/plugin.js` |
| New materials | `cauldron/extend.js` |
| Cave / CA terrain | `cauldron/worldgen.js` |
| Quick sandbox | `cauldron/bootstrap.js` |

## Layers

```
world.js, catalog/, engine/, rules/, sim/   ← engine
worldgen/                                   ← procedural (optional)
cauldron/                                   ← public SDK
plugins/host.js                             ← plugin registry
```

## Not in the library

- Inventory, backpack, jar → game app (`apps/gem-digger/lib/`)
- Map tabs, gem pickups, level goals → game app
- Demo map content → game app

See [ARCHITECTURE.md](../ARCHITECTURE.md).
