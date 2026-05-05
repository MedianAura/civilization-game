# Architecture Research: Civilization Game

**Date:** 2026-05-05
**Researched Scope:** TypeScript + Phaser.js tile-based colony management games
**Overall Confidence:** MEDIUM-HIGH (Phaser patterns well-documented; colony-specific details inferred from patterns)

---

## Recommended Architecture

A **layered architecture** separating rendering (Phaser scene), simulation (world state), and input handling, with a component-based approach for citizen/entity management.

```
┌─────────────────────────────────────────────┐
│         Input Layer                         │
│  (Mouse clicks, keyboard, scene events)    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│         UI Layer                            │
│  (DOM overlay or Phaser UI objects)        │
│  - Building panel, citizen list, resources │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│      Game Scene (Phaser)                    │
│  - Renders tilemap, citizens, buildings    │
│  - Manages camera, zoom, pan                │
│  - Integrates with simulation state         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│    World Simulation (No Phaser deps)        │
│  - Citizens, jobs, needs, productivity      │
│  - Buildings, resource production           │
│  - Pathfinding, AI behavior                 │
│  - Game clock & time progression            │
└─────────────────────────────────────────────┘
```

---

## Major Components

### 1. World State (Simulation Layer)
**Responsibility:**
- Maintains authoritative game state independent of rendering
- Simulates citizens, buildings, resources, time passage
- Decoupled from Phaser (testable, reusable)

**Talks to:**
- Job/Behavior System (for citizen actions)
- Building Manager (for production/consumption)
- Pathfinding Module (for movement)

**Data it owns:**
- Citizens array with properties: id, name, skills, needs (hunger, rest), job assignment, position
- Buildings array with properties: id, type, position, assigned workers, production state
- Resources: wood count, stone count, quantities per resource type
- Game time: current tick, game speed multiplier
- Tile grid state: walkability, occupancy

**Recommended Pattern:**
Use immutable or event-sourced updates. When a citizen state changes, emit an event that the scene subscribes to for re-rendering.

```typescript
// Example structure (not full implementation)
interface Citizen {
  id: string;
  position: { x: number; y: number };
  job: JobType | null;
  skills: Record<string, number>; // lumberjack: 5, miner: 3
  needs: { hunger: number; rest: number }; // 0-100
  productivity: number; // affected by needs
  targetPosition?: { x: number; y: number };
}

interface Building {
  id: string;
  type: 'hut' | 'lumber_camp' | 'mine';
  position: { x: number; y: number };
  assignedWorkers: string[]; // citizen IDs
  productionRate: number; // based on worker skill
}

// World state updates via events, not mutations
world.onCitizenAssigned.subscribe((citizenId, jobType) => {
  // Scene re-renders
});
```

**Why Decoupled:** Allows you to simulate 10 game ticks per frame without rendering, test AI without Phaser, and swap rendering to a different engine later.

---

### 2. Game Scene (Phaser)
**Responsibility:**
- Renders tilemap, game objects, citizens, buildings
- Handles camera/zoom/pan
- Receives world state changes and updates sprites accordingly
- Bridges input to simulation

**Talks to:**
- World State (subscribes to changes)
- Input Handler (receives click/key events)
- UI Layer (sends selection/context info)

**Data it owns:**
- Sprite references (tilemap, citizen sprites, building sprites)
- Camera state (zoom level, pan position)
- Selection state (which building/citizen is selected)
- Particle effects or animations

**Phaser-Specific Patterns:**

**Scene Lifecycle:**
1. `init()` - Receive world state reference
2. `preload()` - Load tilesets, sprites
3. `create()` - Build tilemap, cameras, subscribe to world events
4. `update(time, delta)` - Update sprite positions based on world state (don't modify world here)

```typescript
// Simplified example
class GameScene extends Phaser.Scene {
  private world: WorldState;
  private tilemap: Phaser.Tilemaps.Tilemap;
  private citizenSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  
  init(data) {
    this.world = data.world;
  }
  
  create() {
    // Setup tilemap
    this.tilemap = this.make.tilemap({ key: 'map' });
    this.tilemap.createLayer('ground', tilesets);
    
    // Subscribe to world events
    this.world.onCitizenMoved.subscribe((citizen) => {
      const sprite = this.citizenSprites.get(citizen.id);
      sprite?.setPosition(citizen.position.x, citizen.position.y);
    });
  }
  
  update(time, delta) {
    // Update animations, camera follows selected entity
    // Do NOT modify world state here
  }
}
```

---

### 3. Input Handler
**Responsibility:**
- Converts mouse/keyboard events to game commands
- Validates input against world state (can't assign non-existent citizen)
- Routes commands to appropriate systems

**Talks to:**
- Game Scene (receives pointer/key events)
- World State (reads game state for validation)
- Job Assignment System (sends "assign citizen" commands)
- Building Placement System (sends "place building" commands)

**Data it owns:**
- Input state (mouse position, keys pressed)
- Selection state (selected citizen/building)

**Pattern:**
Separate input mapping from command execution. Input handler translates UI gestures to domain commands.

```typescript
// Input handler - receives click, validates, delegates
class InputHandler {
  onCitizenClicked(citizenId: string) {
    if (this.world.citizens.find(c => c.id === citizenId)) {
      this.selectionManager.selectCitizen(citizenId);
      this.uiLayer.showCitizenPanel(citizenId);
    }
  }
  
  onBuildingClicked(buildingId: string) {
    const building = this.world.buildings.find(b => b.id === buildingId);
    if (building && this.world.canPlaceBuilding(building.position)) {
      this.selectionManager.selectBuilding(buildingId);
      this.uiLayer.showBuildingPanel(buildingId);
    }
  }
}
```

---

### 4. Job & Behavior System
**Responsibility:**
- Manages what citizens do (idle, working, moving to job site)
- Handles state transitions (idle → walking to job → working → returning home)
- Simulates productivity based on skill & needs

**Talks to:**
- World State (reads citizen/building state)
- Pathfinding Module (calculates paths)
- Building Manager (coordinates job/worker interaction)

**Data it owns:**
- Job queue per citizen
- Behavior state machine (idle, walking, working)
- Productivity calculations

**Pattern:**
Each citizen has a **state machine** determining current behavior. Update runs once per game tick (decoupled from Phaser frame rate).

```typescript
type CitizenState = 'idle' | 'walking_to_job' | 'working' | 'walking_home' | 'sleeping';

class CitizenBehavior {
  state: CitizenState = 'idle';
  currentJobId: string | null = null;
  currentTargetPosition: { x: number; y: number } | null = null;
  
  tick(world: WorldState) {
    switch (this.state) {
      case 'idle':
        // Find next job
        const job = world.findAvailableJob(this.citizenId);
        if (job) {
          this.currentJobId = job.id;
          this.state = 'walking_to_job';
        }
        break;
      
      case 'walking_to_job':
        // Move toward job location
        if (this.arrivedAtTarget()) {
          this.state = 'working';
        }
        break;
      
      case 'working':
        // Generate resources
        const productivity = this.calculateProductivity(world);
        world.addResource(this.currentJobId, productivity);
        
        // Check if needs are critical
        if (this.hunger > 90) {
          this.state = 'walking_home';
        }
        break;
      // ... etc
    }
  }
}
```

---

### 5. Building Manager
**Responsibility:**
- Manages building state, production rates
- Coordinates citizens with building slots
- Handles resource production/consumption

**Talks to:**
- World State (reads building/citizen state)
- Job & Behavior System (coordinates assignments)
- Resource System (produces/consumes)

**Data it owns:**
- Buildings with production state (active, paused, idle)
- Building->Citizen mappings
- Resource input/output rates per building type

**Pattern:**
Buildings have a **production tick** that executes when workers are assigned.

```typescript
class Building {
  id: string;
  type: BuildingType;
  assignedWorkers: string[]; // citizen IDs
  
  tick(world: WorldState): void {
    if (this.assignedWorkers.length === 0) return; // No workers
    
    // Calculate production
    let totalProductivity = 0;
    for (const citizenId of this.assignedWorkers) {
      const citizen = world.getCitizen(citizenId);
      const skillLevel = citizen.skills[this.requiredSkill] || 0;
      const productivity = skillLevel * (citizen.productivity / 100);
      totalProductivity += productivity;
    }
    
    // Produce resources
    const output = this.baseProductionRate * totalProductivity;
    world.addResource(this.outputType, output);
  }
}
```

---

### 6. Pathfinding Module
**Responsibility:**
- Calculates movement paths on tilemap
- Independent of rendering, reusable

**Talks to:**
- World State (reads tile occupancy, walkability)
- Job & Behavior System (provides paths for movement)

**Data it owns:**
- None (stateless utility functions)

**Pattern:**
Use breadth-first search or A* for small maps (< 100x100). Libraries like **EasyStar.js** or **Grid Engine** recommended for larger maps.

```typescript
// Stateless pathfinding
function findPath(
  tilemap: TilemapData,
  start: { x: number; y: number },
  goal: { x: number; y: number }
): Array<{ x: number; y: number }> {
  // BFS or A* algorithm
  // Returns array of tile coordinates from start to goal
}

// Used by behavior system
const path = findPath(world.tilemap, citizen.position, jobBuilding.position);
citizen.targetPath = path;
```

**Recommendation:** Start with **EasyStar.js** (lightweight, well-tested, supports tile costs). If performance is needed for 100+ citizens, migrate to **Grid Engine** or **Phaser NavMesh** (navigation meshes instead of grids—faster for large maps).

---

### 7. UI Layer
**Responsibility:**
- Displays resources, citizen list, building controls
- Handles context menus, selections

**Talks to:**
- Game Scene (receives selection events)
- Input Handler (sends commands)
- World State (reads data for display)

**Data it owns:**
- UI state (open panels, selected tabs)
- Cached UI representations

**Pattern:**
Two approaches in Phaser:

**Option A: DOM Overlay (Recommended for this project)**
- Phaser renders only tilemap + game objects
- HTML/CSS handles all UI panels (resources, citizens, jobs)
- Pros: Easier layout, better text rendering, can use React/Vue
- Cons: Must position DOM container to match canvas
- Setup: `dom: { createContainer: true }` in Phaser config

```typescript
// In Phaser config
const config = {
  dom: { createContainer: true },
  // ...
};

// In scene.create()
const uiPanel = this.add.dom(x, y, 'div', 'class: ui-panel', 'HTML content');
```

**Option B: Phaser UI Objects**
- Use Phaser.GameObjects for text, buttons, panels
- Pros: Everything in Phaser, no cross-layer issues
- Cons: Text rendering less crisp, layout more complex
- Good for: Minimalist UI or when modding HTML is not an option

**Recommendation:** Start with DOM overlay. Your game needs readable resource displays and a citizen list—HTML handles this better than Phaser.

---

### 8. Game Clock & Simulation Update Loop
**Responsibility:**
- Advances game time
- Coordinates ticks across all simulation systems
- Decoupled from Phaser frame rate

**Talks to:**
- World State (increments time, triggers ticks)
- Job & Behavior System (runs citizen ticks)
- Building Manager (runs production ticks)
- Citizen Needs System (decays hunger, rest)

**Data it owns:**
- Current game tick
- Game speed (1x, 2x, paused)
- Tick rate (how many sim ticks per Phaser frame)

**Pattern:**
Phaser's update loop calls the simulation clock, which may run multiple ticks depending on game speed.

```typescript
class GameClock {
  currentTick = 0;
  gameSpeed = 1; // 1x = normal, 2x = fast, 0 = paused
  ticksPerSecond = 2; // 2 game ticks per real second
  
  update(deltaSeconds: number) {
    const ticksThisFrame = (deltaSeconds * this.ticksPerSecond * this.gameSpeed);
    for (let i = 0; i < ticksThisFrame; i++) {
      this.tick();
    }
  }
  
  tick() {
    // 1. Update citizen needs
    for (const citizen of this.world.citizens) {
      citizen.hunger += 1; // increases over time
      citizen.rest -= 1; // decreases while working
    }
    
    // 2. Run behavior system
    for (const citizen of this.world.citizens) {
      this.behaviorSystem.tick(citizen);
    }
    
    // 3. Run building production
    for (const building of this.world.buildings) {
      building.tick(this.world);
    }
    
    this.currentTick++;
  }
}
```

**Why Decoupled:** If your game runs at 60 FPS but you want 2 game ticks per second, the simulation can run 2 ticks per frame (or skip frames if paused). This keeps simulation consistent regardless of frame rate.

---

## Data Flow

```
Phaser Frame (60 FPS)
│
├─ Input Events (pointer, keyboard)
│  └─ InputHandler.onMouseClick()
│     └─ World.assignCitizen(citizenId, jobId)
│        └─ Emit: onCitizenAssigned event
│           └─ GameScene subscribes, updates UI panel
│
├─ GameClock.update(deltaTime)
│  └─ Tick simulation N times
│     ├─ CitizenNeeds.update() → emit onCitizenHungry
│     ├─ CitizenBehavior.tick() → emit onCitizenMoved
│     └─ Building.tick() → emit onResourceProduced
│        └─ World.addResource()
│           └─ Emit: onResourceChanged event
│              └─ UILayer updates resource display
│
└─ GameScene.update(time, delta)
   ├─ Sprite position updates (from onCitizenMoved)
   ├─ Camera follows selected entity
   └─ Particle effects for production
```

**Key Principle:** World state → Events → UI/Scene updates (one-way flow, no circular dependencies).

---

## Suggested Build Order

### Phase 1: Foundation (Core Systems)
1. **World State + Game Clock**
   - Citizen and Building data structures
   - Basic tick loop (even if nothing happens yet)
   - Event system for state changes
   - *Why first:* Everything depends on this

2. **Pathfinding Module**
   - Implement BFS on a simple grid
   - Test with console output before Phaser integration
   - *Why second:* Citizens can't move without this

3. **Job & Behavior System**
   - State machine for citizen actions
   - Walking, idle, working states
   - *Why third:* Depends on pathfinding, required for gameplay

### Phase 2: Rendering & Integration
4. **Game Scene (Phaser)**
   - Tilemap rendering
   - Sprite creation for citizens, buildings
   - Camera/zoom controls
   - Input event plumbing
   - *Why after logic:* Scene integrates with working systems

5. **Input Handler**
   - Click detection on game objects
   - Command routing
   - *Why with scene:* Needs sprite references

6. **Building Manager & Production**
   - Building placement validation
   - Worker assignment
   - Resource generation
   - *Why after scene:* Builds on citizen/building data

### Phase 3: Polish & Feedback
7. **UI Layer (DOM or Phaser)**
   - Resource display
   - Citizen list + selection
   - Building assignment panel
   - *Why last:* Displays system state, no game logic

8. **Citizen Needs System**
   - Hunger, rest decay
   - Productivity impact
   - *Why near end:* Polish on behavior system

9. **Visual Feedback**
   - Particle effects for production
   - Animations for movement
   - Status indicators (hunger, happiness)
   - *Why last:* Pure polish

---

## Phaser.js-Specific Patterns

### 1. Scene Lifecycle in Colony Game

```typescript
export class GameScene extends Phaser.Scene {
  private world: WorldState;
  private gameClock: GameClock;
  private tilemap: Phaser.Tilemaps.Tilemap;
  private citizenSprites: Map<string, Phaser.Physics.Arcade.Sprite>;
  private buildingSprites: Map<string, Phaser.Physics.Arcade.Sprite>;

  constructor() {
    super('game');
  }

  // 1. init() - Receive external data
  init(data: { world: WorldState }) {
    this.world = data.world;
    this.gameClock = new GameClock(this.world);
  }

  // 2. preload() - Load assets
  preload() {
    this.load.image('tileset', 'assets/tileset.png');
    this.load.spritesheet('citizen', 'assets/citizen.png', { frameWidth: 32, frameHeight: 32 });
  }

  // 3. create() - Set up game objects and subscriptions
  create() {
    // Setup tilemap
    const data = new Array(10).fill(0).map(() => new Array(10).fill(0));
    this.tilemap = this.make.tilemap({ data, tileWidth: 32, tileHeight: 32 });
    const tileset = this.tilemap.addTilesetImage('tileset');
    this.tilemap.createLayer('ground', tileset);

    // Create citizen sprites
    this.citizenSprites = new Map();
    for (const citizen of this.world.citizens) {
      const sprite = this.add.sprite(citizen.position.x, citizen.position.y, 'citizen');
      this.citizenSprites.set(citizen.id, sprite);
    }

    // Subscribe to world events
    this.world.onCitizenMoved.subscribe((citizen) => {
      const sprite = this.citizenSprites.get(citizen.id);
      if (sprite) {
        this.tweens.add({
          targets: sprite,
          x: citizen.position.x,
          y: citizen.position.y,
          duration: 500, // interpolate over 500ms
        });
      }
    });

    this.world.onResourceChanged.subscribe((resourceType, amount) => {
      // Update UI layer
      document.getElementById('wood-count').textContent = this.world.resources.wood;
    });
  }

  // 4. update() - Per-frame updates
  update(time: number, delta: number) {
    // Advance simulation
    this.gameClock.update(delta / 1000);

    // Update camera (follow selected citizen)
    const selectedCitizen = this.world.citizens.find(c => c.selected);
    if (selectedCitizen) {
      this.cameras.main.centerOn(selectedCitizen.position.x, selectedCitizen.position.y);
    }
  }
}
```

### 2. Multiple Scenes Pattern (Game + UI)

If you want to keep Game Scene and UI Scene separate:

```typescript
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  dom: { createContainer: true },
  scene: [GameScene, UIScene, // Both run simultaneously
];

game = new Phaser.Game(config);

// In game.scene.start():
game.scene.start('game', { world });
game.scene.start('ui', { world });
```

**Pros:** UI updates don't block game loop; cleaner separation
**Cons:** Must coordinate events between scenes

### 3. Input Handling with Phaser

```typescript
// In GameScene.create():
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  // Convert screen coords to world coords
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  
  // Check what was clicked
  const clickedSprite = this.physics.overlapping(
    worldPoint,
    this.citizenSprites.getChildren()
  );
  
  if (clickedSprite) {
    const citizenId = /* find citizen by sprite */;
    this.inputHandler.onCitizenClicked(citizenId);
  }
});
```

### 4. Handling Frame-Rate Independence

```typescript
// GameClock keeps simulation consistent
class GameClock {
  update(deltaSeconds: number) {
    // If game is running at 2 ticks/sec and 60 FPS,
    // this runs ~2/60 = 0.033 ticks per frame
    // After 30 frames, 1 full tick has occurred
    this.accumulatedTime += deltaSeconds;
    
    while (this.accumulatedTime >= (1 / this.ticksPerSecond) * this.gameSpeed) {
      this.tick();
      this.accumulatedTime -= (1 / this.ticksPerSecond) * this.gameSpeed;
    }
  }
}
```

### 5. Tilemap & Layer Management

```typescript
// In create():
const tileset = this.tilemap.addTilesetImage('tileset-name', 'tileset-key');

// Multiple layers
const groundLayer = this.tilemap.createLayer('ground', tileset);
const objectLayer = this.tilemap.createLayer('objects', tileset);

// Setting tile properties (walkability)
for (let x = 0; x < this.tilemap.width; x++) {
  for (let y = 0; y < this.tilemap.height; y++) {
    const tile = this.tilemap.getTileAt(x, y);
    if (tile && tile.index === WATER_TILE) {
      tile.collides = true; // Mark as unwalkable
    }
  }
}

// Pathfinding uses these properties
function isWalkable(tilemap, x, y) {
  const tile = tilemap.getTileAt(x, y);
  return tile && !tile.collides;
}
```

---

## Anti-Patterns to Avoid

### 1. Tight Coupling: World State in Scene
**Bad:**
```typescript
// Putting game logic in scene
class GameScene {
  citizens = [];
  update() {
    for (const citizen of this.citizens) {
      citizen.hunger++;
      if (citizen.hunger > 100) {
        citizen.productivity = 0;
      }
    }
  }
}
```

**Why it breaks:** Can't test without Phaser; can't run multiple ticks per frame; logic scattered.

**Better:**
```typescript
// Separate world state and scene
world.onCitizenTick((citizen) => {
  citizen.hunger++;
  if (citizen.hunger > 100) {
    citizen.productivity = 0;
  }
});

// Scene just renders
gameScene.world.onCitizenChanged.subscribe((citizen) => {
  const sprite = sprites.get(citizen.id);
  sprite.setPosition(citizen.position.x, citizen.position.y);
});
```

### 2. Direct Sprite Manipulation for Logic
**Bad:**
```typescript
// Moving sprites directly in scene
const sprite = this.citizenSprites.get(citizenId);
sprite.setVelocity(100, 0); // Logic is in rendering layer
```

**Better:**
```typescript
// Simulation layer decides movement
citizen.targetPosition = { x: 100, y: 50 };

// Scene only reads and displays
const sprite = this.citizenSprites.get(citizen.id);
sprite.setPosition(citizen.position.x, citizen.position.y);
```

### 3. Synchronous Pathfinding Every Frame
**Bad:**
```typescript
update(time, delta) {
  // Recalculating paths every frame kills performance
  const path = findPath(citizen.position, job.position);
}
```

**Better:**
```typescript
// Calculate path once when job is assigned
citizen.targetPath = findPath(citizen.position, job.position);

// Update just moves along the path
update(time, delta) {
  if (citizen.targetPath.length > 0) {
    const nextTile = citizen.targetPath[0];
    citizen.position = nextTile;
    citizen.targetPath.shift();
  }
}
```

### 4. UI Updates Every Frame
**Bad:**
```typescript
update(time, delta) {
  // Querying DOM every frame
  document.getElementById('wood-count').textContent = this.world.resources.wood;
}
```

**Better:**
```typescript
// Update only when resource changes
world.onResourceChanged.subscribe((type, amount) => {
  document.getElementById(`${type}-count`).textContent = amount;
});
```

---

## Build Order Dependencies

```
GameClock (independent)
   ↓
WorldState + Citizen/Building models (independent)
   ↓
JobBehaviorSystem (depends on pathfinding)
   ↓
PathfindingModule (no dependencies)
   ↓
GameScene (depends on World + GameClock)
   ↓
InputHandler (depends on Scene + World)
   ↓
BuildingManager (depends on World + Behavior)
   ↓
UILayer (depends on Scene + World)
   ↓
NeedSystem (polish, depends on Behavior)
   ↓
VisualEffects (polish, depends on Scene)
```

---

## Scalability Considerations

### At 10 Citizens (v1 POC Target)
- **Pathfinding:** BFS with full recalculation per job = negligible cost
- **Ticks:** 2 ticks/sec across 10 citizens = ~20 operations/sec
- **Rendering:** 10 sprites + tilemap = simple
- **Recommendation:** Simple data structures, no optimization needed yet

### At 50-100 Citizens (Post-v1)
- **Pathfinding:** EasyStar with caching; only recalculate on tile changes
- **Ticks:** Consider spatial hashing (grid of job zones) to avoid checking all jobs per citizen
- **Rendering:** Use object pooling for particles; cull off-screen sprites
- **Recommendation:** Implement object pooling, consider ECS if behavior complexity grows

### At 1000+ Citizens (Multi-phase)
- **Pathfinding:** Navigation meshes (NavMesh) instead of grid pathfinding
- **Ticks:** Run behavior logic less frequently for distant citizens (LOD)
- **Rendering:** Chunk rendering, camera culling, sprite batching
- **Recommendation:** Consider ECS architecture (bitECS), worker threads for pathfinding

---

## Technology Recommendations

| Component | Technology | Rationale | Confidence |
|-----------|-----------|-----------|-----------|
| Rendering | Phaser 3 (with Canvas/WebGL) | Battle-tested, built-in tilemap/scene/input | HIGH |
| Simulation | Plain TypeScript classes | Decoupled from Phaser, testable, flexible | HIGH |
| Pathfinding | EasyStar.js (v0.4.8+) | Lightweight A*, well-tested, supports tile costs | MEDIUM-HIGH |
| State Management | Events (native EventEmitter or custom pub/sub) | Simple, decouples layers, TypeScript-friendly | MEDIUM |
| UI Layer | HTML/CSS + DOM Element Phaser API | Readable text, easier layout than Phaser UI objects | MEDIUM |
| Entity Management | Custom classes (v1) → ECS (v2+) | Start simple, migrate if complexity grows | MEDIUM |

---

## Sources

- [Phaser Official Documentation - Tilemap API](https://docs.phaser.io/api-documentation/class/tilemaps-tilemap)
- [Phaser Official Documentation - DOM Elements](https://docs.phaser.io/phaser/concepts/gameobjects/dom-element)
- [Modular Game Worlds in Phaser 3 (Tilemaps) - Michael Hadley](https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6)
- [Point & Click Movement with Pathfinding in Phaser 3](https://blog.ourcade.co/posts/2020/phaser-3-point-click-pathfinding-movement-tilemap/)
- [A to Z guide to pathfinding with EasyStar and Phaser 3 - Dynetis Games](https://www.dynetisgames.com/2018/03/06/pathfinding-easystar-phaser-3/)
- [Entity Component System in TypeScript with Phaser 3 and bitECS](https://www.youtube.com/watch?v=BVIiAO5-2-Y)
- [Building a Phaser 3 Game with ECS and React - Chukwuyenum Opone](https://officialyenum.medium.com/building-a-phaser-3-game-with-ecs-and-react-c4d39d72f02f)
- [Phaser Scene Management Tutorial - Generalist Programmer](https://generalistprogrammer.com/tutorials/phaser-scene-management-tutorial/)
- [Grid Engine Documentation](https://annoraaq.github.io/grid-engine/)
- [Tile-Based Game Architecture - GamyGuru](https://gamyguru.wordpress.com/2012/07/29/inside-the-game-tile-based-game-architecture/)
- [NPC Job System Architecture - One Wheel Studio](https://onewheelstudio.com/blog/2017/9/30/job-system)
- [Enjoyable Game Architecture - Chickensoft Games](https://chickensoft.games/blog/game-architecture)
