# Research Summary: Civilization Game

## Recommended Stack

- **Phaser 4.1.0** + **Vite 5** + **TypeScript 5.5** (strict mode) — the convergent 2025/2026 browser game stack
- **Tiled JSON** for tilemaps — industry standard, Phaser loads natively, visual editing without code
- **Kenney.nl free asset packs** (pre-atlased) — removes art bottleneck for POC
- **Vanilla TypeScript classes + event system** for state — no Redux/Zustand needed for single-scene v1
- **HTML/CSS DOM overlay** for UI — better text rendering and layout than Phaser UI objects

## Table Stakes Features

- **Citizens** with named skills (lumberjack, miner) affecting resource yield — players must see individuals, not just numbers
- **Needs system** (hunger, rest, shelter) — mild neglect reduces productivity, severe neglect causes departure
- **Job assignment** — player assigns citizens to buildings (lumber camp, mine), one job per citizen
- **Resource tracking** — wood and stone totals visible at all times
- **Building placement** on tile grid — structures produce resources when workers assigned
- **UI readability** — colony state readable at a glance (status icons, resource bar, citizen panel)
- **Core loop tension** — settlers leave if morale ignored long enough; forces player engagement

## Architecture Pattern

- **Three-layer separation**: World Simulation (pure TypeScript, no Phaser) → Game Scene (Phaser rendering) → UI Layer (DOM overlay)
- **Event-driven**: state changes emit events; scene and UI subscribe — no direct coupling, no circular dependencies
- **GameClock** decouples simulation ticks from Phaser frame rate — stable behavior regardless of frame rate
- **Build order**: World State + Pathfinding first (testable without browser) → Phaser rendering → UI layer

## Watch Out For

- **Texture atlases from day one** — individual sprites cause 100+ draw calls/frame; retrofitting costs 2-3 days; use TilemapLayer + atlas from Phase 1
- **Event listener memory leaks** — listeners accumulate across scene transitions causing frame drops; clean up in SHUTDOWN lifecycle hook
- **Mutable state** — enable `strictNullChecks` and use `readonly` TypeScript properties before writing any UI code; cannot be enabled mid-project
- **Citizen update loop** — naive per-citizen-per-frame updates bottleneck at 20+ settlers; separate into fast (every frame) / slow (every 10 frames) / rare (every 100 frames) from Phase 2
- **Scope creep** — combat, save/load, procedural gen, and supply chains all defer to post-v1; validate core loop first

## Phase Structure Recommendation

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| 1 | Project Setup & Rendering | Phaser 4 + Vite scaffold, tilemap rendering, world state classes, event system, pathfinding module |
| 2 | Citizens & Needs | Citizen entities, needs decay, productivity effect, departure on severe neglect, housing |
| 3 | Jobs & Resource Generation | Job assignment system, lumber camp + mine production, wood/stone tracking |
| 4 | Buildings & Placement | Player-placed buildings on tile grid, tiered housing (hut → upgrade) |
| 5 | Player UI & Selection | Citizen selection panel, job assignment UI, resource HUD, DOM overlay polish |

## Key Decisions Unlocked

| Decision | Settled |
|----------|---------|
| Phaser 4.1.0 (not Phaser 3 or PixiJS) | Phaser 4 released April 2026, 100x faster rendering, modern ESM — no reason to revisit |
| Vite 5 build tool | Ecosystem default for Phaser; zero TypeScript config; sub-second HMR |
| Strict TypeScript from day 1 | Cannot enable `strict` mid-project without 100+ errors |
| Texture atlases + TilemapLayer | Mandatory Phase 1 decision — retrofitting costs 2-3 days |
| Vanilla TS classes (no Redux/Zustand) | Sufficient for single-scene POC; upgrade only if multi-scene state needed |
| Event-driven architecture (one-way) | Prevents circular deps, enables headless testing, future multiplayer-ready |
| No save/load, enemies, or win condition in v1 | Deferred until core loop validated via playtesting |
