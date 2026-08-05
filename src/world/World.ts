import { EventBus } from "../core/EventBus";
import { Citizen } from "./Citizen";
import { GameClock } from "./GameClock";
import { Grid, type TileCoord } from "./Grid";
import { mergeStacks, rollDrops, TREE_DROPS, type ItemStack } from "./items";
import { JOB_SKILL, workSeconds, type JobKind } from "./Job";
import { makeRandom } from "./noise";
import { generateRegion } from "./terrain";
import { Zone, type ZoneKind, type ZoneRect } from "./Zone";

export interface WorldEvents extends Record<string, unknown> {
  tick: { tick: number };
  "citizen:spawned": { id: string };
  "citizen:jobChanged": { id: string; job: JobKind | null };
  "citizen:startedTask": { id: string; target: TileCoord };
  "citizen:noWork": { id: string; reason: "no-zone" | "no-trees" };
  "tree:felled": { tile: TileCoord; by: string; dropped: ItemStack[] };
  "ground:changed": { tile: TileCoord };
  "zone:added": { id: string };
  "zone:removed": { id: string };
}

const NAMES = ["Alma", "Bertrand", "Cécile", "Damien", "Élise", "Fabien", "Gaby", "Hugo"];

export interface WorldOptions {
  width?: number;
  height?: number;
  citizenCount?: number;
  seed?: number;
}

/**
 * One region. Nothing here assumes it is the only one — size and seed are
 * arguments, generation is deterministic, and a world map of several regions
 * later means holding several of these rather than reworking this.
 */
export class World {
  readonly events = new EventBus<WorldEvents>();
  readonly grid: Grid;
  readonly clock = new GameClock();
  readonly citizens: Citizen[] = [];
  readonly zones: Zone[] = [];
  readonly seed: number;

  /**
   * What is lying on the ground, by tile. Felled trees leave their yield where
   * they stood rather than crediting a global counter — a specific tree becomes a
   * specific pile in a specific place, which is the whole point of hauling later.
   */
  private readonly ground = new Map<string, ItemStack[]>();

  private readonly byTile = new Map<string, Citizen>();
  /** Trees already spoken for, so two lumberjacks do not chop the same one. */
  private readonly claimed = new Set<string>();
  /** Drops are seeded so a region plays out identically on the same seed. */
  private readonly dropRandom: () => number;

  constructor(options: WorldOptions = {}) {
    const { width = 128, height = 96, citizenCount = 6, seed = Math.floor(Math.random() * 0xffffffff) } = options;
    this.seed = seed;

    this.grid = new Grid(width, height, generateRegion({ seed, width, height }));

    this.dropRandom = makeRandom(seed ^ 0x27d4eb2f);

    const random = makeRandom(seed ^ 0xc2b2ae35);
    const spawn = this.findSettlementSite(random);

    for (let i = 0; i < citizenCount; i++) {
      const tile = this.freeTileNear(spawn, random);
      const citizen = Citizen.spawn(NAMES[i % NAMES.length] ?? `Citizen ${i}`, tile, random);
      this.citizens.push(citizen);
      this.byTile.set(key(tile), citizen);
      this.events.emit("citizen:spawned", { id: citizen.id });
    }
  }

  // -- lookups -------------------------------------------------------------

  citizenAt(tile: TileCoord): Citizen | undefined {
    return this.byTile.get(key(tile));
  }

  citizenById(id: string): Citizen | undefined {
    return this.citizens.find((citizen) => citizen.id === id);
  }

  zoneById(id: string): Zone | undefined {
    return this.zones.find((zone) => zone.id === id);
  }

  /**
   * Zones may overlap; the most recently drawn one wins a shared tile. That is a
   * choice, not an oversight — refusing the overlap would mean explaining the
   * refusal mid-drag, and "the last thing you drew is what applies" is what a
   * player expects from a paint tool.
   */
  zoneAt(tile: TileCoord): Zone | undefined {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      if (this.zones[i]?.contains(tile)) return this.zones[i];
    }
    return undefined;
  }

  usableTiles(zone: Zone): number {
    let count = 0;
    zone.forEachTile((tile) => {
      if (this.grid.at(tile.x, tile.y)?.feature === "tree") count += 1;
    });
    return count;
  }

  workersOn(zone: Zone): Citizen[] {
    return this.citizens.filter((c) => c.task && zone.contains(c.task.target));
  }

  /** What is lying on a tile. Empty array rather than undefined — callers just iterate. */
  itemsAt(tile: TileCoord): readonly ItemStack[] {
    return this.ground.get(key(tile)) ?? EMPTY;
  }

  hasItemsAt(tile: TileCoord): boolean {
    return this.ground.has(key(tile));
  }

  /** Every tile currently holding something. The hauling pass will want this. */
  groundTiles(): TileCoord[] {
    return [...this.ground.keys()].map((k) => {
      const [x, y] = k.split(",");
      return { x: Number(x), y: Number(y) };
    });
  }

  private addToGround(tile: TileCoord, stacks: readonly ItemStack[]): void {
    if (stacks.length === 0) return;
    const id = key(tile);
    const existing = this.ground.get(id);
    if (existing) mergeStacks(existing, stacks);
    else
      this.ground.set(
        id,
        stacks.map((s) => ({ ...s }))
      );
    this.events.emit("ground:changed", { tile });
  }

  // -- player actions ------------------------------------------------------

  setJob(id: string, job: JobKind | null): void {
    const citizen = this.citizenById(id);
    if (!citizen || citizen.job === job) return;
    citizen.job = job;
    this.release(citizen);
    this.events.emit("citizen:jobChanged", { id, job });
  }

  addZone(kind: ZoneKind, rect: ZoneRect): Zone {
    const zone = new Zone(kind, this.clampToGrid(rect));
    this.zones.push(zone);
    this.events.emit("zone:added", { id: zone.id });
    return zone;
  }

  removeZone(id: string): void {
    const index = this.zones.findIndex((zone) => zone.id === id);
    if (index === -1) return;
    const [zone] = this.zones.splice(index, 1);
    if (zone) {
      // Anyone chopping a tree in a zone that no longer exists should stop.
      for (const citizen of this.citizens) {
        if (citizen.task && zone.contains(citizen.task.target) && !this.zoneAt(citizen.task.target)) {
          this.release(citizen);
        }
      }
    }
    this.events.emit("zone:removed", { id });
  }

  // -- simulation ----------------------------------------------------------

  update(deltaMs: number): void {
    this.clock.advance(deltaMs, (tick) => {
      const dt = this.clock.tickSeconds;
      for (const citizen of this.citizens) {
        const result = citizen.advance(dt);
        if (result === "finished") this.completeTask(citizen);
        if (result === "idle" && citizen.job) this.findWork(citizen);
      }
      this.events.emit("tick", { tick });
    });
  }

  private completeTask(citizen: Citizen): void {
    const task = citizen.task;
    if (!task) return;

    const tile = this.grid.at(task.target.x, task.target.y);
    // The tree may have been felled by someone else, or the zone removed, while
    // this citizen was swinging. Losing the yield is correct; the tree is gone.
    if (tile?.feature === "tree") {
      this.grid.clearFeature(task.target.x, task.target.y);
      const dropped = rollDrops(TREE_DROPS, this.dropRandom);
      this.addToGround(task.target, dropped);
      this.events.emit("tree:felled", { tile: task.target, by: citizen.id, dropped });
    }

    this.release(citizen);
    this.findWork(citizen);
  }

  /**
   * Claim the nearest unclaimed tree in a matching zone.
   *
   * Nearest does not affect how fast the work goes — nobody walks — but it makes
   * a zone empty outward from whoever is working it instead of dissolving at
   * random, which is the difference between reading as work and reading as decay.
   */
  private findWork(citizen: Citizen): void {
    if (citizen.job !== "lumberjack") return;

    let best: TileCoord | null = null;
    let bestDistance = Infinity;

    for (const zone of this.zones) {
      if (zone.kind !== "woodcutting") continue;
      zone.forEachTile((tile) => {
        if (this.grid.at(tile.x, tile.y)?.feature !== "tree") return;
        if (this.claimed.has(key(tile))) return;
        const distance = Math.abs(tile.x - citizen.tile.x) + Math.abs(tile.y - citizen.tile.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = tile;
        }
      });
    }

    if (best === null) {
      citizen.activity = "idle";
      this.events.emit("citizen:noWork", {
        id: citizen.id,
        reason: this.zones.some((z) => z.kind === "woodcutting") ? "no-trees" : "no-zone",
      });
      return;
    }

    const seconds = workSeconds("lumberjack", citizen.skills[JOB_SKILL.lumberjack]);
    this.claimed.add(key(best));
    citizen.assign({ kind: "chop", target: best, totalSeconds: seconds, secondsLeft: seconds });
    this.events.emit("citizen:startedTask", { id: citizen.id, target: best });
  }

  private release(citizen: Citizen): void {
    if (citizen.task) this.claimed.delete(key(citizen.task.target));
    citizen.abandonTask();
  }

  // -- generation ----------------------------------------------------------

  /**
   * Somewhere worth landing: open ground with open ground around it. Dropping
   * colonists on a random buildable tile puts them on a one-tile beach between a
   * cliff and a lake often enough to be annoying.
   */
  private findSettlementSite(random: () => number): TileCoord {
    let best: TileCoord | null = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < 300; attempt++) {
      const candidate = this.grid.randomBuildableTile(random);
      let score = 0;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (this.grid.isBuildable(candidate.x + dx, candidate.y + dy)) score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
      if (bestScore >= 45) break;
    }
    return best ?? this.grid.randomBuildableTile(random);
  }

  private freeTileNear(origin: TileCoord, random: () => number): TileCoord {
    for (let radius = 1; radius < 20; radius++) {
      const candidates: TileCoord[] = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = origin.x + dx;
          const y = origin.y + dy;
          if (this.grid.isBuildable(x, y) && !this.byTile.has(key({ x, y }))) candidates.push({ x, y });
        }
      }
      if (candidates.length > 0) {
        return candidates[Math.floor(random() * candidates.length)] ?? origin;
      }
    }
    return this.grid.randomBuildableTile(random);
  }

  private clampToGrid(rect: ZoneRect): ZoneRect {
    const x = Math.max(0, rect.x);
    const y = Math.max(0, rect.y);
    return {
      x,
      y,
      width: Math.min(rect.width + Math.min(rect.x, 0), this.grid.width - x),
      height: Math.min(rect.height + Math.min(rect.y, 0), this.grid.height - y),
    };
  }
}

const EMPTY: readonly ItemStack[] = [];

function key(tile: TileCoord): string {
  return `${tile.x},${tile.y}`;
}
