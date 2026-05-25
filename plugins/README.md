# Plugins

Plugins live in **Layer 6** — they import **only** the public plugin SDK:

```javascript
import { Species, registerPlugin } from '../js/cauldron/plugin.js';
```

Do **not** import from `js/catalog/`, `js/engine/`, `js/rules/`, etc. See [ARCHITECTURE.md](../ARCHITECTURE.md).

## Register a plugin

```javascript
// plugins/index.js
import { registerPlugin } from '../js/cauldron/plugin.js';
import { myPlugin } from './my-plugin/index.js';

registerPlugin(myPlugin);
```

## Plugin shape

```javascript
/** @type {import('../js/cauldron/plugin.js').Plugin} */
export const myPlugin = {
  id: 'my-plugin',
  apiVersion: 1,
  suiteLabel: 'My Plugin',

  doc: {
    summary: 'What it does (shows in live docs).',
    controls: ['KeyX — do thing'],
  },

  setup(ctx) {
    ctx.registerToggle({ key: 'my-plugin', id: 'my-plugin-rule', label: 'My Plugin', defaultEnabled: true });

    ctx.registerRule('forces', {
      id: 'my-plugin-rule',
      enabled: (w) => w.ruleEnabled['my-plugin'] ?? true,
      run(world) { /* your effect */ },
    });

    ctx.registerRender((p, world) => { /* optional overlay */ });
    ctx.onReset((w) => { /* clear queues — wired via lifecycle, not kernel */ });
  },

  behaviors: [
    {
      id: 'my-plugin-does-x',
      name: 'Does X',
      description: 'Spec for docs + npm test.',
      slice: { rows: ['.S.', '.S.'] },
      expect: ['...', '.S.'],
      scope: { rules: ['my-plugin-rule'] },
      steps: 1,
    },
  ],
};
```

## SDK subpaths

| Import | Use |
|--------|-----|
| `cauldron/plugin.js` | **Plugins** — minimal surface |
| `cauldron/app.js` | Host apps (sketch, UI) |
| `cauldron/tooling.js` | Docs & test runners |
| `cauldron/bootstrap.js` | `bootstrapSandbox()` startup |
| `cauldron/index.js` | Full barrel (convenience) |

Inside `setup()`, use **context** methods — not direct imports from internal layers:

- `ctx.registerRule(phase, rule)`
- `ctx.registerToggle(toggle)`
- `ctx.registerMaterialPack(pack)` — new material + rule + brush in one call
- `ctx.registerReaction(rxn)` — adjacency chemistry
- `ctx.registerBrushTool(tool)` — paint picker entry
- `ctx.registerRuleDef(def)` — runtime rule module
- `ctx.registerRender(fn)`
- `ctx.onReset(fn)`
- `ctx.getState(key)`

Full extension guide: [EXTENDING.md](../EXTENDING.md)

## World API

```javascript
world.get(x, y);
world.set(x, y, { species, flags, ra, rb });
world.inBounds(x, y);
world.emptyCell();
world.agents.push({ type: 'mine', ... });
world.ruleEnabled.myKey = true;
```

## Example

See `plugins/grenade/` — throwable grenade with blast, fragments, sprite render, and tests.

## Starter

Copy `plugins/_template/` to begin.

## Boundary check

```bash
npm run check:layers
```

Ensures plugins never import internal layers.
