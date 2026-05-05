# Requirements: Civilization Game

**Defined:** 2026-05-05
**Core Value:** Citizens that react meaningfully to player decisions — neglect them and they slow down or leave, care for them and the colony thrives.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### World

- [ ] **WORLD-01**: Tile-based grid world renders in the browser using Phaser.js canvas/WebGL

### Citizens

- [ ] **CTZN-01**: Citizens exist as named entities with an assigned job

### Task System

- [ ] **TASK-01**: Four base task types exist: Gather, Carry, Mine, Cut
- [ ] **TASK-02**: Jobs are defined as named sets of task priorities (numeric weight per task type)
- [ ] **TASK-03**: A Lumberjack job has default priorities: Cut:7, Carry:5, Mine:2, Gather:0 (tasks with weight 0 are never performed)
- [ ] **TASK-04**: A Miner job has default priorities: Mine:7, Carry:5, Cut:2, Gather:0
- [ ] **TASK-05**: Citizens autonomously select their next task based on job priorities and current world needs (e.g., if wood is low, Cut-priority tasks score higher)
- [ ] **TASK-06**: Citizens execute one task at a time; on completion, they re-evaluate and pick the next highest-priority available task

### Buildings

- [ ] **BUILD-01**: Lumber camp building exists on the tile grid and is a valid worksite for Cut tasks
- [ ] **BUILD-02**: Mine building exists on the tile grid and is a valid worksite for Mine tasks
- [ ] **BUILD-03**: Hut (basic housing) exists on the tile grid and can house citizens

### Resources

- [ ] **RSRC-01**: Wood is tracked as a global resource pool visible to the player
- [ ] **RSRC-02**: Stone is tracked as a global resource pool visible to the player
- [ ] **RSRC-03**: A citizen performing a Cut task at a lumber camp generates wood over time
- [ ] **RSRC-04**: A citizen performing a Mine task at a mine generates stone over time
- [ ] **RSRC-05**: A citizen performing a Carry task moves a resource from a production site to a storage location

### UI

- [ ] **UI-01**: Player can click a citizen to open a selection panel showing their name, current job, and current task
- [ ] **UI-02**: Player can assign or change a citizen's job from the selection panel
- [ ] **UI-03**: Resource totals (wood and stone) are displayed on-screen at all times

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Citizens

- **CTZN-02**: Citizens have needs (hunger, rest, shelter) that decay over time
- **CTZN-03**: Mild neglect of needs reduces citizen productivity
- **CTZN-04**: Severe neglect causes citizens to leave the colony

### World

- **WORLD-02**: Camera pan and zoom to navigate the world
- **WORLD-03**: Procedurally generated map with terrain and resource deposits

### Buildings

- **BUILD-04**: Player can place new buildings on the tile grid using resources
- **BUILD-05**: Upgraded housing tier (one step above hut) with morale bonus

### Jobs

- **JOB-01**: Player can create custom job definitions with configurable task priorities
- **JOB-02**: More job types (Farmer, Builder, Guard)

### Systems

- **SYS-01**: Save and load game state
- **SYS-02**: Day/night cycle affecting productivity

## Out of Scope

| Feature | Reason |
|---------|--------|
| Enemies and combat | Not in v1 — pure management focus |
| Win/lose conditions | Sandbox only — player defines success |
| Multiplayer | Single-player validation first |
| Mobile/touch controls | Browser desktop only |
| More than 2 resource types | Keep loop simple for POC |
| Pathfinding animation | Citizens can teleport to worksites for v1 POC |
| Procedural generation | Fixed map simplifies v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WORLD-01 | Phase 1 | Pending |
| CTZN-01 | Phase 2 | Pending |
| TASK-01 | Phase 3 | Pending |
| TASK-02 | Phase 3 | Pending |
| TASK-03 | Phase 3 | Pending |
| TASK-04 | Phase 3 | Pending |
| TASK-05 | Phase 3 | Pending |
| TASK-06 | Phase 3 | Pending |
| BUILD-01 | Phase 2 | Pending |
| BUILD-02 | Phase 2 | Pending |
| BUILD-03 | Phase 2 | Pending |
| RSRC-01 | Phase 4 | Pending |
| RSRC-02 | Phase 4 | Pending |
| RSRC-03 | Phase 4 | Pending |
| RSRC-04 | Phase 4 | Pending |
| RSRC-05 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initial definition*
