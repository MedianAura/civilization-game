# Civilization Game

## What This Is

A browser-based 2D top-down colony management sandbox game built with TypeScript and Phaser.js. Players oversee a small settlement of citizens who have individual skills and needs, assigning them to jobs like lumberjacking and mining, housing them in tiered dwellings, and keeping them productive enough to survive. Inspired by Rimworld and Bellwright, the v1 proof-of-concept targets ~10 settlers and one complete resource loop (wood and stone), with enough feel to validate the core management experience.

## Core Value

Citizens that react meaningfully to player decisions — neglect them and they slow down or leave, care for them and the colony thrives.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Citizens with named skills (lumberjack, miner) that affect resource yield
- [ ] Citizens have needs; mild neglect causes productivity loss, severe neglect causes them to leave
- [ ] Player can assign citizens to jobs (one job per citizen)
- [ ] Tiered housing system (hut as base tier, with at least one upgrade path)
- [ ] Lumber camp building that generates wood when a lumberjack is assigned
- [ ] Mine building that generates stone when a miner is assigned
- [ ] Wood and stone resource tracking visible to the player
- [ ] Tile-based grid world rendered in the browser using Phaser.js
- [ ] ~10 settlers manageable in sandbox (no win condition, no enemies)

### Out of Scope

- Enemies and combat — no enemies in v1, pure management focus
- Win condition or failure state — sandbox only
- More than two resource types (wood, stone) — keep loop simple for POC
- Multiplayer — single-player only
- Mobile/touch controls — browser desktop target only
- Save/load persistence — session-only for v1

## Context

- Inspired by Rimworld and Bellwright; target feel is "readable colony state at a glance"
- Art sourced from free/open asset packs (Kenney.nl, OpenGameArt)
- v1 is explicitly a proof-of-concept: smallest thing that produces the management feeling
- TypeScript chosen for type safety across complex game state; Phaser.js for battle-tested browser 2D rendering
- No existing codebase — greenfield start
- Tile-based grid world is a hard constraint (drives building placement, pathfinding, and rendering)

## Constraints

- **Tech Stack**: TypeScript + Phaser.js — browser canvas/WebGL only
- **Art Assets**: Free/open only (Kenney.nl, OpenGameArt)
- **Scope**: v1 is a POC with ~10 settlers and one resource loop
- **Platform**: Browser desktop only
- **Tile Grid**: All world layout must be tile-based

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phaser.js over raw canvas or PixiJS | Battle-tested for 2D browser games, built-in scene/tilemap/input management | — Pending |
| Tile-based grid world | Simplifies building placement, pathfinding, and rendering | — Pending |
| TypeScript from day one | Complex game state benefits from type safety | — Pending |
| No enemies in v1 | Keeps scope tight; management loop is valuable without combat | — Pending |
| Free assets only | Removes art bottleneck; Kenney.nl has quality tilesets for this genre | — Pending |

---
*Last updated: 2026-05-05 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
