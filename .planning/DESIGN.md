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

## 2026-08-04 — Zones are world state; selection is not

**Decided:** a zone is a standing instruction attached to an area ("gather wood
here"). It belongs to the colony, survives the click that created it, and would
appear in a save file. Selection does not.

The rectangle is stored whole, including tiles the job cannot use. A woodcutting
zone drawn across bare grass is not an error — it has nothing to work on yet, and
it will if something grows there.

**Overlap:** zones may overlap, and the most recently drawn one wins a shared
tile. Refusing an overlap would mean explaining the refusal mid-drag; "the last
thing you drew is what applies" is what a player expects from a paint tool.

**Modal input, and the cost of it.** A zone tool turns drags into areas instead
of selections. That is a real hazard — a player who forgets the mode paints when
they meant to look — so the toolbar states the active mode in words and Escape
always returns to inspecting.

**Click precedence: villager > zone > tile, with Alt to drill down.** The
precedence alone made the layers underneath unreachable: the tile panel's own
"Zone" row could only ever read "None", because reaching a tile inside a zone was
impossible. A row that can only display one value is a lie with extra steps.
Alt-click selects the tile itself regardless of what stands on it.

**Still open:** nothing assigns anyone to a zone yet. The panel says "Assigned:
Nobody" and means it. That is the next real question — and it is the one where
jobs, and eventually skills-as-multipliers, come back.

## 2026-08-04 — Scale: one tile is one person

**Decided:** a tile is roughly 1–1.5 m. The scale is set by the smallest actor,
not the landscape: a villager occupies exactly one tile, so a 3 m tile would mean
a person filling 9 m² who cannot share their square with anything.

**Ground and what stands on it are separate.** `terrain` is what a tile *is* once
cleared (grass, dirt, sand, rock, water); `feature` is what stands on it (a tree,
later an ore node). The old model made "tree" a terrain, which meant the tile
*was* the tree — felling it had nowhere to go. The note already said "passable
once cleared" while the code had nothing to clear: the comment described the
right model and the code had another one.

**Richness is not scale.** "A tile should hold more than one thing" does not
require bigger tiles — a tree yields 5 logs from a 1 m tile. Resource nodes are
features, not biomes: a biome says "this is forest", a node says "there is iron
here", and they live on different layers.

## 2026-08-04 — A region is 128×96, generated from coherent noise

**Decided:** 128 × 96 tiles (~12 300), generated from two noise fields —
elevation carves mountains and lake basins, moisture decides forest against dry
earth.

**Why the old map could not work:** it rolled each tile independently
(`roll < 0.05 → rock`). That cannot produce a forest, only scattered trees that
occasionally land beside each other. Enlarging it would have produced a larger
field of the same static. Coherence was the problem, size was second.

**Regions are plural by construction.** Size and seed are arguments, generation
is deterministic, and nothing assumes there is only one. A world map holding
several of these later means holding several `World` instances, not reworking
one. `?seed=123` reproduces a region exactly — terrain bugs are unreportable
otherwise.

**The camera was the hidden dependency.** While the board fitted on screen,
"seeing" was free. It is not any more: right-drag pans (the left drag already
means "paint a zone"), the wheel zooms toward the cursor, WASD and arrows pan.
Zooming out stops where the region still fills the window — `setBounds(…, true)`
centres only once, at the moment it is called, so it could not keep the world off
the void.

**Rivers are parked.** Forest, mountain, lake and dry earth fall straight out of
a threshold on two channels. A river follows a slope and needs a flow model, and
a bad one is obvious — it runs uphill, it ends in nothing — while an approximate
forest just looks like a forest.

## 2026-08-04 — Workers are stationary, and that is the design

**Decided:** an assigned worker works their zone from where they stand. Nobody
walks. This is not a placeholder for movement — it is how a colony sim abstracts
labour at the building level (Anno, Banished), and it keeps the question honest:
"is assigning someone and watching a resource climb satisfying?" needs no walk
cycle to answer.

**A\* was written and deleted, twice in one day.** First when hunger was retired,
then again here, ten minutes after being written. Twice is not coincidence — it
is the signal that movement is not what this game is asking for yet. It will be
written a third time if and when a citizen has to *be* somewhere.

**What is drawn instead:** a progress ring on the tree being felled and a thin
thread back to whoever is felling it. The abstraction is shown rather than
hidden — a long thread across the map reads as "that one is assigned here", not
as a bug.

**Skills stop being decoration.** `workSeconds` shortens the work rather than
multiplying a rate, because what the player watches is someone standing at a
tree: "that one is faster" has to be visible as time spent. Level 0 takes the
base 6 s, level 10 takes 40% of it. The job picker shows the relevant level right
on the button, so assigning the worst possible person is a decision rather than
an accident.

**Claims, not queues.** A tree being worked is claimed so two lumberjacks cannot
chop the same one. If it is already gone when the work finishes — felled by
someone else, or its zone removed mid-swing — the yield is lost. That is correct:
the tree is not there.

**Open question:** the resource bar counts stock only, never what is still
standing in the ground. The player was explicit that counting trees for them is
unwanted. Whether the stock belongs in a HUD at all, or should become physical
(log piles, a storehouse), is not settled.

## 2026-08-04 — Items exist on the ground, not in a counter

**Decided:** felling a tree drops a variable number of leaves, branches and logs
**on the tile where the tree stood**. There is no global wood total.

**This retires the resource bar, one commit after it was built.** The warning was
"you're going to waste your time on that", and it was right for a reason that
only became visible now: if the yield lands on the ground, a global counter is a
lie — it claims the colony *has* something that is actually lying in a forest two
hundred tiles away. A bar returns when it can count the contents of a storehouse,
which is a different and true statement.

**Variable yield is the point, not flavour.** A fixed yield makes every tree the
same tree; the reason to drop items in a place rather than credit a number is
that a specific tree becomes a specific pile worth a specific trip. Drops are
rolled from the region seed, so a save replays identically.

**One database, one `ItemId`.** A drop table, a storage slot and a build cost all
name the same id rather than each carrying a private idea of what a log is.
Weight is defined now though nothing reads it yet — hauling will, and retrofitting
a weight onto items already scattered across a map is worse than declaring it
unused for one commit.

**Ground piles ignore stack size.** A stack limit is a storage constraint; the
forest floor has no shelves.

**Next, per the plan:** a build HUD offering zone tools, a construct database, and
a storage zone as the first building — with citizens hauling ground items into
it. That last part is what finally requires movement, and it is the third time
A\* will have been written.
