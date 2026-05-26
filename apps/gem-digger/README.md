# Gem Digger (demo app)

Playable demo built on the Cauldron library. **This is not the library** — it is one game that consumes it.

## Run

```bash
npm start
```

Open [http://localhost:3456/apps/gem-digger/](http://localhost:3456/apps/gem-digger/)

## What's here

| File | Role |
|------|------|
| `sketch.js` | p5 host — creates World, runs sim loop, mounts UI |
| `ui/` | DOM panels (brush, maps, backpack, jar) |
| `assets/` | PNG icons for this game only |
| `styles.css` | Demo layout and theme |

## Library imports

The app imports from `../../js/cauldron/` (SDK) and `../../js/game/content/` (demo maps).  
See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the full layer model.

## Make your own game

Copy this folder to `apps/my-game/`, replace maps/content, add your own `worldgen` algorithms in `js/game/worldgen/`.
