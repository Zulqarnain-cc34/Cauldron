# Architecture — Layered Cauldron

Cauldron is a **layered library** for falling-sand simulation. Each layer talks only to the layer below. External code (plugins, apps, tooling) imports through the **SDK boundary** at `js/cauldron/`.

```
┌─────────────────────────────────────────────────────────────┐
│  L7 Tooling    docs/  tests/  help/  scripts/check-layers   │
├─────────────────────────────────────────────────────────────┤
│  L6 Plugins    plugins/grenade, plugins/your-thing/         │  ← you build here
├─────────────────────────────────────────────────────────────┤
│  L5 App        sketch.js, js/ui/, js/input.js, js/app/     │
├─────────────────────────────────────────────────────────────┤
│  L4 SDK        js/cauldron/   ◄── PUBLIC API                │
│                plugin.js | app.js | tooling.js | bootstrap    │
├─────────────────────────────────────────────────────────────┤
│  L3 Runtime    js/sim/, js/rules/                           │
│                rule-store, manifest, toggle-registry, lifecycle│
├─────────────────────────────────────────────────────────────┤
│  L2 Engine     js/engine/  (scanner, physics, cell-api)     │
├─────────────────────────────────────────────────────────────┤
│  L1 Catalog    js/catalog/  (species, materials, tags)      │
├─────────────────────────────────────────────────────────────┤
│  L0 Kernel     js/world.js  (grid, RNG, cell bytes)         │
└─────────────────────────────────────────────────────────────┘
```

## Import rules

| Who | May import |
|-----|------------|
| **Plugins** (`plugins/`) | `js/cauldron/plugin.js` (or full `index.js`) |
| **App** (`sketch.js`, `js/ui/`) | `js/cauldron/app.js` + L5 modules |
| **Tooling** (`docs/`, `tests/`) | `js/cauldron/tooling.js` + test helpers |
| **Runtime** (L3) | L0–L2 only |
| **Engine** (L2) | L0–L1 |
| **Kernel** (L0) | L1 catalog defaults only — **never plugins** |

Run `npm run check:layers` to enforce boundaries in CI.

## Cell model (L0)

Each cell is **5 bytes**: `species`, `flags`, `ra` (brightness/aux), `rb` (burn timer / aux state), `clock` (scan dedup — separate from `rb`).

| Field | Role |
|-------|------|
| `species` | Material id — what rules and ASCII tests assert |
| `rb` | **Burn timer** on `burnable` materials: `0` = idle, `>0` = ignited (counts down each tick until ash) |
| `ra` | Per-cell brightness grain (rendering + some rules) |

**Ignition signal (simulation):** touching `FIRE`/`LAVA` sets `rb` to a material-specific start value (e.g. fungus `20`, wood `90`). Species often **stays the same** while smoldering — Sandspiel-style.

**Ignition signal (rendering):** `cellColor()` in `js/catalog/cell-color.js` blends burnables toward ember orange when `rb > 0`. Export via `cauldron/app.js`. Hosts and plugins should use this instead of raw palette lookup.

**Instant conversion:** the `reactions` phase can replace species immediately (e.g. `Fu` → `FF`). That is a separate, faster path from the smolder `rb` timer.

Behavior tests can assert internal state with an optional `inspect(world)` hook alongside ASCII `expect`.

## SDK subpaths (L4)

| Module | Audience | Exports |
|--------|----------|---------|
| `cauldron/plugin.js` | Plugin authors | `Species`, `World`, `registerPlugin`, engine primitives |
| `cauldron/app.js` | Host apps | `runRules`, `getToggleableRules`, `renderPlugins`, brush tools |
| `cauldron/tooling.js` | Docs & tests | `buildDocCatalog`, `getAllTestSuites` |
| `cauldron/extend.js` | **Library authors** | `registerMaterialPack`, `registerReaction`, `allocateSpecies` |
| `cauldron/bootstrap.js` | Startup | `bootstrapSandbox()` — wires rules, plugins, lifecycle |
| `cauldron/index.js` | Convenience | Re-exports all of the above |

## L3 runtime modules

| Module | Role |
|--------|------|
| `sim/rule-store.js` | `registerRuleDef()` — extensible rule list |
| `sim/manifest.js` | Core material imports (one line per material) |
| `sim/test-registry.js` | Compile rules, toggles, behaviors, test suites |
| `sim/toggle-registry.js` | Plugin/extension UI toggles (no host cycle) |
| `sim/lifecycle.js` | `onWorldReset()` — kernel stays plugin-agnostic |

### Add a core material (L1–L3)

1. `js/catalog/species.js` + `materials.js`
2. `js/rules/materials/foo.js` with `fooRuleDef` + `behaviors[]`
3. One line in `js/sim/manifest.js`

Docs, brush picker, and tests update automatically.

### Add a plugin (L6)

```javascript
// plugins/my-thing/index.js
import { Species, registerPlugin } from '../../js/cauldron/plugin.js';

/** @type {import('../../js/cauldron/plugin.js').Plugin} */
export const myPlugin = {
  id: 'my-thing',
  apiVersion: 1,
  setup(ctx) {
    ctx.registerToggle({ key: 'my-thing', id: 'my-rule', label: 'My Thing' });
    ctx.registerRule('forces', { id: 'my-rule', run(world) { /* … */ } });
  },
  behaviors: [/* auto-docs + npm test */],
};
```

```javascript
// plugins/index.js
import { registerPlugin } from '../js/cauldron/plugin.js';
import { myPlugin } from './my-thing/index.js';
registerPlugin(myPlugin);
```

## Bootstrap sequence

`bootstrapSandbox({ world, canvas })` runs in order:

1. `registerAppRules()` — brush rule (L5 → L3 via bootstrap, not input.js)
2. `loadPlugins()` — import `plugins/index.js`
3. `onWorldReset(resetPlugins)` — lifecycle hook (L0 never imports L6)
4. `initPlugins()` — plugin setup, toggles, rules, render hooks
5. `syncRuleEnabledDefaults(world)` — material + plugin toggle keys

## Layering principles (for 100k+ scale)

1. **Register, don't edit god-files** — materials via `manifest.js`, plugins via `registerPlugin`, toggles via `toggle-registry`.
2. **Kernel purity** — `World.reset()` fires lifecycle hooks; plugins wire in bootstrap.
3. **SDK subpaths** — plugins pull minimal surface; apps don't load doc builders.
4. **Self-documenting** — `behaviors[]` on rules and plugins feed `/docs/` and `npm test`.
5. **Reproducible** — deterministic RNG, slice tests, live demos from same registry.
6. **Future perf** (L2) — scanner/active-set optimizations stay below L3; rules unchanged.

See also: [EXTENDING.md](EXTENDING.md), [plugins/README.md](plugins/README.md), [help/index.html](help/index.html)
