import { EventBus } from "../core/EventBus";
import { Citizen } from "./Citizen";
import { GameClock } from "./GameClock";
import { Grid, type TileCoord } from "./Grid";

export interface WorldEvents extends Record<string, unknown> {
  tick: { tick: number };
  "citizen:spawned": { id: string };
}

const NAMES = ["Alma", "Bertrand", "Cécile", "Damien", "Élise", "Fabien", "Gaby", "Hugo"];

export interface WorldOptions {
  width?: number;
  height?: number;
  citizenCount?: number;
  random?: () => number;
}

export class World {
  readonly events = new EventBus<WorldEvents>();
  readonly grid: Grid;
  readonly clock = new GameClock();
  readonly citizens: Citizen[] = [];

  private readonly byTile = new Map<string, Citizen>();

  constructor(options: WorldOptions = {}) {
    const { width = 32, height = 22, citizenCount = 6, random = Math.random } = options;

    this.grid = new Grid(width, height, (x, y) => {
      // Border wall keeps everyone on-screen without a bounds special case.
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return "rock";
      const roll = random();
      if (roll < 0.05) return "rock";
      if (roll < 0.14) return "tree";
      return "grass";
    });

    for (let i = 0; i < citizenCount; i++) {
      const tile = this.freeTile(random);
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

  private freeTile(random: () => number): TileCoord {
    for (let attempt = 0; attempt < 200; attempt++) {
      const tile = this.grid.randomWalkableTile(random);
      if (!this.byTile.has(key(tile))) return tile;
    }
    throw new Error("Could not find a free tile for a citizen after 200 samples");
  }
}

function key(tile: TileCoord): string {
  return `${tile.x},${tile.y}`;
}
