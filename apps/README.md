# Browser apps

Each subfolder is a **standalone web app** that imports the library from `../../js/`.

| App | URL | Purpose |
|-----|-----|---------|
| `gem-digger/` | `/apps/gem-digger/` | Playable demo game |
| `docs/` | `/apps/docs/` | Live material & plugin documentation |
| `test-runner/` | `/apps/test-runner/` | Visual debug UI for behavior specs |

These are **not** part of the npm package exports. They show how to consume the library.

When you build your own game, copy `gem-digger/` → `apps/my-game/` and wire your content.
