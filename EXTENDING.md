# Extending Cauldron

This is a **library you build on**. Every extension type has one registration API — no god-files, no layer violations.

## Quick reference

| You want to… | API | Import from |
|--------------|-----|-------------|
| Add a **material** (core) | manifest line + rule file | internal L3 |
| Add a **material** (runtime/mod) | `registerMaterialPack()` | `cauldron/extend.js` |
| Add a **reaction** | `registerReaction()` | `cauldron/extend.js` or `ctx.registerReaction` |
| Add a **sim rule** (forces, agents…) | `registerRule(phase, rule)` | `cauldron/app.js` or `ctx.registerRule` |
| Add a **plugin feature** | `registerPlugin()` + `setup(ctx)` | `cauldron/plugin.js` |
| Add a **brush tool** | `registerBrushTool()` | `ctx.registerBrushTool` |
| Add a **UI toggle** | `registerToggle()` | `ctx.registerToggle` |
| Query **burnable** species | `getBurnableSpecies()` | `cauldron/plugin.js` |
| Allocate **species id** | `allocateSpecies('my-mod')` | `cauldron/extend.js` |

---

## 1. Add a core material (built into the library)

For Sandspiel-aligned elements shipped with Cauldron:

```
js/catalog/species.js          → Species.FOO = N
js/catalog/materials.js        → MATERIALS entry (physics, color, tags, ascii)
js/rules/materials/foo.js      → fooRuleDef + behaviors[]
js/sim/manifest.js             → one import + one line in registerRuleDefs([...])
```

**Tests & docs:** Put `behaviors[]` in the rule file. They appear in `/docs/` and `npm test` automatically.

**Tags matter:** Use `burnable`, `static`, etc. from `Tags` — reactions, grenade, and helpers query by tag.

---

## 2. Add a material at runtime (mod / plugin / pack)

One call registers catalog + sim rule + brush:

```javascript
import { registerMaterialPack, allocateSpecies } from '../js/cauldron/extend.js';
import { Mobility } from '../js/cauldron/app.js';

registerMaterialPack({
  id: 'obsidian',
  // species omitted → auto-allocates id 128+
  material: {
    name: 'obsidian',
    phase: 'solid',
    mobility: Mobility.GRANULAR,
    density: 3.0,
    tags: ['solid', 'granular', 'falling'],
    color: [30, 30, 40],
    ascii: 'o',
  },
  ruleDef: {
    id: 'obsidian',
    behaviors: [
      {
        id: 'obsidian-falls',
        name: 'Obsidian falls',
        slice: { rows: ['.o', '..'] },
        expect: ['..', '.o'],
        steps: 1,
      },
    ],
  },
  brush: { label: 'Obsidian' },
});
```

From a **plugin** `setup(ctx)`:

```javascript
ctx.registerMaterialPack({ /* same shape */ });
```

Species ids **128–255** are reserved for extensions. Core ids **0–127** are fixed.

---

## 3. Add a reaction (adjacency chemistry)

```javascript
import { registerReaction, Species } from '../js/cauldron/extend.js';

registerReaction({
  id: 'acid-stone',
  a: Species.ACID,
  b: Species.STONE,
  result: Species.EMPTY,
  clearA: false,
  at: 'b',
  priority: 0,
});
```

**When to use reactions vs material `customUpdate`:**

| Mechanism | Use for |
|-----------|---------|
| `registerReaction` | Simple A+B→C neighbor swaps (water+fire→steam) |
| `customUpdate` in material rule | Per-tick logic, movement + side effects (fire drift, organic growth) |
| `registerRule('forces', …)` | Plugins: explosions, wind, queued effects |
| `registerRule('agents', …)` | Projectiles, thrown objects, boids |

Reactions run in the **reactions phase** after materials. Material updates run first.

---

## 4. Add a plugin feature

```javascript
// plugins/my-feature/index.js
import { registerPlugin, Species } from '../../js/cauldron/plugin.js';

export const myFeaturePlugin = {
  id: 'my-feature',
  apiVersion: 1,
  suiteLabel: 'My Feature',
  doc: { summary: '…', controls: ['H — activate'] },

  setup(ctx) {
    ctx.registerToggle({ key: 'my-feature', id: 'my-feature-rule', label: 'My Feature' });

    ctx.registerRule('forces', {
      id: 'my-feature-rule',
      enabled: (w) => w.ruleEnabled['my-feature'] ?? true,
      run(world) { /* per-tick */ },
    });

    ctx.registerReaction({ a: Species.X, b: Species.Y, result: Species.Z });

    ctx.registerMaterialPack({ /* optional new material */ });

    ctx.registerBrushTool({ id: 'my-tool', species: 128, label: 'My Tool' });

    ctx.onReset((w) => { /* clear queues */ });
  },

  behaviors: [ /* docs + npm test */ ],
};
```

Register in `plugins/index.js`:

```javascript
import { registerPlugin } from '../js/cauldron/plugin.js';
import { myFeaturePlugin } from './my-feature/index.js';
registerPlugin(myFeaturePlugin);
```

---

## 5. Add a non-material rule (system phase)

App or extension code:

```javascript
import { registerRule } from '../js/cauldron/app.js';

registerRule('life', {
  id: 'my-growth-system',
  enabled: (w) => w.ruleEnabled.life ?? false,
  run(world) { /* … */ },
});
```

Phases (in order): `emitters` → `materials` → `reactions` → `life` → `forces` → `agents` → `brush`

---

## 6. Chemistry via tags (don't hardcode species lists)

```javascript
import { getBurnableSpecies, materialHasTag, Tags } from '../../js/cauldron/plugin.js';

const burnable = new Set(getBurnableSpecies());

if (burnable.has(cell.species) || materialHasTag(cell.species, Tags.BURNABLE)) {
  // ignite
}
```

When you add a new burnable material (tag it `burnable` in catalog), **grenade, reactions, and plugins pick it up automatically**.

---

## 7. Bootstrap order (reproducible)

`bootstrapSandbox({ world, canvas })`:

1. App rules (brush)
2. Load plugins (`plugins/index.js`)
3. Lifecycle hooks (`onWorldReset`)
4. `initPlugins()` — all `setup()` runs
5. `syncRuleEnabledDefaults(world)`

Same path for sketch, docs, and `npm test`.

---

## 8. Layer rules (enforced)

```bash
npm run check:layers
```

- **Plugins** → `js/cauldron/*` only
- **Kernel** → never imports plugins
- **Runtime registry** → never imports plugin host

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full stack.

---

## 9. Building a library on top of Cauldron

Your npm package can:

```javascript
// my-cauldron-pack/index.js
import { registerMaterialPack, registerReaction } from 'cauldron/extend';
import { registerPlugin } from 'cauldron/plugin';

export function installMyPack() {
  registerMaterialPack({ /* … */ });
  registerReaction({ /* … */ });
}

export const myPlugin = { id: 'my-pack', setup(ctx) { /* … */ } };
```

Consumer app:

```javascript
import { bootstrapSandbox } from 'cauldron/bootstrap';
import { installMyPack } from 'my-cauldron-pack';

installMyPack();
await bootstrapSandbox({ world, canvas });
```

---

## Mental model

```
Catalog (what it IS)  →  Rules (how it BEHAVES)  →  Phases (when it RUNS)
        ↑                        ↑
   registerMaterialPack     registerReaction
   registerMaterial         registerRule
                            registerRuleDef
```

Everything flows through **registration**, not file editing. Core team edits `manifest.js`; everyone else calls APIs.
