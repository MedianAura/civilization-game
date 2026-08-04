import { Citizen, type CitizenSnapshot } from "./Citizen";
import { EventBus } from "./EventBus";
import { GameClock } from "./GameClock";
import { Grid, type TileCoord } from "./Grid";

export interface WorldEvents extends Record<string, unknown> {
  tick: { tick: number };
  "citizen:spawned": { citizen: CitizenSnapshot };
  "citizen:tileEntered": { id: string; tile: TileCoord };
  /** Fired when a citizen picks a new thing to do — the observable decision. */
  "citizen:activityChanged": { id: string; from: string; to: string; hunger: number };
  "citizen:ate": { id: string; tile: TileCoord };
  /** Greedy movement gave up. The reason a pathfinder will eventually exist. */
  "citizen:pathAbandoned": { id: string; tile: TileCoord };
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

  private readonly random: () => number;

  constructor(options: WorldOptions = {}) {
    const { width = 32, height = 22, citizenCount = 6, random = Math.random } = options;
    this.random = random;

    this.grid = new Grid(width, height, (x, y) => {
      // Border wall keeps everyone on-screen without a bounds special case.
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return "rock";
      const roll = this.random();
      if (roll < 0.06) return "rock";
      if (roll < 0.075) return "berry";
      return "grass";
    });

    for (let i = 0; i < citizenCount; i++) {
      const citizen = new Citizen(NAMES[i % NAMES.length] ?? `Citizen ${i}`, this.grid.randomWalkableTile(this.random));
      // Stagger starting hunger so they don't all stampede the berries in lockstep.
      citizen.hunger = this.random() * 40;
      this.citizens.push(citizen);
      this.events.emit("citizen:spawned", { citizen: citizen.snapshot() });
    }
  }

  /** Feed real elapsed milliseconds from the render loop. */
  update(deltaMs: number): void {
    this.clock.advance(deltaMs, (tick) => {
      const dt = this.clock.tickSeconds;
      for (const citizen of this.citizens) {
        const previousTile = citizen.tile;
        const needsDecision = citizen.advance(dt, this.grid);

        if (citizen.tile !== previousTile) {
          this.events.emit("citizen:tileEntered", { id: citizen.id, tile: citizen.tile });
        }
        if (needsDecision) this.decide(citizen);
      }
      this.events.emit("tick", { tick });
    });
  }

  /**
   * The whole point of the slice: hunger outranks whatever else was going on.
   * If this reads on screen, the need system is worth building out. If it looks
   * like random walking, it isn't — and that's cheaper to learn here.
   */
  private decide(citizen: Citizen): void {
    const previous = citizen.activity;

    if (citizen.activity === "eating") return;

    // An abandoned trip is handled before anything else. Without this, a citizen
    // whose nearest berry is walled off re-picks that same unreachable tile every
    // single tick: the activity never changes, so `announce` never fires, and the
    // livelock is invisible in the log. Observed with Élise at hunger 100, frozen
    // on one pixel for 35 seconds. Resting first makes the failure visible and
    // bounded; it does not make it correct — that needs a real pathfinder.
    const wasTravelling = previous === "wandering" || previous === "seekingFood";
    if (wasTravelling && !citizen.hasTarget) {
      this.events.emit("citizen:pathAbandoned", { id: citizen.id, tile: citizen.tile });
      citizen.beginIdling();
      this.announce(citizen, previous);
      return;
    }

    const standingOnBerry = this.grid.at(citizen.tile.x, citizen.tile.y)?.terrain === "berry";
    if (citizen.isHungry && standingOnBerry) {
      citizen.beginEating();
      this.events.emit("citizen:ate", { id: citizen.id, tile: citizen.tile });
      this.announce(citizen, previous);
      return;
    }

    if (citizen.isHungry) {
      const berry = this.grid.nearestTile(citizen.tile, (tile) => tile.terrain === "berry");
      if (berry) {
        citizen.setTarget({ x: berry.x, y: berry.y }, "seekingFood");
        this.announce(citizen, previous);
        return;
      }
      // No berries left on the map — fall through and keep wandering hungry.
    }

    // Arrived somewhere on purpose — stand around before picking the next thing.
    if (wasTravelling) {
      citizen.beginIdling();
      this.announce(citizen, previous);
      return;
    }

    citizen.setTarget(this.grid.randomWalkableTile(this.random), "wandering");
    this.announce(citizen, previous);
  }

  private announce(citizen: Citizen, from: string): void {
    if (citizen.activity === from) return;
    this.events.emit("citizen:activityChanged", {
      id: citizen.id,
      from,
      to: citizen.activity,
      hunger: citizen.hunger,
    });
  }
}
