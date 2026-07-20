# Roadmap: Civilization Game

**Project:** Civilization Game (CIVGAME)  
**Granularity:** Fine (8-12 phases)  
**Created:** 2026-05-05  
**Status:** Not started

---

## Phases

- [ ] **Phase 1: Bootstrap & Phaser Setup** - Project scaffold with Phaser 4, Vite, TypeScript, and scene initialization
- [ ] **Phase 2: Tile World Rendering** - Tilemap rendering with texture atlas and camera control
- [ ] **Phase 3: Game State Architecture** - TypeScript state classes, event system, and GameClock
- [ ] **Phase 4: Entity System** - Citizens and buildings as renderable entities on the tile grid
- [ ] **Phase 5: Task Definitions** - Task types and job priority structures with weight system
- [ ] **Phase 6: Autonomous Task Execution** - Task selection loop and citizen behavior AI
- [ ] **Phase 7: Resource Generation** - Wood/stone production from Cut/Mine/Carry tasks
- [ ] **Phase 8: Resource HUD** - Resource display on screen
- [ ] **Phase 9: Citizen Selection & Job Panel** - Click-to-select citizens, view/assign jobs
- [ ] **Phase 10: Integration & Polish** - Connect all systems, game loop playable end-to-end

---

## Phase Details

### Phase 1: Bootstrap & Phaser Setup

**Goal:** Project foundation ready for rendering — Phaser 4, Vite, TypeScript (strict mode), and initial scene structure in place.

**Depends on:** Nothing (foundation phase)

**Requirements:** None (pure scaffolding)

**Success Criteria** (what must be TRUE):
1. Vite dev server runs with HMR, Phaser 4 loads without errors
2. TypeScript compiles in strict mode with no warnings
3. Game scene initializes and renders a blank canvas
4. Project structure follows Phaser conventions (scenes, assets, config)

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Build tooling scaffold: package.json, tsconfig.json, vite.config.ts, eslint.config.js, prettier, husky/lint-staged
- [ ] 01-02-PLAN.md — Phaser scene graph: game.config.ts, main.ts, Boot/Preload/Game scenes, directory structure, dev-server checkpoint

---

### Phase 2: Tile World Rendering

**Goal:** Players see a tile-based grid world rendered in browser — tilemap, texture atlas, basic camera setup.

**Depends on:** Phase 1

**Requirements:** WORLD-01

**Success Criteria** (what must be TRUE):
1. Tilemap loads from Tiled JSON and renders on canvas with zero visual glitches
2. Texture atlas (Kenney.nl) is pre-atlased and used by TilemapLayer (not individual sprites)
3. Camera renders the world at correct zoom level, player can see the full starting map
4. Frame rate stable at 60 FPS with tilemap visible

**Plans:** TBD

**UI hint:** yes

---

### Phase 3: Game State Architecture

**Goal:** Decoupled world simulation state — typed TypeScript classes, event emitter, and GameClock for stable tick rate.

**Depends on:** Phase 1

**Requirements:** None directly (foundational architecture)

**Success Criteria** (what must be TRUE):
1. GameState class holds all mutable world state (citizens, buildings, resources, clock)
2. EventEmitter broadcasts state changes (e.g., resourceChanged, taskCompleted)
3. GameClock ticks independently from Phaser frame rate, stable at ~20 ticks/sec
4. Scene subscribes to events and re-renders on state change (decoupled simulation from view)

**Plans:** TBD

---

### Phase 4: Entity System

**Goal:** Citizens and buildings exist as entities on tile grid — can be rendered and selected.

**Depends on:** Phase 2, Phase 3

**Requirements:** CTZN-01, BUILD-01, BUILD-02, BUILD-03

**Success Criteria** (what must be TRUE):
1. Citizens exist with name, job slot, position on tile grid, visual representation
2. Lumber camp, mine, and hut buildings are pre-placed on map and render at correct tiles
3. Entities have unique IDs and can be queried by position
4. Citizens render above terrain, buildings render at correct layer without z-fighting

**Plans:** TBD

**UI hint:** yes

---

### Phase 5: Task Definitions

**Goal:** Four task types (Gather, Carry, Mine, Cut) defined with job priority system.

**Depends on:** Phase 3

**Requirements:** TASK-01, TASK-02, TASK-03, TASK-04

**Success Criteria** (what must be TRUE):
1. Task types enum exists (Gather, Carry, Mine, Cut) with distinct identifiers
2. Job class stores task priorities as numeric weights (0-10 scale, 0 = never performed)
3. Lumberjack job defaults: Cut:7, Carry:5, Mine:2, Gather:0
4. Miner job defaults: Mine:7, Carry:5, Cut:2, Gather:0
5. Job assignment updates citizen's job without errors

**Plans:** TBD

---

### Phase 6: Autonomous Task Execution

**Goal:** Citizens autonomously pick tasks based on job priorities and world state; task loop executes on each clock tick.

**Depends on:** Phase 4, Phase 5

**Requirements:** TASK-05, TASK-06

**Success Criteria** (what must be TRUE):
1. Task selection AI scores available tasks (job weight × world demand) each clock tick
2. Citizen picks highest-scoring task or idles if none available
3. Citizen executes task for configurable duration (e.g., 5-10 ticks per task)
4. On task completion, citizen re-evaluates and picks next task
5. Task state changes broadcast via event system (for HUD updates)

**Plans:** TBD

---

### Phase 7: Resource Generation

**Goal:** Cut/Mine/Carry tasks generate wood/stone resources from production sites.

**Depends on:** Phase 4, Phase 6

**Requirements:** RSRC-01, RSRC-02, RSRC-03, RSRC-04, RSRC-05

**Success Criteria** (what must be TRUE):
1. When citizen executes Cut task at lumber camp, wood increments by 1 per task completion
2. When citizen executes Mine task at mine, stone increments by 1 per task completion
3. Carry task moves resource from production site to storage (globally available)
4. Wood and stone totals stored in GameState, persist across citizen reassignment
5. Task completion logs resource increment to confirm system works

**Plans:** TBD

---

### Phase 8: Resource HUD

**Goal:** Wood and stone resource totals visible on screen at all times — UI overlay displays current pool.

**Depends on:** Phase 7

**Requirements:** UI-03

**Success Criteria** (what must be TRUE):
1. DOM overlay (HTML) displays "Wood: N" and "Stone: N" at top of screen
2. HUD updates when resources change (listens to resourceChanged event)
3. HUD layout is readable and does not obscure game world
4. Numbers update without lag (sub-100ms response)

**Plans:** TBD

**UI hint:** yes

---

### Phase 9: Citizen Selection & Job Panel

**Goal:** Player can click citizen to select, view name/job/task, and reassign job from panel.

**Depends on:** Phase 4, Phase 5

**Requirements:** UI-01, UI-02

**Success Criteria** (what must be TRUE):
1. Left-click citizen highlights them and opens selection panel
2. Panel shows citizen name, current job, current task
3. Player can change job via dropdown; change applies immediately and broadcasts event
4. Panel closes when clicking elsewhere or pressing Escape
5. Only one citizen selected at a time

**Plans:** TBD

**UI hint:** yes

---

### Phase 10: Integration & Polish

**Goal:** All systems connected, game loop playable end-to-end with no critical bugs or missing feel.

**Depends on:** Phase 8, Phase 9

**Requirements:** All (integration checkpoint)

**Success Criteria** (what must be TRUE):
1. Player can observe citizens executing tasks based on job assignment
2. Resource totals increase as citizens work (visual feedback)
3. Changing citizen jobs causes observable behavior changes (task priorities shift)
4. No UI crashes, no memory leaks, frame rate stable 30+ FPS with 10 citizens
5. Game loop can run for 5+ minutes with no hang or reset required

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap & Phaser Setup | 0/2 | Not started | - |
| 2. Tile World Rendering | 0/4 | Not started | - |
| 3. Game State Architecture | 0/4 | Not started | - |
| 4. Entity System | 0/4 | Not started | - |
| 5. Task Definitions | 0/3 | Not started | - |
| 6. Autonomous Task Execution | 0/3 | Not started | - |
| 7. Resource Generation | 0/3 | Not started | - |
| 8. Resource HUD | 0/2 | Not started | - |
| 9. Citizen Selection & Job Panel | 0/3 | Not started | - |
| 10. Integration & Polish | 0/2 | Not started | - |

---

**Total Progress:** 0/33 plans  
**Roadmap Status:** Ready for phase planning
