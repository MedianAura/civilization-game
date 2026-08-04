# Civilization Game — Project Guide

## Project

**Civilization Game** — A browser-based 2D top-down colony management sandbox game built with TypeScript and Phaser.js. Players oversee a small settlement of citizens who have individual skills and needs, assigning them to jobs like lumberjacking and mining, housing them in tiered dwellings, and keeping them productive. Inspired by Rimworld and Bellwright.

**Core Value:** Citizens that react meaningfully to player decisions — neglect them and they slow down or leave, care for them and the colony thrives.

**Status:** Toolchain bootstrapped, Phaser boots. Nothing simulated yet.

See `.planning/PROJECT.md` for full context.

## Stack

- **Package manager:** pnpm (only — `package-lock.json` and `yarn.lock` are gitignored on purpose)
- **Language:** TypeScript 5.9 (strict mode — `strict: true` must stay enabled)
- **Game Framework:** Phaser 4.2 (ESM, WebGL renderer)
- **Build Tool:** Vite 8 (bundler is **Rolldown**, not Rollup)
- **World:** Tile-based grid (Tiled JSON format)
- **Art:** Kenney.nl free asset packs (pre-atlased spritesheets)
- **UI Layer:** HTML/CSS DOM overlay (not Phaser UI objects)
- **State:** Vanilla TypeScript classes + event emitter (no Redux/Zustand for v1)

### Toolchain gotchas found the hard way

- **TypeScript stays on 5.9, not 7.x.** `typescript-eslint@8` still declares its peer range as
  `>=4.8.4 <6.1.0`. Bumping TS breaks lint, not the compiler.
- **Vite 8 runs Rolldown.** `build.rollupOptions` is deprecated in favour of `build.rolldownOptions`,
  and `manualChunks` only accepts the _function_ form — the `{ phaser: ["phaser"] }` object form
  throws `manualChunks is not a function` at build time.

## Conventions

- World simulation logic lives in pure TypeScript classes — no Phaser imports in game state
- Event-driven architecture: state changes emit events; Scene and UI subscribe
- GameClock ticks independently from Phaser frame rate (~20 ticks/sec)
- Texture atlases + TilemapLayer required (individual sprites = 100+ draw calls)
- Strict TypeScript from day 1 — cannot be enabled mid-project
- Citizens use UUID-based IDs, never array indices

## Architecture

Three-layer separation:

1. **World Simulation** (pure TypeScript) — GameState, Citizens, Buildings, Resources, Jobs, Tasks
2. **Game Scene** (Phaser) — renders tilemap, sprites, subscribes to world events
3. **UI Layer** (DOM overlay) — resource HUD, citizen panel, job assignment

Data flows one way: Input → World state mutation → Event emitted → Scene/UI updates

Build order: World State → Pathfinding → Entity system → Task system → Resources → UI

## Commands

```
pnpm dev        # vite dev server on :8080
pnpm build      # tsc --noEmit && vite build
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint .
pnpm format     # prettier --write .
```

## Planning

`.planning/` holds the roadmap and requirements as **reference content**, not as a process to
follow. The GSD framework that generated them was removed on 2026-08-04 — 4118 lines of planning
had produced zero lines of game code. Read `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md`
for intent; ignore `STATE.md`, `config.json`, and the phase-cycle vocabulary.
