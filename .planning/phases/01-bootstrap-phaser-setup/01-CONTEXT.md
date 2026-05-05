# Phase 1: Bootstrap & Phaser Setup - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Get Phaser 4 + Vite + TypeScript (strict mode) rendering a blank canvas in the browser. Establish the project directory structure, scene graph, build tooling, and code quality setup that all 9 subsequent phases build on. No game logic, no assets, no UI — pure scaffolding and hello-world rendering.

</domain>

<decisions>
## Implementation Decisions

### Source Directory Layout

- **D-01:** Top-level src/ uses `game/`, `scenes/`, `ui/` — mirrors the Phaser community convention while still separating the three architectural layers.
- **D-02:** `game/` uses internal subdirectories: `entities/`, `jobs/`, `resources/` — plus GameState.ts, GameClock.ts, EventEmitter.ts at the `game/` root.
- **D-03:** `scenes/` stays flat — BootScene.ts, PreloadScene.ts, GameScene.ts at root (no subdirectories needed for v1 POC with 3 scenes).
- **D-04:** `ui/` for DOM overlay components (structure TBD in UI phases).
- **D-05:** Game assets live in `public/assets/` (Vite static serving, no import needed). Subdirectories: `tilesets/`, `maps/`, `sprites/`.

Full intended structure:
```
src/
  game/
    entities/     ← Citizen.ts, Building.ts (Phase 4)
    jobs/         ← Job.ts, Task.ts (Phase 5)
    resources/    ← ResourcePool.ts (Phase 7)
    GameState.ts  ← (Phase 3)
    GameClock.ts  ← (Phase 3)
    EventEmitter.ts ← (Phase 3)
  scenes/
    BootScene.ts
    PreloadScene.ts
    GameScene.ts
  ui/             ← DOM overlay (Phase 8, 9)
  main.ts         ← Phaser bootstrap entry point
  game.config.ts  ← Phaser.Game config object

public/
  assets/
    tilesets/     ← Kenney.nl spritesheets + atlas JSON
    maps/         ← Tiled .json map files
    sprites/      ← citizen/building sprites
```

### Scene Graph

- **D-06:** Three-scene pattern: Boot → Preload → Game.
  - `BootScene`: Minimal initialization, starts PreloadScene.
  - `PreloadScene`: Loads all assets via Phaser.Loader, shows a progress bar.
  - `GameScene`: Main game loop — create() builds world, update() runs tick logic.
- **D-07:** Canvas scaling: `Phaser.Scale.FIT` with `autoCenter: Phaser.Scale.CENTER_BOTH`, logical resolution `1280×720`. Canvas fills browser window with aspect ratio preserved.
- **D-08:** Phaser config lives in `src/game.config.ts` as a named export (`gameConfig`). `main.ts` imports it and calls `new Phaser.Game(gameConfig)`. Keeps main.ts as a pure entry point.

### Dev Tooling

- **D-09:** Linter: ESLint with `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` (flat config format `eslint.config.js`).
- **D-10:** Formatter: Prettier with `eslint-config-prettier` to disable conflicting ESLint format rules.
- **D-11:** Prettier config: `semi: true`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 120`.
- **D-12:** Pre-commit enforcement: `husky` + `lint-staged` — runs ESLint + Prettier on staged files before each commit. Prevents lint debt from accumulating across 9 remaining phases.

### Claude's Discretion

- Renderer type (`Phaser.AUTO` vs explicit `Phaser.WEBGL`) — AUTO is fine, lets Phaser pick best available.
- Specific ESLint rules beyond `@typescript-eslint/recommended` — standard recommended set is sufficient.
- npm vs pnpm — either is fine; default to npm unless user specifies otherwise.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Project overview, tech decisions, constraints, core value
- `.planning/REQUIREMENTS.md` — Full v1 requirement list and traceability to phases
- `.planning/ROADMAP.md` — Phase details, success criteria, dependencies

### Architecture
- `CLAUDE.md` — Stack decisions, conventions, three-layer architecture, build order. Mandatory reading — overrides any default conventions.

No external specs — requirements fully captured in decisions above and CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. Phase 1 creates the foundation everything else reuses.

### Established Patterns
- None yet — Phase 1 establishes patterns for all subsequent phases.

### Integration Points
- Phase 1 output (project scaffold + blank canvas) is the foundation for Phase 2 (tilemap rendering) and Phase 3 (game state architecture). Both depend on the directory structure and scene graph decided here.

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose `game/scenes/ui/` over the `world/scene/ui/` naming that mirrors CLAUDE.md architecture labels — use `game/` not `world/` throughout.
- User chose Boot+Preload+Game (3 scenes) over the simpler 2-scene pattern — include a progress bar in PreloadScene.
- Canvas scales to fill window (FIT mode) rather than fixed 1280×720 — DOM overlay CSS must account for this (percentage-based or viewport units).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Bootstrap & Phaser Setup*
*Context gathered: 2026-05-05*
