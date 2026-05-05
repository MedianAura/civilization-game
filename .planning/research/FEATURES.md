# Features Research: Civilization Game (Colony Management v1)

**Domain:** Browser-based 2D colony/settlement management sandbox  
**Researched:** 2026-05-05  
**Scope:** Minimum viable product with ~10 settlers, one resource loop (wood/stone)

---

## Table Stakes

Features players expect from a colony management game. Missing these = product feels incomplete or unresponsive.

### Citizen/Settler Management
- **Individual citizen entities with visible state** — Each settler is a discrete unit with name, skills, and status visible on screen. Players must be able to identify and track them. | Complexity: Low
- **Job assignment system** — Players assign settlers to jobs (lumberjack, miner) and see them execute assigned work. Jobs drive resource production. | Complexity: Low
- **Skill-based resource generation** — A lumberjack generates more wood than an unskilled settler at the same lumber camp. Skills directly impact productivity. | Complexity: Low
- **Settler needs/morale system** — Basic hunger, rest, and shelter tracking. Neglected needs reduce productivity (soft penalty) or cause settlers to leave (hard reset). This creates meaningful player decisions. | Complexity: Medium
- **Housing system with progression** — At least two tiers (basic hut → upgraded dwelling). Housing quality/availability affects settler morale. | Complexity: Low

### Resource Management
- **Visible resource tracking** — Wood and stone counts displayed on-screen in a non-intrusive location. Players see income/consumption rates. | Complexity: Low
- **Resource generation from buildings** — Lumber camp + lumberjack → wood per game tick. Mine + miner → stone per game tick. Clear feedback loop. | Complexity: Low
- **Storage/inventory system** — Resources accumulate and are accessible for building/crafting. No artificial scarcity gating. | Complexity: Low

### Building & Construction
- **Tile-based placement system** — Buildings placed on a grid. Settlers interact with buildings on adjacent tiles or enter them. | Complexity: Medium
- **Construction queue** — Player can queue buildings, settlers execute construction work when assigned. Visual feedback (building progress indicator). | Complexity: Medium
- **Building types by function** — Lumber camp (wood), mine (stone), housing (shelter), research station (tech unlock). Each type has distinct visual appearance. | Complexity: Low

### UI & Information Architecture
- **Readable colony state at a glance** — Citizens visible on map with status (job, mood indicator). Resources displayed clearly. Active buildings show activity. No hidden states that surprise the player. | Complexity: Medium
- **Clickable entity details** — Click a settler to see job, skills, needs, morale. Click a building to see production rate, assigned workers. No walls between player and game state. | Complexity: Low
- **Pause and inspect** — Ability to pause game and review state without time pressure. Essential for learning and planning. | Complexity: Low

### Game Loop & Feedback
- **Time progression** — Game runs at a controllable speed (play/pause, fast-forward). Clear game tick or day counter visible. | Complexity: Low
- **Observable cause-and-effect** — When a settler's need drops, they slow down visibly (animation, icon, status). When food runs out, settlers get hungry. Immediate, clear feedback. | Complexity: Medium

---

## Differentiators

Features that create the "one more turn" feeling and distinguish this game from a generic resource manager.

### Emergent Settler Personality
- **Settler personality traits or preferences** — Beyond just skills, settlers have quirks (e.g., "prefers to work alone," "lazy," "a natural leader"). Traits affect how they respond to colony conditions and interact with jobs/morale. This is where emergent stories come from. | Complexity: High
- **Mood-driven behavior changes** — A happy settler works faster; an unhappy one makes mistakes or sabotages work. Visible animation/status changes create narrative tension. | Complexity: High
- **Settler relationships or social simulation** — (Optional for v1, but differentiating if included) Settlers form friendships, conflicts, or hierarchies that affect colony stability and productivity. Adds emergent drama. | Complexity: High

### Moment-to-Moment Tension
- **Visible resource scarcity** — Players can see when wood is running low and must respond. No artificial resource caps; real consequences for poor planning. | Complexity: Low
- **Settler departure as failure state** — If morale is ignored for too long, settlers leave. This is a permanent loss that forces player engagement. | Complexity: Low
- **Dynamic weather/seasons** — (Optional for v1) Seasonal resource availability changes (wood plentiful in summer, scarce in winter) or weather affects morale. Adds rhythm to gameplay. | Complexity: High

### Sandbox Progression
- **Upgrade paths within constraints** — Better housing tiers, more efficient buildings, additional job types become available as colony stabilizes. Progression feels organic, not gated by artificial timers. | Complexity: Medium
- **Visual evolution of colony** — As players build and settle more, the map fills with structures, paths, and citizen activity. Visible growth creates satisfaction. | Complexity: Low

---

## Anti-Features

Features that look tempting but should be explicitly deferred from v1. Including them would bloat scope without validating core loop.

### Combat & Defense
**Why avoid:** Combat introduces a second gameplay system (tactics, enemy waves, defensive positioning) that pulls focus from colony management. v1 needs to prove the management loop works. Combat adds ~40% more code without validating whether players engage with the core experience. Enemies also require AI pathfinding, balance tuning, and loss conditions that complicate the POC.

**What to do instead:** Keep the sandbox pure. If enemies become essential later, add them as a post-v1 feature that interacts with existing systems.

### Win Conditions or Long-Term Goals
**Why avoid:** Sandbox mode (no "you won") is simpler and lets players define their own success. Adding victory conditions (reach 50 settlers, produce 1000 stone) creates external pressure that competes with the management feeling. Players play colony sims for the "one more turn" loop, not to hit a number.

**What to do instead:** Let players experiment indefinitely. Track high scores or milestones if desired, but don't gate content behind them.

### Persistent Save/Load System
**Why avoid:** Session-only play simplifies state management and testing. Building a robust save system requires serializing all game state (settler variables, building state, resources, queue, etc.), debugging deserialization bugs, and version compatibility. This is 10+ hours of non-gameplay work.

**What to do instead:** Validate the loop with session-only play. Save/load becomes a post-v1 quality-of-life feature once core systems are proven.

### Complex Supply Chains or Logistics Networks
**Why avoid:** Multiple resource types and elaborate supply chains (e.g., lumber → planks → furniture → trade) add cognitive load without validating the core feeling. Banished and Bellwright have logistics; Rimworld (v1 inspiration) is simpler with just wood/stone early on.

**What to do instead:** Stick to two resources generated directly from jobs. No intermediate crafting chains for v1. A settler with a skill generates a resource; done.

### Multiplayer or Co-op
**Why avoid:** Multiplayer requires network state sync, turn coordination, or concurrent editing. Single-player significantly simplifies state ownership and testing. Co-op can be added post-launch if demand exists.

**What to do instead:** Ship single-player first. Validate that the core management experience is fun solo before adding multiplayer complexity.

### Procedural Generation or Infinite Maps
**Why avoid:** Procedural generation (terrain, building layouts, settler names) is nice-to-have polish but adds complexity. A fixed, hand-authored small map is enough to test whether the management loop works. Infinite maps also raise performance questions (rendering, pathfinding, state updates).

**What to do instead:** Use a small, fixed 20x20 or 30x30 tile map. Hand-author starting layout. Settlers and buildings are procedurally varied, but the world is static.

### Advanced Pathfinding or NPC Movement AI
**Why avoid:** Settlers wandering dynamically around the map adds visual life but requires pathfinding (A*, flow fields, etc.), animation states, and collision handling. The core loop doesn't depend on settlers physically moving; job execution and resource updates are what matter for v1.

**What to do instead:** Settlers can "teleport" to job sites or buildings when assigned. Hide movement behind animations (fade in/out) if desired. Real pathfinding and wandering is post-v1 polish.

### Trading or External Economy
**Why avoid:** Trading systems introduce NPCs, market prices, currency exchange logic, and caravan mechanics. These systems are depth layers in mature colony sims but distract from validating whether the internal resource loop (production → storage → use) is engaging.

**What to do instead:** Focus on internal resource production. Players generate what they need. External trade becomes a v2 feature for economic depth.

### Multiple Building Types or Recipes
**Why avoid:** More building types (blacksmith, farm, storage depot, research lab, barracks, shrine) means more UI, more job types, more balance work, and more art assets. The proof-of-concept only needs lumber camp and mine to validate the loop.

**What to do instead:** Three to five essential building types maximum. Lumber camp, mine, housing (hut + upgrade), and storage. Any additions come after v1 validation.

### Detailed Graphics or Animation
**Why avoid:** Polishing art (idle animations for settlers, building construction animations, particle effects) is satisfying but doesn't validate gameplay. Kenney.nl assets are simple and good enough. Chasing visual fidelity delays the loop.

**What to do instead:** Use simple, readable art. Animate state changes (happy → sad morale icons, building progress bars) not idle motion. Visual polish comes after core systems are locked.

---

## Feature Dependencies

Understanding the order in which features must be built (not the same as which phases they ship in).

```
CORE FOUNDATION (required first):
  Tile Grid World → Phaser Scene & Rendering
  ↓
Settler Entities → Citizen Spawn & Data Model
  ↓
Job Assignment System → Link settlers to jobs
  ↓
Resource Tracking → Display resources on-screen
  ↓
Building System → Tile-based placement
  ↓
Job Execution → Generate resources when jobs are assigned to buildings
  ↓
Settler Needs & Morale → Track hunger/rest, reduce productivity or cause departure
  ↓
Housing Progression → Tier 1 & 2 dwellings affect morale
  ↓
---
DIFFERENTIATORS (build after core loop validates):
  ↓
Settler Personalities → Traits affect job execution, morale responses
  ↓
Dynamic Morale Behaviors → Personality + needs drive visible state changes
  ↓
Resource Scarcity Moments → Low-resource warnings, player intervention required
  ↓
Upgrade Paths / Progression → Better buildings, new jobs become available
```

**Critical path to playable loop:**
1. Tile grid + settler spawn
2. Job assignment + building placement
3. Resource generation from jobs
4. Morale system (needs satisfaction directly affects productivity)
5. Settler departure if morale is ignored

**Playable at:** Step 5. If settlers are managing morale correctly, the colony thrives. If ignored, settlers leave. This validates the core loop.

---

## MVP Recommendation

**Ship with table stakes + minimal differentiator:**

### Table Stakes Required
1. Tile-based grid world with 5-10 visible settlers
2. Job assignment (lumberjack, miner)
3. Lumber camp and mine buildings
4. Wood and stone resource tracking
5. Basic housing tier (hut)
6. Settler morale/needs (hunger, rest, shelter)
7. Settler departure when morale critical
8. Clickable UI panels to inspect settler skills/morale and building production
9. Play/pause and speed controls

### One Differentiator (Optional for MVP, Recommended for POC Validation)
- **Settler personality traits** that visibly affect morale response. Example: A "melancholic" settler loses morale faster when isolated, while a "social butterfly" gains morale from working near others. This differentiator is what creates emergent colony narratives and validates whether the game has "one more turn" appeal.

OR (if time-constrained)

- **Housing upgrade progression** that significantly impacts morale, creating visible reward for player effort. Settlers in basic huts have lower morale; upgrading housing produces immediate, visible morale boost.

### Defer
- Combat, trading, save/load, multiple resource chains, advanced pathfinding, complex graphics, procedural generation, multiplayer, seasons

**Rationale:** v1 with table stakes + one differentiator is ~6-8 weeks of development (TypeScript + Phaser). This validates whether the core management loop (assign → produce → satisfy → thrive) creates the engagement players expect. Differentiators prove it's a game, not a simulator. Everything else is post-launch expansion.

---

## Complexity Breakdown

| Feature | Complexity | Why | Est. Hours |
|---------|-----------|-----|-----------|
| Tile grid rendering | Low | Phaser has built-in tilemap support | 4-6 |
| Settler spawn & data model | Low | Simple TypeScript class, array management | 6-8 |
| Job assignment UI | Low | Click building, select settler, link them | 4-6 |
| Resource tracking | Low | Two counters (wood, stone), display | 2-3 |
| Building placement | Medium | Collision detection, grid snapping, visual feedback | 8-10 |
| Job execution system | Medium | Timer-based resource generation, skill modifiers, animation | 10-12 |
| Morale/needs system | Medium | Track hunger/rest over time, calculate morale from needs, trigger behavior | 12-14 |
| Housing progression | Low | Two building types, different morale modifiers | 4-6 |
| Settler personality traits | High | Define traits, integrate into morale calculations, create visible behavior differences | 14-18 |
| UI readability (panels, icons) | Medium | Click entities, display data, update on state change | 10-12 |
| Dynamic pathfinding | High | A* or flow field implementation, settler movement | 20-25 |
| Trading system | High | NPC spawning, transaction logic, economy simulation | 25-30 |

---

## Sources

- [RimWorld Core Gameplay Guide](https://gamepadsquire.com/blog/rimworld/RimWorld-A-Core-Gameplay-Guide/)
- [RimWorld Wikipedia](https://en.wikipedia.org/wiki/RimWorld)
- [Bellwright Steam Page](https://store.steampowered.com/app/1812450/Bellwright/)
- [Bellwright Dev Interview (GDC 2026)](https://butwhytho.net/2026/03/bellwright-interview-gdc-early-access/)
- [Dwarf Fortress Wikipedia](https://en.wikipedia.org/wiki/Dwarf_Fortress)
- [Dwarf Fortress Wiki](https://dwarffortresswiki.org/index.php/Dwarf_Fortress)
- [Banished Steam Page](https://store.steampowered.com/app/242920/Banished/)
- [Banished Resource Management Strategies](https://unlocktheanimus.com/banished-community-survival-strategies-and-resource-management-challenges/)
- [15 Best Colony Building Sims (G2A News)](https://www.g2a.com/news/features/best-colony-games/)
- [Designing Friendly Robot Settlement Sim (Game Developer Magazine)](https://www.gamedeveloper.com/design/designing-friendly-robot-settlement-sim-i-the-colonists-i-to-be-deep-yet-inviting/)
- [Oxygen Not Included Beginner's Guide](https://screenrant.com/oxygen-not-included-beginners-guide-tips-tricks-strategies/)
- [Oxygen Not Included Wiki: Getting Started](https://oxygennotincluded.wiki.gg/wiki/Guide/Getting_Started)
- [RimWorld vs Dwarf Fortress Comparison](https://gamepressure.com/newsroom/dwarf-fortress-vs-rimworld-detailed-comparison/z04ddd)
- [How Dwarf Fortress and RimWorld Tell Different Stories](https://www.gamedeveloper.com/design/dwarf-fortress-and-rimworld-tell-very-different-stories)
- [Letting Players Tell The Story: Simulation Games As Narrative Machines](https://gameinformer.com/b/features/archive/2016/11/25/letting-players-tell-the-story-simulation-games-as-narrative-machines.aspx)
- [10 Best Colony Sim Games (TheGamer)](https://www.thegamer.com/10-best-colony-sim-games/)
- [Best Colony Sim Games for Long-Term Play (GameFoundry)](https://gamefoundry.games/blog/best-colony-sim-games-long-term/)
