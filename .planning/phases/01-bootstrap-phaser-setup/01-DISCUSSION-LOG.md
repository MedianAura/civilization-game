# Phase 1: Bootstrap & Phaser Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 1-Bootstrap & Phaser Setup
**Areas discussed:** Source directory layout, Scene graph design, Dev tooling (lint/format)

---

## Source Directory Layout

### Q1: Top-level src/ organization

| Option | Description | Selected |
|--------|-------------|----------|
| world/ + scene/ + ui/ | Mirrors architecture naming exactly from CLAUDE.md | |
| game/ + scenes/ + ui/ | Follows Phaser community convention, 'scenes' is plural | ✓ |
| Flat src/ with file naming | Everything at root, distinguished by filename | |

**User's choice:** `game/ + scenes/ + ui/`
**Notes:** Preferred community-familiar naming over architecture-mirroring naming.

---

### Q2: Subdirectories within game/

| Option | Description | Selected |
|--------|-------------|----------|
| Flat game/ | All simulation files directly in game/ | |
| Subdirectories in game/ | entities/, jobs/, resources/ subdirs + top-level state/clock files | ✓ |

**User's choice:** Subdirectories in game/
**Notes:** Chose organized structure: `entities/`, `jobs/`, `resources/` with GameState.ts, GameClock.ts, EventEmitter.ts at game/ root.

---

### Q3: Asset location

| Option | Description | Selected |
|--------|-------------|----------|
| public/assets/ | Vite static serving, no import needed, URL-referenced by Phaser loaders | ✓ |
| src/assets/ (imported) | Assets imported via JS, Vite fingerprints them | |

**User's choice:** `public/assets/` with subdirs: `tilesets/`, `maps/`, `sprites/`

---

### Q4: Scenes/ internal structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat scenes/ | All scene files at scenes/ root | ✓ |
| Subdivide scenes/ | Subdirectory per scene | |

**User's choice:** Flat scenes/ — BootScene.ts, PreloadScene.ts, GameScene.ts

---

## Scene Graph Design

### Q1: Scene count and startup pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Boot + Game | 2-scene pattern, Boot handles preload then starts Game | |
| Single GameScene | One scene handles everything | |
| Boot + Preload + Game | Standard 3-scene pattern with dedicated loading scene | ✓ |

**User's choice:** Boot + Preload + Game (3 scenes)
**Notes:** Chose standard Phaser pattern including a progress bar in PreloadScene.

---

### Q2: Canvas sizing and scaling

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 1280×720 | Hard-coded, no scaling | |
| Full window with FIT scale | Phaser.Scale.FIT, autoCenter CENTER_BOTH, logical 1280×720 | ✓ |

**User's choice:** Full window FIT scale
**Notes:** Canvas fills browser window. DOM overlay must use viewport/percentage CSS units to align with scaled canvas.

---

### Q3: Phaser config location

| Option | Description | Selected |
|--------|-------------|----------|
| src/game.config.ts (own file) | Named export, main.ts stays clean as pure entry point | ✓ |
| Inline in main.ts | Config defined where used | |

**User's choice:** `src/game.config.ts` as named export

---

## Dev Tooling (lint/format)

### Q1: Lint/format toolchain

| Option | Description | Selected |
|--------|-------------|----------|
| ESLint + Prettier | Industry standard pair, broad IDE support | ✓ |
| Biome | Single modern tool, fewer dependencies | |
| TypeScript only | Compiler checks only, no style enforcement | |

**User's choice:** ESLint + Prettier

---

### Q2: Prettier formatting style

| Option | Description | Selected |
|--------|-------------|----------|
| Semicolons + double quotes | TypeScript default style | ✓ |
| No semicolons + single quotes | Modern TS project style | |

**User's choice:** `semi: true`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 120`

---

### Q3: Pre-commit hook

| Option | Description | Selected |
|--------|-------------|----------|
| lint-staged + husky | Auto-enforces lint/format on staged files before commit | ✓ |
| Manual (run explicitly) | No automatic enforcement | |

**User's choice:** husky + lint-staged

---

## Claude's Discretion

- Renderer type: `Phaser.AUTO` (let Phaser pick best available renderer)
- ESLint rules: `@typescript-eslint/recommended` baseline, no custom rules
- Package manager: npm (default unless user specifies otherwise)

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
