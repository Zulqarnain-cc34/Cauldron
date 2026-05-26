# Cauldron repository layout

Four top-level buckets. Everything has one job.

```
cauldron/
├── js/           LIBRARY — import this in your game
├── apps/         BROWSER APPS — things you open in a tab
├── plugins/      EXTENSIONS — optional add-ons
└── tooling/      DEV ONLY — tests + scripts (Node, never shipped)
```

## Quick map

| You want to… | Go to |
|--------------|-------|
| Understand the sim engine | `js/README.md` |
| Import the public API | `js/cauldron/` |
| Add cave algorithms | `js/worldgen/` |
| Play the demo game | `apps/gem-digger/` |
| Read material specs | `apps/docs/` |
| Run `npm test` | `tooling/tests/` |
| Run CI checks | `tooling/scripts/` |
| Add a grenade-like plugin | `plugins/` |

## Is this okay for a big library?

**Yes.** This is the standard split used by React, Vue, Three.js, etc.:

- **Library code** lives in one tree (`js/`)
- **Examples/apps** live separately (`apps/`)
- **Tooling** lives separately (`tooling/`)
- **Optional extensions** live separately (`plugins/`)

You do not put tests inside `js/` because tests run in Node, import harness code, and store golden JSON — none of that belongs in a browser bundle.

You do not put docs inside `js/` because docs are a **website** that reads the library — same category as the game demo.

## Commands

```bash
npm start          # serve everything (port 3456)
npm run build      # verify library modules load
npm test           # headless behavior specs
npm run verify     # build + test + all gates
```

See [ARCHITECTURE.md](../ARCHITECTURE.md) for layers and import rules.
