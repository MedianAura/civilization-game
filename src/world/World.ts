import { EventBus } from "../core/EventBus";
import { Citizen } from "./Citizen";
import { GameClock } from "./GameClock";
import { Grid, type TileCoord } from "./Grid";
import { makeRandom } from "./noise";
import { generateRegion } from "./terrain";
import { Zone, type ZoneKind, type ZoneRect } from "./Zone";

export interface WorldEvents extends Record<string, unknown> {
  tick: { tick: number };
  "citizen:spawned": { id: string };
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

  private readonly byTile = new Map<string, Citizen>();

  constructor(options: WorldOptions = {}) {
    const { width = 128, height = 96, citizenCount = 6, seed = Math.floor(Math.random() * 0xffffffff) } = options;
    this.seed = seed;

    this.grid = new Grid(width, height, generateRegion({ seed, width, height }));

    // Spawn deterministically from the same seed so a region is reproducible
    // start to finish, colonists included.
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

  citizenAt(tile: TileCoord): Citizen | undefined {
    return this.byTile.get(key(tile));
  }

  citizenById(id: string): Citizen | undefined {
    return this.citizens.find((citizen) => citizen.id === id);
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
    this.zones.splice(index, 1);
    this.events.emit("zone:removed", { id });
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

  /** Count of tiles in a zone that the job can actually act on. */
  usableTiles(zone: Zone): number {
    let count = 0;
    zone.forEachTile((tile) => {
      if (this.grid.at(tile.x, tile.y)?.feature === "tree") count += 1;
    });
    return count;
  }

  /**
   * The clock still runs even though nobody moves — it is the one piece of the
   * simulation that is hard to retrofit, and letting it drift out of use would
   * hide a bug until the day something depends on it.
   */
  update(deltaMs: number): void {
    this.clock.advance(deltaMs, (tick) => {
      this.events.emit("tick", { tick });
    });
  }

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
      // 49 buildable tiles in a 7x7 is as good as it gets; stop looking.
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

function key(tile: TileCoord): string {
  return `${tile.x},${tile.y}`;
}
