# Phase 1: Bootstrap & Phaser Setup - Research

**Researched:** 2026-07-20
**Domain:** Phaser 4 + Vite 5 + TypeScript strict project scaffolding
**Confidence:** HIGH

## Summary

Phaser 4.1.0 is real and published on npm (`phaser@4.1.0`, released as the "Salusa" point release; latest is `4.2.1` as of this research) [VERIFIED: npm registry]. It ships its own bundled type declarations (`types/phaser.d.ts`) via the `types` field and `exports` map, so no `@types/phaser` package is needed or exists for v4 [VERIFIED: npm registry — `npm view phaser@4.1.0 exports`]. Phaser 4's renderer is a full rewrite from Phaser 3 (node-based render-graph architecture, two-matrix camera system separating view/position, unified Filters system replacing FX/Masks) [CITED: phaser.io/news, GitHub CHANGELOG]. As of 4.1.0, ESM default-import (`import Phaser from 'phaser'`) works correctly — earlier v4 builds had a broken ESM export requiring `import * as Phaser from 'phaser'` as a workaround [CITED: phaser.io/news/2026/04/phaser-4-1-0-salusa-release]. Pin exactly to `4.1.0` (the version CLAUDE.md/STATE.md lock) rather than floating to `4.2.1`, since the ESM-fix release is the meaningful compatibility baseline and the roadmap explicitly names 4.1.0 as a locked decision.

The single most important non-obvious finding: **do not use TypeScript 7.x for this project.** TypeScript crossed a major version boundary (7.0 GA'd July 8, 2026) that replaced the compiler internals with a Go-native port ("tsgo"/Project Corsa). This breaks `typescript-eslint` — verified directly: `typescript-eslint@8.64.0`'s `peerDependencies.typescript` is `>=4.8.4 <6.1.0` [VERIFIED: npm registry]. TypeScript 7 sits entirely outside that range, so linting breaks under TS 7. CLAUDE.md locks "TypeScript 5.5+", which is satisfied by pinning `typescript@~5.9.3` (latest stable 5.x line, verified to exist on the registry) — this keeps the project inside the typescript-eslint-supported range while satisfying the "5.5+" constraint and avoiding a major, ecosystem-incompatible jump the user did not explicitly ask for.

Vite 5 is correctly locked in STATE.md/CLAUDE.md even though Vite has moved to major version 8 upstream [VERIFIED: npm registry — `vite` latest is `8.1.5`]. Use `vite@^5.4.21` (latest 5.x patch, verified to exist) — this is a deliberate pin, not a stale assumption, per the CLAUDE.md-locked stack. The classic Phaser+Vite HMR pitfall (duplicate canvas / duplicate `Phaser.Game` instance on hot reload) is solved with the standard `import.meta.hot.dispose()` guard destroying the old game instance before Vite reloads the module — this is a well-established community pattern, not Phaser-specific API.

**Primary recommendation:** Scaffold with `phaser@4.1.0`, `vite@^5.4.21`, `typescript@~5.9.3`, `typescript-eslint@^8.64.0` (flat config), `eslint@^9` (NOT eslint 10 — see Standard Stack notes), `prettier@^3.9.5`, `husky@^9.1.7` + `lint-staged@^17.1.0`. Use `moduleResolution: "bundler"`, `module: "ESNext"`, `strict: true`. Establish the SHUTDOWN-event listener cleanup pattern in `GameScene` from day one since STATE.md flags this as the top risk area.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project scaffold (package.json, tsconfig, vite.config) | Build tooling | — | Not a runtime tier; governs how all tiers are compiled/served |
| Phaser.Game bootstrap (`main.ts`) | Game Scene (Phaser) | — | Entry point that constructs the renderer; owned by the Phaser tier per CLAUDE.md architecture |
| Scene lifecycle (Boot/Preload/Game) | Game Scene (Phaser) | — | Phaser-specific; must stay free of world-simulation logic per CLAUDE.md ("no Phaser imports in game state") |
| Canvas scaling / Scale Manager config | Game Scene (Phaser) | Browser/DOM | Phaser owns the canvas element; DOM overlay CSS (future phases) must react to it, not control it |
| Dev tooling (ESLint/Prettier/Husky) | Build tooling | — | Cross-cutting; enforced pre-commit, not runtime |
| Directory structure (`src/game`, `src/scenes`, `src/ui`) | All tiers | — | Structural decision locked in CONTEXT.md D-01–D-05; establishes tier boundaries physically |

No World Simulation or UI (DOM overlay) code is created in Phase 1 — those tiers begin in Phase 3 and Phase 8/9 respectively. Phase 1 output is purely the Game Scene tier's skeleton plus build tooling.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| phaser | 4.1.0 | 2D WebGL/Canvas rendering, Scene graph, Loader, Scale Manager | Locked by STATE.md/CLAUDE.md; verified to exist on npm exactly at this version [VERIFIED: npm registry] |
| vite | ^5.4.21 | Dev server (HMR), production bundler | Locked by STATE.md/CLAUDE.md as "Vite 5" despite Vite 8 being current upstream latest; 5.4.21 is the last/latest 5.x patch [VERIFIED: npm registry] |
| typescript | ~5.9.3 | Strict-mode compiler | Satisfies CLAUDE.md's "5.5+" floor while staying inside typescript-eslint's supported ceiling (`<6.1.0`) [VERIFIED: npm registry peerDependencies] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^24.x (or pin to your installed Node major) | Node API types for vite.config.ts | Needed because vite.config.ts runs in Node, not the browser |
| terser | ^5.39.0 | Production minification (Phaser's official templates require it for `vite build` — esbuild's default minifier has historically mishandled some Phaser bundle patterns) | Add as devDependency; configure `build.minify: 'terser'` in vite.config.ts if following the official Phaser template convention [MEDIUM confidence — CITED via official template package.json] |

### Dev Tooling
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^9.39.5 | Linting, flat config | typescript-eslint 8.x supports ESLint `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` [VERIFIED: npm registry peerDependencies]. Recommend ESLint 9.x over the newly-released 10.x for maximum plugin-ecosystem maturity — ESLint 10 is very new (verify any other plugins you add support it before upgrading) |
| typescript-eslint | ^8.64.0 | TS-aware lint rules, flat config helper (`typescript-eslint` meta-package) | Current recommended way to set up `@typescript-eslint/*` under flat config — single package exports `configs.recommended` |
| globals | ^17.7.0 | Browser/Node global definitions for flat config `languageOptions.globals` | Standard companion package for ESLint flat config |
| prettier | ^3.9.5 | Code formatting | Locked by CONTEXT.md D-10/D-11 |
| eslint-config-prettier | ^10.1.8 | Disables ESLint formatting rules that conflict with Prettier | Locked by CONTEXT.md D-10 |
| husky | ^9.1.7 | Git hooks (pre-commit) | Locked by CONTEXT.md D-12; v9 uses the simplified `husky` (no `husky-init`) — `npx husky init` scaffolds `.husky/pre-commit` |
| lint-staged | ^17.1.0 | Run linters only on staged files | Locked by CONTEXT.md D-12 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| typescript@~5.9.3 | typescript@^6.0.3 | 6.0.3 is also inside typescript-eslint's `<6.1.0` ceiling and is technically "newer," but 5.9.3 has a longer track record with the current Phaser/Vite ecosystem; either satisfies "5.5+". Do not use 7.x (breaks typescript-eslint). |
| eslint@^9 | eslint@^10.7.0 | ESLint 10 is peer-compatible with typescript-eslint 8.64 per the registry, but it is extremely new (released within the current research window) — some ancillary plugins may not yet declare v10 support. Prefer 9.x for a Phase 1 foundation unless a specific v10 feature is needed. |
| vite build minify: esbuild (default) | terser | Official Phaser Vite templates ship `terser` as a dependency for production builds; esbuild's default minifier is faster but Phaser templates consistently pin terser — follow convention unless a specific reason to diverge arises |

**Installation:**
```bash
npm install phaser@4.1.0
npm install -D typescript@~5.9.3 vite@^5.4.21 terser@^5.39.0 @types/node@^24 \
  eslint@^9 typescript-eslint@^8.64.0 globals@^17.7.0 \
  prettier@^3.9.5 eslint-config-prettier@^10.1.8 \
  husky@^9.1.7 lint-staged@^17.1.0
```

**Version verification (all confirmed against npm registry during this research session):**
| Package | Verified version | Verified latest | Note |
|---------|------------------|------------------|------|
| phaser | 4.1.0 exists | 4.2.1 | Pin to 4.1.0 per lock |
| vite | 5.4.21 (latest 5.x) | 8.1.5 | Pin to 5.x per lock |
| typescript | 5.9.3 (latest 5.x) | 7.0.2 (7.x — AVOID) | typescript-eslint requires `<6.1.0` |
| typescript-eslint | 8.64.0 | 8.64.0 | peerDeps: eslint `^8.57\|^9\|^10`, typescript `>=4.8.4 <6.1.0` |
| eslint | 9.39.5 (recommend) | 10.7.0 | 10.x is very new; 9.x safer default |
| prettier | 3.9.5 | 3.9.5 | current |
| eslint-config-prettier | 10.1.8 | 10.1.8 | current |
| husky | 9.1.7 | 9.1.7 | current |
| lint-staged | 17.1.0 | 17.1.0 | current |

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─ index.html (single <div id="game-container">)
  │     │
  │     ▼
  │  main.ts  ──imports──▶  game.config.ts (gameConfig export)
  │     │                         │
  │     │  new Phaser.Game(gameConfig)
  │     ▼
  │  Phaser.Game instance
  │     │
  │     │  scene: [BootScene, PreloadScene, GameScene]
  │     ▼
  │  BootScene.create()
  │     │  this.scene.start('PreloadScene')
  │     ▼
  │  PreloadScene.preload()  ──▶  Phaser.Loader (assets, progress bar)
  │     │  this.scene.start('GameScene')
  │     ▼
  │  GameScene.create()  ──▶  builds blank canvas / world (Phase 2+)
  │  GameScene.update()  ──▶  per-frame render tick (game logic arrives Phase 3+)
  │
  │  [Vite HMR boundary]
  │     import.meta.hot.dispose() ──▶ game.destroy(true) before module reload
  │
  └─ Vite Dev Server (localhost:5173 or :8080) ──serves──▶ index.html, TS modules (transpiled on the fly), public/assets/* (static passthrough)
```

Data flow for Phase 1 is intentionally shallow: `index.html → main.ts → game.config.ts → Phaser.Game → Scene chain`. No World Simulation or UI DOM layer exists yet — those attach to `GameScene` starting Phase 3/8.

### Recommended Project Structure
```
civilization-game/
├── index.html            # single div#game-container, script type="module" src="/src/main.ts"
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc.json
├── .husky/
│   └── pre-commit        # runs `npx lint-staged`
├── public/
│   └── assets/
│       ├── tilesets/
│       ├── maps/
│       └── sprites/
└── src/
    ├── main.ts            # entry point: new Phaser.Game(gameConfig) + HMR dispose guard
    ├── game.config.ts     # named export `gameConfig: Phaser.Types.Core.GameConfig`
    ├── game/               # World Simulation tier (empty in Phase 1; Phase 3+ populates)
    │   ├── entities/
    │   ├── jobs/
    │   └── resources/
    ├── scenes/
    │   ├── BootScene.ts
    │   ├── PreloadScene.ts
    │   └── GameScene.ts
    └── ui/                 # DOM overlay tier (empty in Phase 1; Phase 8/9 populates)
```
This matches CONTEXT.md D-01 through D-08 exactly (verbatim structure already specified — see User Constraints below).

### Pattern 1: Named Config Export + Pure Entry Point
**What:** `game.config.ts` exports a `gameConfig: Phaser.Types.Core.GameConfig` object; `main.ts` only imports it and instantiates `Phaser.Game`.
**When to use:** Always for this project — CONTEXT.md D-08 locks this.
**Example:**
```typescript
// src/game.config.ts
// Source: Phaser 4 Types.Core.GameConfig shape [CITED: docs.phaser.io API docs]
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#1d1d1d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [BootScene, PreloadScene, GameScene],
};
```
```typescript
// src/main.ts
// Source: community pattern for Vite + Phaser HMR safety
import Phaser from "phaser";
import { gameConfig } from "./game.config";

let game = new Phaser.Game(gameConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
```

### Pattern 2: Scene SHUTDOWN Cleanup Hook
**What:** Every scene registers a one-time SHUTDOWN listener that tears down its own event bindings before the scene can be restarted.
**When to use:** Every scene, starting with GameScene in Phase 1 — STATE.md names this as a top risk area and CONTEXT.md requires Phase 1 to establish the pattern.
**Example:**
```typescript
// src/scenes/GameScene.ts
// Source: Phaser Scenes.Events docs pattern [CITED: docs.phaser.io/api-documentation/event/scenes-events]
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create(): void {
    // Register any listeners/timers/inputs here...

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private cleanup(): void {
    // Remove all listeners this scene attached (to itself, input, or external emitters)
    this.events.off(Phaser.Scenes.Events.UPDATE);
    this.input.removeAllListeners();
    // Do NOT call this.events.removeAllListeners() blindly — Phaser's own
    // Scene Systems call this internally on shutdown already; only clean up
    // listeners YOU added to objects outside the scene's own emitter
    // (e.g. a shared world-level EventEmitter from Phase 3+).
  }
}
```
**Key detail verified:** Phaser's Scene Systems automatically call `removeAllListeners()` on the scene's own event emitter during shutdown [CITED: Phaser Scenes.Events docs]. The risk STATE.md flags is specifically about listeners registered on *external* emitters (e.g., a future world-level `EventEmitter` from Phase 3, or `window`/`document` listeners) that Phaser does NOT know to clean up — those must be manually removed in the SHUTDOWN handler.

### Pattern 3: Vite Config for Phaser (static assets + chunking)
**What:** vite.config.ts serves `public/assets/` untouched (Vite's default static-serving behavior for `public/`) and isolates Phaser into its own build chunk.
**Example:**
```typescript
// vite.config.ts
// Source: pattern derived from official phaserjs/template-vite-ts config.dev/config.prod split
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 8080,
  },
  build: {
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
});
```
No special config is needed for `public/assets/` — Vite serves anything under `public/` at the root URL path automatically and copies it verbatim on build; this is Vite's documented default and requires no plugin.

### Anti-Patterns to Avoid
- **`import * as Phaser from 'phaser'`:** Was a required workaround for broken ESM exports in early Phaser 4 builds; fixed in 4.1.0. Use plain `import Phaser from 'phaser'` — mixing the two styles across files causes type confusion.
- **Calling `this.events.removeAllListeners()` in SHUTDOWN unconditionally:** Phaser already does this for the scene's own emitter; doing it again is harmless but signals a misunderstanding — the actual leak risk is external emitters/DOM listeners the scene attached to.
- **Reinstantiating `new Phaser.Game()` inside a Vite HMR-accepted module without disposing the old instance:** Causes duplicate `<canvas>` elements and duplicate render loops competing for the same DOM container — the classic reported bug pattern. Always pair `import.meta.hot.accept`/module reload with `import.meta.hot.dispose(() => game.destroy(true))`.
- **Putting Phaser imports in `src/game/`:** Violates CLAUDE.md's "no Phaser imports in game state" convention — `src/game/` is reserved for pure TypeScript simulation classes starting Phase 3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas scale-to-fit-window with aspect ratio | Custom resize listener + manual canvas CSS transform math | Phaser's built-in `Scale.FIT` + `CENTER_BOTH` (Scale Manager) | Phaser already handles resize events, device pixel ratio, and orientation; CONTEXT.md D-07 already locks this choice |
| Asset loading + progress bar | Manual `fetch()`/`Image()` loading with a hand-rolled progress counter | Phaser's `Loader` plugin (`this.load.*` in `PreloadScene`) with its `progress`/`complete` events | Phaser's Loader handles caching, retries, and cross-origin config already; hand-rolling duplicates a solved problem |
| Event cleanup bookkeeping | Custom "listener registry" class to track/remove all bindings manually | Phaser's built-in per-scene EventEmitter + the SHUTDOWN hook pattern above | Phaser already tracks and clears its own scene-scoped listeners; only *external* emitter subscriptions need manual tracking, and that's a single `.off()` call per binding, not a registry system |
| ESLint + Prettier conflict resolution | Custom ESLint rule overrides to silence formatting rules Prettier will also touch | `eslint-config-prettier` (already locked in CONTEXT.md D-10) | This is exactly the maintained, standard solution to the ESLint/Prettier overlap problem |

**Key insight:** Phase 1's job is almost entirely "wire together well-maintained tools correctly," not build anything novel. Every piece of custom code in Phase 1 should be scene glue code (BootScene → PreloadScene → GameScene transitions) — anything more elaborate is likely solving an already-solved problem.

## Common Pitfalls

### Pitfall 1: TypeScript major-version drift breaking the lint toolchain
**What goes wrong:** Running `npm install typescript@latest` (or omitting a version pin entirely) silently installs TypeScript 7.x, which breaks `typescript-eslint` (peer range `<6.1.0`), producing confusing ESLint crashes or silent rule-skipping.
**Why it happens:** TypeScript shipped a major version (7.0, native Go compiler) very recently; `npm install typescript` with no version spec grabs `latest` dist-tag, which is now 7.x.
**How to avoid:** Always pin `typescript` to an explicit `~5.9.3` (or any `>=5.5 <6.1.0`) range in `package.json`, never bare `typescript` or `typescript@latest`.
**Warning signs:** `npx tsc --version` reports `7.x`; ESLint throws errors referencing an unsupported TypeScript version, or `typescript-eslint` silently produces zero type-aware lint results.

### Pitfall 2: Duplicate `<canvas>` / duplicate game loop on HMR
**What goes wrong:** Editing any file that `main.ts` transitively imports triggers Vite HMR; without a dispose guard, a second `Phaser.Game` is constructed inside the same `#game-container`, doubling rendering and input handling (and sometimes doubling frame rate perceived, or causing an "input double-fires" bug).
**Why it happens:** Vite HMR re-executes the module graph on change but does not know to tear down side effects (like a running Phaser render loop) unless told to via `import.meta.hot.dispose()`.
**How to avoid:** Guard the game construction with the dispose pattern shown in Pattern 1 above. In dev, consider also guarding with `if (import.meta.hot) { ...accept/dispose... }` so production builds tree-shake the HMR code entirely (Vite replaces `import.meta.hot` with `undefined` in production builds automatically).
**Warning signs:** Canvas appears to flicker or duplicate visually after a save-triggered reload; frame rate counter shows roughly 2x expected; console shows repeated `"Phaser v4..."` boot banner logs.

### Pitfall 3: External event-listener leaks Phaser doesn't know about
**What goes wrong:** A scene attaches a listener to something Phaser doesn't own — `window.addEventListener('resize', ...)`, a future world-level `EventEmitter` (Phase 3+), or `document` — and assumes Phaser's automatic SHUTDOWN cleanup covers it. It doesn't; only the scene's own internal emitter is auto-cleared.
**Why it happens:** Phaser's `removeAllListeners()` on shutdown only applies to the Scene's own `EventEmitter` instance (`this.events`), not arbitrary external event sources the scene code subscribed to.
**How to avoid:** Any listener added to something other than `this.events`/`this.input`/`this.tweens` etc. (i.e., anything not owned by the Scene Systems) must be explicitly removed in a SHUTDOWN handler, as shown in Pattern 2.
**Warning signs:** Memory/listener count grows on repeated scene restarts (visible via Chrome DevTools' "Event Listeners" tab on `window`/`document`, or a growing listener count on a custom EventEmitter's internal map).

### Pitfall 4: `strict: true` + Phaser's own types surfacing friction
**What goes wrong:** Phaser's bundled `.d.ts` is large and, in some places (Scene lifecycle callback signatures, GameObject generics), can produce strict-mode friction (e.g., `noImplicitAny` complaints on callback parameters if not explicitly typed).
**Why it happens:** Phaser's types are written to be broadly compatible across usage styles, not written specifically to satisfy consumer `strict: true` configs at every callsite.
**How to avoid:** Always explicitly type Scene method signatures (`create(): void`, `update(time: number, delta: number): void`) rather than letting inference run; import concrete types like `Phaser.Types.Core.GameConfig` explicitly rather than relying on structural inference.
**Warning signs:** `tsc --noEmit` failures pointing into `node_modules/phaser/types/phaser.d.ts` rather than your own source — usually fixable by adding an explicit local type annotation at the call site rather than fighting the library's types.

## Code Examples

### `index.html`
```html
<!-- Source: standard Vite + Phaser entry pattern -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Civilization Game</title>
    <style>
      html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
      #game-container { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `tsconfig.json`
```jsonc
// Source: Vite's official TS template conventions + Phaser ESM requirements
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

### `eslint.config.js` (flat config)
```javascript
// Source: typescript-eslint v8 flat-config recommended pattern
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  eslintConfigPrettier
);
```

### `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 120
}
```

### `package.json` scripts + lint-staged
```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,html,css}": ["prettier --write"]
  }
}
```
Husky v9 setup: `npx husky init` creates `.husky/pre-commit` with `npx lint-staged` — no `husky-init` package or `.huskyrc` needed (v9 simplified from v8's setup).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `import * as Phaser from 'phaser'` | `import Phaser from 'phaser'` | Fixed in Phaser 4.1.0 "Salusa" (2026-04) | Cleaner imports; using the old workaround style in new code is unnecessary but harmless if left over from a template |
| `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` configured separately, `.eslintrc.json` | Single `typescript-eslint` meta-package + flat `eslint.config.js` | typescript-eslint v8 (current) | CONTEXT.md D-09 already specifies flat config — confirmed as the current standard, not a stale choice |
| TypeScript 6.x compiler (JS-based, tsc) | TypeScript 7.0 native Go compiler (tsgo) — API not yet stable | GA July 8, 2026 | Do NOT adopt yet for this project; wait for 7.1's stable API and typescript-eslint support before considering |
| ESLint 8 (`.eslintrc.*`) | ESLint 9 flat config as default (10.x also current) | ESLint 9 (2024) made flat config default; 10.x is the newest major | Recommend 9.x for now; revisit 10.x once broader plugin ecosystem confirms support |

**Deprecated/outdated:**
- `.eslintrc.json`/`.eslintrc.js` config format: superseded by flat config (`eslint.config.js`) as of ESLint 9; CONTEXT.md already locks flat config.
- `@types/phaser` (a separate DefinitelyTyped package some old Phaser 3 tutorials reference): not needed and does not apply to Phaser 4 — Phaser 4 ships its own types.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `terser` should be added as a devDependency because official Phaser Vite templates include it | Standard Stack / Supporting | Low — if wrong, `vite build` still works with esbuild's default minifier; terser is only a convention-following choice, not a hard requirement |
| A2 | ESLint 9.x is a safer choice than 10.x for a brand-new Phase 1 despite both being peer-compatible with typescript-eslint 8.64 | Alternatives Considered | Low-Medium — if wrong, no functional harm; worst case is missing out on ESLint 10-only features, easily upgraded later |
| A3 | The official `phaserjs/template-vite-ts` repo's `package.json` (fetched via WebFetch) accurately reflects current recommended dependency versions (phaser ^4.0.0, vite ^6.3.1, typescript ~5.7.2) despite its description text still saying "Phaser 3" | Code Examples / vite.config.ts pattern | Medium — the description/dependency mismatch suggests the template's metadata may lag its actual code; version numbers used here were cross-checked against the npm registry directly rather than trusted from the template alone |

## Open Questions

1. **Should `vite.config.ts` split into dev/prod config files (as the official Phaser template does) or stay as a single file?**
   - What we know: The official template uses `vite/config.dev.mjs` + `vite/config.prod.mjs` with a shared base, likely for CI logging/analytics hooks specific to Phaser Studio's tooling.
   - What's unclear: Whether this project needs that split given no CI logging requirement was mentioned in CONTEXT.md.
   - Recommendation: Use a single `vite.config.ts` for Phase 1 (simpler, sufficient for the stated success criteria); revisit splitting only if build-vs-dev config diverges meaningfully in later phases.

2. **Exact patch version to pin for `@types/node`.**
   - What we know: Latest is `26.1.1`, tracking Node's own version cadence loosely.
   - What's unclear: Which Node major version this project's contributors run locally (not specified in CONTEXT.md/CLAUDE.md).
   - Recommendation: Pin `@types/node` to match whatever Node major is installed locally at scaffold time (verify with `node --version` during execution) — not a blocking decision for Phase 1 since it only affects `vite.config.ts` authoring, not runtime.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server, npm scripts | ✓ | v24.1.0 (verified in this research environment) | — |
| npm | Package installation | ✓ | 11.4.1 | — |
| git | husky pre-commit hooks | ✓ (repo is a git repo per env context) | — | — |

No missing dependencies with no fallback. This phase has no service dependencies (no database, no external API) — pure local toolchain.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None yet installed — this is a greenfield repo with no package.json. Phase 1 does not require a unit-test framework (success criteria are compiler/build/render checks, not behavioral tests). |
| Config file | none — see Wave 0 |
| Quick run command | `npx tsc --noEmit` (strict-mode compile check) |
| Full suite command | `npm run build` (runs `tsc --noEmit && vite build`) |

### Phase Requirement → Verification Map
Phase 1 has no traceable REQ-IDs (pure scaffolding, per ROADMAP.md/CONTEXT.md). Its 4 success criteria map to verification commands instead of unit tests:

| Success Criterion | Verification Type | Automated Command | Notes |
|---|---|---|---|
| 1. Vite dev server runs with HMR, Phaser 4 loads without errors | smoke (headless) | `npm run build` succeeds AND `npx vite --port 0 &` process starts without throwing, then killed — OR run `vite build` as a stand-in proof since a full dev-server HMR loop is inherently interactive | A fully headless proof of "HMR works" is not cheaply automatable; `vite build` succeeding + no console errors during a scripted `vite dev` boot-and-kill is the closest automatable proxy. Flag actual HMR verification as a manual smoke check during execution. |
| 2. TypeScript compiles in strict mode with no warnings | automated | `npx tsc --noEmit` | Fully automatable, exit code 0 = pass |
| 3. Game scene initializes and renders a blank canvas | headless smoke (partial) | Playwright/headless-browser check is possible but adds a new dependency not otherwise needed in Phase 1; **recommended lightweight alternative:** `vite build` succeeds AND a scripted check that `dist/index.html` + `dist/assets/*.js` exist and the built JS contains no `phaser` import errors. Full pixel-level "canvas renders" proof requires a browser automation tool (out of scope for Phase 1 unless the user wants Playwright added early). | Flag as LOW-cost-but-not-zero-cost automation; true visual proof needs a human glance at `npm run dev` in a browser, or a Playwright smoke test added in a later phase once such infra exists |
| 4. Project structure follows Phaser conventions | automated | A simple shell/Node script asserting the existence of `src/game.config.ts`, `src/scenes/{Boot,Preload,Game}Scene.ts`, `src/game/`, `src/ui/`, `public/assets/{tilesets,maps,sprites}/` | Fully automatable as a structural existence check |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (fast, catches strict-mode regressions immediately)
- **Per wave merge:** `npm run build` (full compile + bundle) + directory-structure existence check
- **Phase gate:** `npm run build` green, `npm run lint` green, and a manual `npm run dev` visual check (blank canvas renders, no console errors) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No test framework exists yet — Phase 1 does not require one given its scaffolding-only scope. If a later phase (e.g., Phase 3 Game State Architecture, which is pure TypeScript with no Phaser dependency) wants automated unit tests, that phase's research should evaluate Vitest (Vite-native, zero extra config since Vite is already present) as the standard choice.
- [ ] No browser automation tool (Playwright/Puppeteer) exists yet for true visual/headless canvas-render verification — flagged as an Open Question above; not required to satisfy Phase 1's stated success criteria via the compiler/build-based verification proxies above, but worth reconsidering if future phases need visual regression checks.

## Project Constraints (from CLAUDE.md)

- **Language:** TypeScript 5.5+, `strict: true` must stay enabled from day 1 — cannot be enabled mid-project. Research confirms this phase's tsconfig satisfies this (`strict: true`, TypeScript pinned `~5.9.3`).
- **Game Framework:** Phaser 4.1.0 (ESM, modern WebGL renderer) — locked exact version; research confirms it exists on npm and documents its ESM import fix in 4.1.0.
- **Build Tool:** Vite 5 — locked major version despite Vite 8 being current upstream; research pins to `^5.4.21`.
- **World:** Tile-based grid (Tiled JSON) — not relevant to Phase 1 (starts Phase 2); `public/assets/maps/` directory reserved per CONTEXT.md D-05.
- **UI Layer:** HTML/CSS DOM overlay, not Phaser UI objects — `src/ui/` reserved but empty in Phase 1.
- **State:** Vanilla TypeScript classes + event emitter, no Redux/Zustand — not relevant to Phase 1 (starts Phase 3); `src/game/` reserved but empty.
- **Conventions:** No Phaser imports in `src/game/` (world simulation must stay pure TS) — Phase 1 must not violate this even though `src/game/` is empty; any placeholder files added should avoid importing `phaser`.
- **Conventions:** Event-driven architecture — not exercised until Phase 3, but Phase 1's Scene SHUTDOWN cleanup pattern (Pattern 2 above) is the foundational piece this depends on.
- **Conventions:** Citizens use UUID-based IDs — not relevant to Phase 1.
- **Architecture:** Build order is "World State → Pathfinding → Entity system → Task system → Resources → UI" — confirms Phase 1 (scaffolding) precedes all of this and should not attempt to front-run any of these systems.

None of the above directives are contradicted by this research's recommendations.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view phaser`, `npm view vite`, `npm view typescript`, `npm view typescript-eslint`, `npm view eslint`, `npm view husky`, `npm view lint-staged`, `npm view prettier`, `npm view eslint-config-prettier`, `npm view @types/node`, `npm view globals`) — all version numbers, dist-tags, and peerDependencies in this document were verified directly against the live registry during this research session (2026-07-20).

### Secondary (MEDIUM confidence)
- [Phaser v4.1.0 "Salusa" release notes](https://phaser.io/news/2026/04/phaser-4-1-0-salusa-release) — ESM import fix, Layer/GameObject type fix, mipmap regeneration option
- [phaserjs/template-vite-ts package.json](https://raw.githubusercontent.com/phaserjs/template-vite-ts/main/package.json) — official template dependency baseline (note: description text says "Phaser 3" while dependency is pinned to `^4.0.0` — treated as a metadata lag, not distrusted entirely, since versions were cross-verified against npm registry)
- [phaserjs/template-vite-ts vite/config.dev.mjs](https://github.com/phaserjs/template-vite-ts/blob/main/vite/config.dev.mjs) — dev server port, manualChunks pattern for Phaser
- Phaser Scenes.Events documentation (docs.phaser.io) — SHUTDOWN/DESTROY event semantics, `removeAllListeners()` auto-cleanup behavior on scene's own emitter
- "Why Your TypeScript 7 Upgrade Broke ESLint, ts-jest, and ts-morph" (devencyclopedia.com / dev.to cross-post) — corroborated directly by the npm-registry-verified `typescript-eslint` peerDependencies range

### Tertiary (LOW confidence)
- General WebSearch summaries on Vite HMR dispose pattern for Phaser (community blog/tutorial consensus, not an official Phaser or Vite doc page specifically for this combination) — the underlying `import.meta.hot.dispose` API itself is HIGH confidence (official Vite docs), but its specific application to `game.destroy(true)` is a community-derived pattern, not an official Phaser-documented one.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version number was directly verified against the npm registry in this session, including the critical TypeScript-major-version pitfall
- Architecture patterns: HIGH-MEDIUM — Phaser config shape and Scene SHUTDOWN pattern are documented/cited; the exact Vite config chunking pattern is derived from an official-but-possibly-stale-metadata template, cross-checked structurally
- Pitfalls: HIGH — the TypeScript 7 / typescript-eslint incompatibility was independently verified via `npm view typescript-eslint peerDependencies` in addition to WebSearch corroboration; the HMR dispose pattern is a well-established, widely-documented Vite API used in the standard documented way

**Research date:** 2026-07-20
**Valid until:** 30 days (stable stack once pinned) — but re-verify TypeScript's ecosystem-wide 7.x adoption status before Phase 1 execution if there is any delay, since typescript-eslint's `7.1` API-stabilization timeline was described as "expected" rather than confirmed-shipped as of this research date.
