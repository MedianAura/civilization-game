# Civilization Game — Project Guide

<!-- GSD:project-start -->
## Project

**Civilization Game** — A browser-based 2D top-down colony management sandbox game built with TypeScript and Phaser.js. Players oversee a small settlement of citizens who have individual skills and needs, assigning them to jobs like lumberjacking and mining, housing them in tiered dwellings, and keeping them productive. Inspired by Rimworld and Bellwright.

**Core Value:** Citizens that react meaningfully to player decisions — neglect them and they slow down or leave, care for them and the colony thrives.

**Status:** Initialized. Phase 1 ready to plan.

See `.planning/PROJECT.md` for full context.
<!-- GSD:project-end -->

<!-- GSD:stack-start -->
## Stack

- **Language:** TypeScript 5.5+ (strict mode — `strict: true` must stay enabled)
- **Game Framework:** Phaser 4.1.0 (ESM, modern WebGL renderer)
- **Build Tool:** Vite 5
- **World:** Tile-based grid (Tiled JSON format)
- **Art:** Kenney.nl free asset packs (pre-atlased spritesheets)
- **UI Layer:** HTML/CSS DOM overlay (not Phaser UI objects)
- **State:** Vanilla TypeScript classes + event emitter (no Redux/Zustand for v1)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start -->
## Conventions

- World simulation logic lives in pure TypeScript classes — no Phaser imports in game state
- Event-driven architecture: state changes emit events; Scene and UI subscribe
- GameClock ticks independently from Phaser frame rate (~20 ticks/sec)
- Texture atlases + TilemapLayer required (individual sprites = 100+ draw calls)
- Strict TypeScript from day 1 — cannot be enabled mid-project
- Citizens use UUID-based IDs, never array indices
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start -->
## Architecture

Three-layer separation:
1. **World Simulation** (pure TypeScript) — GameState, Citizens, Buildings, Resources, Jobs, Tasks
2. **Game Scene** (Phaser) — renders tilemap, sprites, subscribes to world events
3. **UI Layer** (DOM overlay) — resource HUD, citizen panel, job assignment

Data flows one way: Input → World state mutation → Event emitted → Scene/UI updates

Build order: World State → Pathfinding → Entity system → Task system → Resources → UI
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start -->
## GSD Workflow

This project uses the GSD (Get Shit Done) workflow. All work follows this sequence:

```
/gsd-discuss-phase N   → gather context, clarify approach
/gsd-plan-phase N      → create PLAN.md with tasks
/gsd-execute-phase N   → execute all plans
/gsd-verify-work       → verify phase deliverables
```

**Current state:** See `.planning/STATE.md`  
**Roadmap:** `.planning/ROADMAP.md` (10 phases)  
**Requirements:** `.planning/REQUIREMENTS.md`

### Next Step

```
/clear
/gsd-discuss-phase 1
```

### Quick Commands

- `/gsd-progress` — check where you are and what's next
- `/gsd-quick <task>` — trivial inline tasks (no planning overhead)
- `/gsd-debug` — systematic debugging with persistent state
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
<!-- GSD:profile-end -->
