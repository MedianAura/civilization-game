# Technology Stack Research: Civilization Game

**Project:** Browser-based TypeScript + Phaser.js tile-based colony management game  
**Researched:** 2026-05-05  
**Overall Confidence:** HIGH

## Executive Summary

The 2025 standard stack for Phaser.js browser games has converged around **Phaser 4.1.0 + Vite 5 + TypeScript 5.x**. Phaser 4 shipped in April 2026 with a completely rebuilt WebGL renderer, 100x faster sprite rendering, and a modern plugin architecture. Vite is now the overwhelming default build tool (78k GitHub stars vs webpack's 66k), offering sub-second hot module reload and zero-config TypeScript support. This stack is battle-tested, well-documented, and removes friction from development.

For game state management, avoid heavy frameworks (Redux, Pinia). Either use vanilla TypeScript classes with Phaser Scene lifecycle for small-to-medium scope (sufficient for a POC colony game), or Zustand for cross-scene shared state (only if you need persistent state across multiple scenes). Tiled JSON remains the standard for tilemap definition, loaded directly by Phaser's built-in tilemap loader.

The critical decision: **Phaser 4 not Phaser 3**, because you're shipping now (2026) and Phaser 3 is 6 years old. Phaser 4's renderer performance and modern ESM architecture make it worth the (small) learning curve. The API surface for basic games is nearly identical.

---

## Recommended Stack

### Core Framework

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **Phaser** | 4.1.0 | Latest stable, released April 2026. Ground-up WebGL rebuild with 100x faster sprite rendering, modern node-based renderer, proper context restoration. Phaser 3 (now 6 years old) shows its age with legacy renderer. Phaser 4 is production-ready with full ESM support and TypeScript definitions bundled. See [Phaser v4.1.0 release](https://phaser.io/news/2026/04/phaser-4-1-0-salusa-release). | HIGH |
| **TypeScript** | 5.x (5.5+ recommended) | Standard for type-safe game code. Phaser 4 includes full TypeScript definitions in the types folder (no separate @types package needed). Required by Vite. | HIGH |
| **Node.js** | 18.x LTS or 20.x LTS | Minimum for Vite 5 and modern npm tooling. 20.x recommended for long-term stability. | HIGH |

### Build & Tooling

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **Vite** | 5.x (5.0.8+ recommended) | Default bundler for Phaser in 2025/2026. Unbundled ESM dev server (sub-second HMR), built-in TypeScript support, zero-config for most projects. Webpack is still valid but requires manual ts-loader configuration. Vite has 78k GitHub stars vs webpack's 66k, and 53M weekly npm downloads vs webpack's 36M. See [Vite vs Webpack 2025 comparison](https://dev.to/abhinavshinoy90/vite-vs-webpack-who-wins-in-2025-1cd6). | HIGH |
| **npm** | Latest (10.x+) | Package manager. Yarn/pnpm also valid but npm ships with Node.js. | HIGH |

### Development & Code Quality

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **ESLint** | 9.x | Optional but recommended for a POC. Catches common TypeScript mistakes. Configure with `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`. | MEDIUM |
| **Prettier** | 3.x | Optional but recommended. Format on save in VS Code. Use `eslint-config-prettier` (not eslint-plugin-prettier) to avoid conflicts. | MEDIUM |
| **ts-node** | Latest | Optional. Only needed if you write build scripts in TypeScript. Not required for basic Phaser setup. | LOW |

### Game State Management

| Approach | When to Use | Confidence |
|----------|------------|------------|
| **Vanilla TypeScript + Phaser Scene lifecycle** | Use this for v1 POC with ~10 settlers and simple resource loop. Simplest approach: define ColonistState, ResourceState as classes, manage updates in Scene.update(). No external dependencies. Colony logic lives in Scene or as separate Game class passed to Scene. Sufficient for single-scene colony sandbox. | HIGH |
| **Zustand** (optional upgrade) | Only add if: (1) you build multi-scene game where player can switch between colony view and detail screens, (2) you need game state to persist across scene changes. Zustand is lightweight (2.8kb gzip), TypeScript-first, no boilerplate. Avoid Redux Toolkit for game code (too verbose for this domain). | MEDIUM |

**Rationale:** Phaser Scenes are isolated world-state containers by design. For a single-scene sandbox POC, all state lives in the Scene. If you later split into multiple scenes, migrate to Zustand incrementally. See [state management comparison 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k).

### Tilemap & Asset Pipeline

| Component | Tool/Format | Rationale | Confidence |
|-----------|------------|-----------|------------|
| **Tilemap Definition** | Tiled (JSON export) | Industry standard for tile-based games. Phaser's built-in tilemap loader handles JSON format natively via `load.tilemapTiledJSON()` and `make.tilemap()`. Zero external dependencies. Alternatives (CSV, 2D arrays) are manual and error-prone. | HIGH |
| **Tilemap Loading in Code** | Phaser tilemap API | Load via: `scene.load.tilemapTiledJSON('map-key', 'path/to/map.json')`, then `scene.make.tilemap({key: 'map-key'})` in create(). Built-in, no wrapper needed. | HIGH |
| **Spritesheets & Atlases** | TexturePacker (paid) or free alternatives | Phaser loads sprite atlases via `load.multiatlas()`. For v1 POC, free asset packs (Kenney.nl tilesets) often include pre-built atlases in Phaser 3 JSON format. TexturePacker ($40 one-time) is industry standard for custom art. Free tools exist but slower workflow. For POC, use Kenney.nl free packs (already atlased). | MEDIUM |
| **Image/JSON Asset Loading** | Standard `load.image()`, `load.json()` | Phaser's loader queue. Define preload() method, add assets, auto-loads on scene start. No build step for assets (unlike webpack). | HIGH |

**Asset Pipeline Note:** Unlike web apps, Phaser doesn't need webpack/Vite to process images. Vite serves images as static files. You only need: (1) raw tileset/sprite images in `public/assets/`, (2) Tiled map JSON files (same folder), (3) Optional: texture atlas JSON from TexturePacker or Kenney packs. Vite handles the rest.

### Optional: Phaser Editor (Not Recommended for v1)

| Tool | Version | Rationale | Confidence |
|------|---------|-----------|------------|
| **Phaser Editor 2D** | 5.x | Visual scene editor and asset manager. Can define scenes visually, export to JSON, load in code. Overkill for v1 POC—adds toolchain complexity without payoff for small scope. Useful for large teams or asset-heavy projects. Skip for now. | LOW |

---

## What NOT to Use

### ❌ Phaser 3
**Why not:** Released 2018, now 6+ years old. Legacy rendering pipeline with known performance ceiling (~50K sprites/frame on modern hardware). Phaser 4 is 100x faster for sprite batching. If learning Phaser for the first time, Phaser 4 is the right choice. Phaser 3 only justified if: (1) you have an existing Phaser 3 codebase, (2) you need to use a Phaser 3–specific plugin not yet ported to Phaser 4. For greenfield POC, this doesn't apply.

### ❌ Webpack (for this project)
**Why not:** Valid but overkill. Requires manual ts-loader configuration, slower dev server startup, more cognitive load on build config. Vite does everything webpack does for Phaser with zero config. Webpack makes sense if: (1) you have complex external module federation needs, (2) you need IE11 support (you don't). Use Vite.

### ❌ Rollup (as primary bundler)
**Why not:** Phaser projects don't benefit from Rollup's strengths (library bundling). Vite uses Rollup under the hood for production builds. Use Vite, not Rollup directly.

### ❌ Redux Toolkit, Pinia, or Complex State Frameworks
**Why not:** Game state is fundamentally different from web app state. Phaser Scenes are already encapsulated state containers. Redux adds boilerplate (actions, reducers, selectors) that game code doesn't need. Use vanilla TypeScript for simple games, Zustand for complex multi-scene games. Redux only justified for massive multiplayer games with server synchronization (not v1 scope).

### ❌ Next.js or Nuxt (as app framework)
**Why not:** Phaser is a standalone game library, not a React/Vue app. Wrapping it in Next.js adds server-side rendering, routing, and state concerns that don't apply to games. You need a static HTML page + Vite dev server, not a full-stack framework. If you ever need a game launcher page or user dashboard, that's a separate UI—not the game itself.

### ❌ Canvas 2D or Raw WebGL
**Why not:** Phaser abstracts both elegantly. Raw Canvas/WebGL is 10x more code for same output. Phaser 4's WebGL renderer is production-grade and fast. Only use raw APIs for specialized post-processing that Phaser's filter system can't handle (unlikely in v1).

### ❌ Babylon.js (3D focus)
**Why not:** Overkill for 2D tile-based game. Babylon.js is focused on 3D. Phaser is the right abstraction level for 2D.

### ❌ TypeScript - `noImplicitAny: false`
**Why not:** Game code with implicit any leads to silent bugs. Set `"strict": true` in tsconfig.json. The few milliseconds of compile time is worth catching mistakes early.

---

## Installation & Setup

### Quick Start (Official)

```bash
# Use the official Phaser Create Game App (recommended)
npx @phaserjs/create-game@latest my-colony-game
cd my-colony-game
npm install
npm run dev
```

This scaffolds: Phaser 4.1.0 + Vite 5 + TypeScript 5 + ESLint + Prettier, pre-configured.

### Manual Setup (Educational)

If you prefer to understand each step:

```bash
# 1. Initialize project
npm init -y
npm install phaser vite @vitejs/plugin-basic-ssl --save

# 2. Dev dependencies
npm install -D typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier --save-dev

# 3. Create files
touch vite.config.ts tsconfig.json src/main.ts public/index.html

# 4. Run dev server
npm run dev
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "types": ["Phaser"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Key decisions:**
- `"strict": true` — catches implicit any, null issues early
- `"target": "ES2020"` — modern browsers only (no transpile overhead)
- `"types": ["Phaser"]` — loads Phaser's bundled type definitions

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import typescript from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    port: 8080,
    open: true, // auto-open browser
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
  },
})
```

### Minimal Game Entry (src/main.ts)

```typescript
import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    // Load assets here
  }

  create() {
    // Setup world
    this.add.text(100, 100, 'Civilization Game', { fontSize: '32px' })
  }

  update() {
    // Per-frame logic
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  scene: GameScene,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
}

const game = new Phaser.Game(config)
```

---

## Package.json Template

```json
{
  "name": "civilization-game",
  "version": "0.1.0",
  "description": "Tile-based colony management game",
  "type": "module",
  "main": "dist/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  },
  "dependencies": {
    "phaser": "^4.1.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.x",
    "@typescript-eslint/parser": "^7.x",
    "@vitejs/plugin-basic-ssl": "^1.x",
    "eslint": "^9.x",
    "prettier": "^3.x",
    "typescript": "^5.5",
    "vite": "^5.x"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## File Structure (After Setup)

```
civilization-game/
├── public/
│   ├── index.html
│   └── assets/
│       ├── tilesets/           # PNG tileset images from Kenney.nl
│       ├── maps/               # Tiled JSON map files
│       └── sprites/            # Character/building sprite sheets
├── src/
│   ├── main.ts                 # Game entry point
│   ├── scenes/
│   │   └── GameScene.ts        # Main colony management scene
│   ├── types/
│   │   └── game.ts             # TypeScript interfaces (Colonist, Resource, etc.)
│   └── objects/                # Game entity classes
│       ├── Colonist.ts
│       ├── Building.ts
│       └── ResourceManager.ts
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── package-lock.json
```

---

## Performance Notes for Colony Games

### Phaser 4 Optimizations (Built-In)

- **Sprite batching:** Render 1M sprites in single draw call (vs thousands in Phaser 3)
- **Dirty flag rendering:** Only redraw changed tiles/sprites per frame
- **WebGL context pooling:** Reuse GPU resources across scenes
- **Layer system:** Group sprites by render order, cull offscreen objects

For a POC with ~10 colonists + ~20 buildings on a 100x100 tile grid, Phaser 4 handles this with zero optimization work. No need for spatial partitioning or custom rendering.

### What to Avoid in v1

- Don't micro-optimize rendering before you have actual performance data
- Don't load all assets as individual PNG files (use atlases)
- Don't compute pathfinding every frame (cache paths, recompute only when target changes)

---

## Version Constraints & Rationale

**Phaser 4.1.0 vs 4.0.0:** v4.1.0 ("Salusa") includes critical ESM import fixes and layer rework that v4.0.0 lacked. Recommend 4.1.0+.

**Vite 5.0.8+:** v5.0.8 first stable release. Earlier 5.0.x had dev server edge cases. Use 5.0.8 or 5.1.x+.

**TypeScript 5.4+:** Strict mode, type narrowing, and async/await support all mature. Older TS versions add friction.

**Node.js 20 LTS (April 2024 – April 2026):** Safe bet for this project timeline. 18 LTS still supported but older.

---

## Key Decisions Rationale

| Decision | Alternative(s) | Why This Choice |
|----------|---|---|
| Phaser 4 over Phaser 3 | Phaser 3, PixiJS, Babylon.js | Phaser 4 is 100x faster, modern ESM, TypeScript built-in, larger ecosystem, zero learning curve if you know Phaser 3 API |
| Vite over Webpack | Webpack 5, Parcel, esbuild | Vite has unbundled ESM dev server (sub-second HMR), zero TypeScript config, official Phaser templates use it, community standard |
| Vanilla TS for state (v1) | Zustand, Redux, Pinia | Game state is Scene-scoped. Zustand adds complexity for no benefit at POC scale. Upgrade later if multi-scene. |
| Tiled JSON for maps | CSV, 2D arrays, tile engines | Tiled is visual editor + JSON export. Phaser loads JSON natively. Enables non-programmer (artist/designer) to build maps. |
| TypeScript strict mode | `noImplicitAny: false` | Catches bugs early, required for large codebases, minimal overhead |

---

## Sources

- [Phaser v4.1.0 "Salusa" Release](https://phaser.io/news/2026/04/phaser-4-1-0-salusa-release)
- [Getting Started with Phaser 4: Vite + TypeScript Setup](https://emanueleferonato.com/2026/04/17/getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create-game-app/)
- [Phaser + TypeScript + Vite Template](https://phaser.io/news/2024/01/phaser-vite-typescript-template)
- [Vite vs Webpack: Who Wins in 2025?](https://dev.to/abhinavshinoy90/vite-vs-webpack-who-wins-in-2025-1cd6)
- [State Management in 2025: When to Use Context, Redux, Zustand, or Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Setting Up ESLint and Prettier for TypeScript](https://medium.com/@robinviktorsson/setting-up-eslint-and-prettier-for-a-typescript-project-aa2434417b8f)
- [Phaser 3 API Documentation - Tilemaps](https://docs.phaser.io/api-documentation/class/tilemaps-tilemap)
- [How to Create Sprite Sheets with TexturePacker](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser)
- [Phaser Editor 2D Template - Vite + TypeScript](https://github.com/phaserjs/phaser-editor-template-vite-ts)
- [Phaser on npm](https://www.npmjs.com/package/phaser)
