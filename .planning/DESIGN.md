# Design — decisions taken in conversation

Not a plan. Just the calls that were made out loud and would otherwise live only
in a chat log. Newest section at the bottom; nothing here is a commitment to a
schedule.

---

## 2026-08-04 — The player declares intent, not tasks

**Decided:** the player never clicks an individual tree to have it chopped.

Two layers, in this order:

1. **Zones.** The player designates an area for an activity ("gather wood here").
   Every citizen who can do that job goes.
2. **Buildings as anchors.** Later: the player builds a Lumber Mill. A citizen
   assigned to the Lumberjack job works trees within roughly 15–20 cells of it.

**Why:** this is the colony-sim vocabulary (Rimworld's zones, Bellwright's
building-anchored work) rather than the RTS one. The player states a standing
intent and the colony resolves it; clicking forty trees is not gameplay.

**Consequences, named so they aren't rediscovered:**

- **It removes the "obey or eat" conflict.** That framing assumed a one-off
  order, so ignoring it read as disobedience. Under a standing job assignment, a
  lumberjack who stops to eat is prioritising, not refusing. Less dramatic and
  more honest.
- **It raises the cost of not having a pathfinder.** When the player picks the
  target, they pick one they can see is reachable. When the *simulation* picks a
  tree inside a radius, it will regularly pick one behind a rock. Greedy movement
  fails often under this design, rarely under the other one.
- **Open question, not yet decided:** is the 15–20 cell radius a rule or a
  consequence? Rimworld has no radius — a colonist will walk across the map, and
  the sheer travel time makes it a bad idea on its own. A hard radius makes it
  impossible instead, which is easier to implement and harder to explain to a
  player who can see the tree being refused.

## 2026-08-04 — Citizens are immortal for now

**Decided:** no ageing, no hunger, thirst, hygiene or sleep. Citizens do not
degrade and do not die.

**Why:** the base gameplay loop — assign work, work happens, resources
accumulate — does not exist yet. Needs are friction, and friction is only
interesting once there is something for it to rub against.

This retires the hunger system built earlier the same day (see
`feat: vertical slice`). The mechanic worked and read well on screen; it was
answering a question that comes later. It stays in the git history rather than
behind a dead flag.

**Also:** citizens are stationary for now. No wandering, no movement at all.
Anything that moves on screen is the result of a player click. This deliberately
takes pathfinding off the table — A\* was discussed at length and the real answer
was that the question isn't live yet.

## 2026-08-04 — The citizen panel is an inspector

**Decided:** clicking a villager opens a panel showing who they are. Read-only
for now, but designed to grow into: skills (what they're good and bad at), job
assignment, what they're currently working on, their house, their needs.

**Why:** selection precedes command. Every version of "give an order" needs a way
to designate *who* first, and any shortcut around it (nearest citizen, auto-
assignment) skips the layer the player actually needs.

**Consequence:** this reverses an earlier call that skills come last. That
reasoning held while a skill was a *multiplier on work being done*. As
**inspection data** a skill is a plain number with no simulation behind it, and
it is what gives the panel something real to show. Skills come first now.

**Also:** the panel must be an HTML/CSS DOM overlay per `CLAUDE.md`, not Phaser
text objects. The first HUD violated that convention; the panel is what forces
the real UI layer to exist.
