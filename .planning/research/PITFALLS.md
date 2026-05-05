# Pitfalls Research: TypeScript + Phaser.js Colony Management Game

**Domain:** Browser-based tile colony management sandbox game  
**Researched:** 2026-05-05  
**Confidence:** MEDIUM (WebSearch + multiple sources, verified with performance guides)

---

## Critical Pitfalls

### Pitfall 1: Scene Memory Leaks from Event Listeners

**What goes wrong:**  
Event listeners attached to scenes (input, physics, timers, custom events) aren't cleaned up when the scene shuts down. Each scene transition leaves behind active listeners, causing:
- Multiple callbacks firing for single user interactions (input events registered twice)
- Gradually increasing memory consumption
- Crashes on mobile/low-memory devices

**Why it happens:**  
Phaser scenes have a complex lifecycle (init → preload → create → update → shutdown). Developers often forget that event listeners persist across scene transitions unless explicitly removed. Arrow functions used in listeners can't be unregistered, creating permanent references.

**Consequences:**  
- Frame rate drops as listeners accumulate (5ms pauses visible at 60 FPS)
- UI buttons respond multiple times to one click
- Game becomes unresponsive after 10+ minutes of play
- Harder to debug than clear crashes

**Prevention:**  
- **Always clean up in SHUTDOWN event:**
  ```typescript
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    this.events.off();  // Remove all listeners for this scene
    this.input.off();   // Remove input handlers
    this.physics.world.shutdown();  // Clean up physics
  });
  ```
- Use `once()` for single-fire events (auto-cleanup)
- Avoid arrow functions in removable listeners; use `off()` with same callback reference
- Use scene lifecycle events (PAUSE, RESUME) correctly
- Profile with Chrome DevTools to catch memory leaks early

**Warning signs:**  
- Click/input events firing 2x or more
- "Chrome DevTools → Memory → Take Heap Snapshot" shows growing detached DOM nodes
- Game slows after repeated scene transitions
- Frame rate drops visibly over time without adding features

**Address in:** **Phase 1 (Architecture)** — Establish scene lifecycle patterns before any complex scenes. Phase 2 (Citizens) will heavily use event listeners for citizen state changes; must be bulletproof from the start.

---

### Pitfall 2: Unoptimized Game State Mutations Causing Silent Bugs

**What goes wrong:**  
Game state (citizen inventory, resources, needs) is mutated directly without immutability constraints. Changes made in one system bleed into another system unexpectedly:
- Citizen health modified by UI, breaking game logic calculations
- Resource counts changed in two different places, creating inconsistent state
- Undo/replay impossible; time-travel debugging not viable
- Hard-to-reproduce bugs where "this should work but doesn't"

**Why it happens:**  
TypeScript allows direct object mutation by default. A citizen's health can be changed via `citizen.health = 50` anywhere in the codebase. Without strict immutability patterns, multiple systems mutate the same object, causing state inconsistencies that are extremely hard to trace.

**Consequences:**  
- Bugs that manifest 20 minutes into gameplay, not reproducible from save state
- Citizens with impossible state (dead but still working, needs > 100%)
- Cascading failures when one system unknowingly broke another's assumptions
- Refactoring breaks undocumented side effects

**Prevention:**  
- **Use readonly properties in TypeScript:**
  ```typescript
  type Citizen = {
    readonly id: string;
    readonly health: number;  // Cannot be mutated directly
    readonly inventory: readonly Resource[];
  };
  ```
- **Create immutable update functions:**
  ```typescript
  function setCitizenHealth(citizen: Citizen, newHealth: number): Citizen {
    return { ...citizen, health: Math.max(0, Math.min(100, newHealth)) };
  }
  ```
- **Enable strict null checks** in tsconfig.json from day one: `"strictNullChecks": true`
- Use Redux or similar pattern for centralized state; all mutations go through single update pipeline
- Implement state snapshots for debugging/replay capability
- Never pass game state directly to UI; create separate UI-state objects

**Warning signs:**  
- Compiler not catching mutation attempts (missing strictNullChecks)
- UI shows different values than game logic expects
- Same calculation produces different results in different systems
- "It worked yesterday" but no code changes

**Address in:** **Phase 1 (Architecture)** — Define state shape and mutation rules before writing any systems. This prevents technical debt; refactoring later costs exponentially more.

---

### Pitfall 3: Citizen Update Loop Bottleneck at Scale

**What goes wrong:**  
Every citizen's needs, job performance, and state updates run sequentially each frame. At 10 citizens, it's fine. At 50+, the update loop consumes all available frame budget:
- Update loop takes 10+ ms on a 60 FPS budget (16.67 ms/frame)
- Citizens stop responding to inputs; UI lags
- Game feels unresponsive and sluggish
- Further scaling is impossible without rewrite

**Why it happens:**  
Naive citizen update: iterate all citizens, check needs, calculate job performance, update positions, check housing, reduce morale, etc. Each citizen check is O(1) but with many citizens, sum becomes O(n). Physics checks for pathfinding add another O(n*m) cost.

**Consequences:**  
- Game unplayable with 50+ citizens (target is 10, but scope creep adds more)
- No room for additional features (weather, seasons, events)
- Forced rewrite of citizen system mid-development
- Performance cliffs where game works at 20 citizens, breaks at 30

**Prevention:**  
- **Separate update into phases, update selectively:**
  - **Fast updates** (every frame): position, animation, input
  - **Slow updates** (every 10 frames): need decay, morale calculation
  - **Rare updates** (every 100 frames): job efficiency checks
  ```typescript
  const UPDATE_PHASES = {
    movement: 1,    // Every 1 frame
    needs: 10,      // Every 10 frames
    efficiency: 100 // Every 100 frames
  };
  ```
- **Batch physics checks**: Don't check collision for every citizen every frame; use spatial hashing
- **Profile early**: Use Chrome DevTools → Performance → Record → check "Update" time
- **Set frame budget targets**: "Citizens subsystem ≤ 4ms per frame"
- **Cache expensive calculations**: Don't recalculate citizen nearby-building every frame

**Warning signs:**  
- Frame time steadily increases as you add citizens
- DevTools shows update time > 5ms
- Input lag becomes noticeable when camera pans
- FPS counter drops below 50 when citizens are on-screen

**Address in:** **Phase 2 (Citizens)** — Establish update loop architecture before implementing citizen AI. Test with 20+ citizens early; don't wait until v1.5 to optimize.

---

### Pitfall 4: Tile Rendering Performance Cliff (Too Many Draw Calls)

**What goes wrong:**  
Individual sprites for each tile, building, or particle instead of texture atlases and tilemap layers. Renderer issues 100+ draw calls per frame:
- GPU stalls; rendering takes 10+ ms
- Camera pans stutter
- WebGL context switches cause frame drops
- Game feels sluggish at moderate map sizes

**Why it happens:**  
Tempting to render each tile/building as an individual sprite from its own texture file. Each texture requires a separate GPU state switch (draw call). Phaser can batch sprites from the same texture, but not across different textures.

**Consequences:**  
- 4K tile map → 4000+ draw calls → unplayable
- Adding decorations (trees, rocks) multiplies draw calls
- Mobile devices drop to 10-15 FPS
- No room for visual effects (particle systems, animations)

**Prevention:**  
- **Use texture atlases** (single .png with all sprites, most impactful optimization):
  ```typescript
  this.load.atlas('tiles', 'assets/tiles.png', 'assets/tiles.json');
  // 1 draw call for 200 sprites instead of 200 calls
  ```
- **Use TilemapLayer** (static, optimized rendering):
  ```typescript
  const layer = this.make.tilemap({ key: 'tilemap' }).createLayer(0, 'tiles');
  // Phaser batches entire layer into 1-2 draw calls
  ```
- **Avoid individual sprite rendering for static tiles**; use tilemap layers
- **StaticTilemapLayer vs DynamicTilemapLayer**: Use Static for terrain that doesn't change
- **Profile in Chrome DevTools**: Rendering should be ≤ 5ms, GPU drawing ≤ 2ms
- **Test map sizes early**: Render full planned map size during Phase 1 prototyping

**Warning signs:**  
- DevTools → Rendering shows >50 draw calls
- FPS drops when zooming out to see full map
- Mobile/low-end devices unplayable
- Adding one more building layer kills performance

**Address in:** **Phase 1 (Core Rendering)** — Use texture atlases and tilemap layers from first commit. Changing this mid-project is a 2-3 day refactor.

---

### Pitfall 5: UI State Tangled with Game State

**What goes wrong:**  
Game state and UI state are mixed (citizen display data lives in Citizen object, building UI data in Building). Changes to UI require changing game logic:
- Displaying "citizen is idle" requires querying job status, housing proximity, needs—logic scattered across systems
- Refactoring UI breaks game logic
- Multiplayer / server-sync becomes impossible (UI mutations shouldn't sync)
- Undo/replay broken because UI state was serialized

**Why it happens:**  
Convenient to store `citizen.uiSelected = true`, `building.hoverText = "..."` in game objects. Works for small games; creates massive coupling in larger ones.

**Consequences:**  
- UI changes require changes to game logic
- Game can't function without UI (no headless testing)
- Adding new UI panels requires editing game object classes
- Multiplayer-ready refactor in Phase 2 is painful

**Prevention:**  
- **Separate game state from UI state:**
  ```typescript
  // Game state: only data needed for game logic
  type Citizen = { id: string; health: number; jobId: string | null };
  
  // UI state: derived from game state
  type CitizenUIState = { citizenId: string; isSelected: boolean; displayColor: string };
  ```
- **Create selectors/derived state**: UI queries game state, computes display values
  ```typescript
  const getCitizenStatus = (citizen: Citizen) => 
    citizen.health < 30 ? 'dying' : 'healthy';
  ```
- **Use reactive pattern**: When game state changes → update UI state (Redux, RxJS, or observer pattern)
- **Never write UI mutations back to game state**
- **UI should be read-only view of game state**

**Warning signs:**  
- Game object classes have properties like `isSelected`, `hoverText`, `displayName`
- UI logic mixed with citizen/building updates
- Changing UI layout requires changing game classes
- Can't test game without rendering

**Address in:** **Phase 1 (Architecture)** — Define state boundaries before any UI code. This is cheap now, expensive later.

---

## Common Mistakes

### Mistake 1: Texture Atlas Missing or Incomplete

**What goes wrong:**  
Tiles/sprites rendered from individual files or atlas is missing some sprites, causing fallback to individual texture loads.

**Prevention:**  
- Audit all assets before Phase 1 complete
- Use Kenney.nl tilesets (already atlased)
- Validate atlas.json includes all referenced sprites
- Test build catches missing textures

**Detection:**  
- DevTools shows >50 draw calls for static scene
- Inspector shows texture switches between tiles

---

### Mistake 2: Forgetting Scene Pausing vs Sleeping

**What goes wrong:**  
`scene.pause()` keeps scene visible and updating. `scene.sleep()` stops updates but keeps state. Easy to pause UI scene, then accidentally sleep game scene.

**Prevention:**  
- Document scene lifecycle in architecture decision record
- Use consistent pattern: pause = keep visible, sleep = hide and stop

---

### Mistake 3: Physics Calculations Running Off-Screen

**What goes wrong:**  
Pathfinding, collision checks run for all citizens even outside camera view, wasting CPU.

**Prevention:**  
- Disable physics bodies for off-screen entities
- Use spatial queries (only check collisions in visible area)
- Cache pathfinding results; don't recalculate every frame

---

### Mistake 4: Mixing Phaser Input with DOM Listeners

**What goes wrong:**  
Game responds to both Phaser's pointer events and DOM pointer events, causing double input handling.

**Prevention:**  
- Use Phaser input exclusively for game events
- Use DOM listeners only for UI panels outside canvas
- Clean up DOM listeners in scene shutdown

---

### Mistake 5: Not Profiling Before "Optimizing"

**What goes wrong:**  
Developers assume citizens update or rendering is the bottleneck, spend time optimizing, but real bottleneck was physics or something else.

**Prevention:**  
- Profile first: Chrome DevTools → Performance → Record 60 frames
- Identify actual bottleneck (rendering, update, physics, GC)
- Then optimize that specific area

---

### Mistake 6: Scope Creep: "Let's Add NPCs, Weather, Seasons"

**What goes wrong:**  
v1 targets 10 settlers + wood/stone. By Phase 2, scope expands to include:
- 50 settlers
- 5 resource types
- Combat/defense
- Multiple maps
- Seasonal transitions
- NPC traders

Development stalls; core management loop never validated.

**Prevention:**  
- **Strict prioritization**: Use MoSCoW method
  - **Must have** (v1): Citizens, jobs, housing, wood/stone, ~10 population
  - **Should have** (v1.5): 20 population, 1 more resource type
  - **Could have** (v2): Weather, NPCs, 50+ population
  - **Won't have** (v1): Combat, multiplayer, save/load
- **Define "done" for each phase** before starting
- **Validate assumptions at phase boundaries** before expanding scope
- **Kill features that don't serve core loop**

---

### Mistake 7: No Early Playtesting

**What goes wrong:**  
Build in isolation for 3 months, then show to players. Citizens mechanics feel wrong; redesign required. 6-week rewrite.

**Prevention:**  
- Ship playable version (even ugly) by end of Phase 2
- Have 3-5 people test for 30 min each; gather feedback
- If core loop doesn't feel good, adjust Phase 3 before expanding

---

### Mistake 8: Missing strictNullChecks

**What goes wrong:**  
TypeScript accepts `undefined` values without complaint. Code assumes citizen exists but it's null:
```typescript
const citizen = findCitizen(id);  // Could return undefined
citizen.health = 50;  // Crash: Cannot read property 'health' of undefined
```

**Prevention:**  
- Enable in tsconfig.json from day one: `"strictNullChecks": true`
- Requires null checks at call sites: `citizen?.health = 50` or explicit guard
- Cannot be enabled mid-project (100+ compiler errors)

---

### Mistake 9: Citizen Data Without Unique IDs

**What goes wrong:**  
Citizens referenced by index or object reference. Index shifts when citizens deleted → citizen at index 2 is suddenly wrong.

**Prevention:**  
- Every citizen/building gets immutable UUID from creation
- Reference by ID, not index or object ref
- UI holds citizen IDs, not citizen objects

---

### Mistake 10: Pathfinding Calculated Every Frame

**What goes wrong:**  
Citizen A* pathfinding runs every frame, consuming 2+ ms per citizen.

**Prevention:**  
- Cache pathfinding result; only recalculate when destination changes or path blocked
- Use waypoint-based navigation (fewer nodes = faster A*)
- Consider grid-based waypoints instead of tile-to-tile A*

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|-----------|
| Phase 1 | Renderer setup | Individual sprites instead of atlases; too many draw calls | Use tilemap layers + atlas from day one; profile in Chrome DevTools |
| Phase 1 | Scene architecture | Memory leaks from event listeners | Document shutdown cleanup pattern; test scene transitions 10x |
| Phase 1 | State shape | Mutable game state mixed with UI state | Define immutable state types; use readonly properties |
| Phase 2 | Citizen update loop | Bottleneck at 20+ citizens | Separate update into phases; profile with 20 citizens early |
| Phase 2 | Citizen AI | No unique IDs; citizens confused when one deleted | Every citizen gets UUID; reference by ID |
| Phase 2 | Needs simulation | Needs calculation contradicts job logic | Single source of truth for need calculations; unit test all formulas |
| Phase 3 | Feature expansion | Scope creep to 50 citizens, 5 resources, combat | Strict prioritization; validate Phase 2 before expanding |
| Phase 3 | Multiplayer prep | Game state can't be serialized/replayed | Immutable state from Phase 1 enables this; server-sync simpler |

---

## Domain-Specific Patterns to Avoid

### Anti-Pattern 1: Citizen as Monolithic Class

**Bad:**
```typescript
class Citizen {
  update() {
    // Updates position, decays needs, checks housing, calculates job efficiency
    // 40 lines doing everything
  }
}
```

**Good:** Use ECS or system-based updates
```typescript
// Systems update specific aspects
updateCitizenPositions(citizens);
updateCitizenNeeds(citizens);
checkCitizenHousing(citizens);
```

---

### Anti-Pattern 2: Input Handling in Game Scene

**Bad:** Player input tied to main game scene; pause menu breaks game responsiveness.

**Good:** Separate input scene that layers over game. Input → commands → game state.

---

### Anti-Pattern 3: Direct Phaser Object State

**Bad:**
```typescript
const citizen = this.physics.add.sprite(x, y, 'citizen');
citizen.data.set('health', 100);  // Using Phaser's data as game state
citizen.displayText = 'healthy';  // Mixing UI + game
```

**Good:** Keep game state external; use Phaser objects only for rendering.

---

## Sources

- [Troubleshooting Phaser Performance and Memory Issues in Large-Scale Games - Mindful Chase](https://www.mindfulchase.com/explore/troubleshooting-tips/game-development-tools/troubleshooting-phaser-performance-and-memory-issues-in-large-scale-games.html)
- [Phaser Performance Optimization Guide: Object Pooling, Atlases & More (2025)](https://generalistprogrammer.com/tutorials/phaser-performance-optimization-guide)
- [Building an ECS in TypeScript: Dirty Component Optimization - Maxwell Forbes](https://maxwellforbes.com/posts/typescript-ecs-dirty-component-optimization/)
- [Entity Component System in TypeScript - DEV Community](https://dev.to/tpetrina/entity-component-system-in-typescript-ha6)
- [Decoupling your game code via Command pattern - Medium](https://medium.com/gamedev-architecture/decoupling-game-code-via-command-pattern-debugging-it-with-time-machine-2b177e61556c)
- [DECOUPLING UI FROM GAME STATE FOR FUN AND PROFIT - Fall Damage](https://www.falldamagestudio.com/posts/decoupling-ui-from-game-state-for-fun-and-profit)
- [Scope Creep in Game Development - Medium](https://medium.com/@kaskiewicz.radoslaw/scope-creep-in-game-development-when-your-game-starts-running-away-from-you-f73a5158a12c)
- [Immutable by Default: Practical TypeScript Patterns](https://marekhonzal.com/blog/immutable-by-default-typescript)
- [TypeScript: TSConfig Option: strictNullChecks](https://www.typescriptlang.org/tsconfig/strictNullChecks.html)
- [Tiles and tilemaps overview - MDN Game Development](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)
- [Red Blob Games: Grid pathfinding optimizations](https://www.redblobgames.com/pathfinding/grids/algorithms.html)
- [Anatomy of a video game - MDN](https://developer.mozilla.org/en-US/docs/Games/Anatomy)
- [Game Programming Patterns - Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
