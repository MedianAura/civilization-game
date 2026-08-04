import type { Grid, TileCoord } from "./Grid";

export type CitizenActivity = "idle" | "wandering" | "seekingFood" | "eating";

/** Tiles per second at zero hunger. */
const BASE_SPEED = 2.2;
/** A fully starved citizen keeps this fraction of their speed. */
const STARVED_SPEED_FACTOR = 0.4;
/** Hunger points gained per second of simulated time. */
const HUNGER_RATE = 3.2;
/** Above this, whatever they were doing loses to finding food. */
const HUNGRY_THRESHOLD = 55;
/** Seconds spent standing on a berry tile before hunger clears. */
const EAT_SECONDS = 1.5;
/** Seconds of standing around after arriving somewhere. */
const IDLE_SECONDS = 1.2;

export interface CitizenSnapshot {
  readonly id: string;
  readonly name: string;
  /** Continuous position in tile units — the renderer's only input. */
  readonly x: number;
  readonly y: number;
  readonly tile: TileCoord;
  readonly hunger: number;
  readonly activity: CitizenActivity;
  readonly speed: number;
}

export class Citizen {
  readonly id: string = crypto.randomUUID();

  x: number;
  y: number;
  tile: TileCoord;
  hunger = 0;
  activity: CitizenActivity = "idle";

  private target: TileCoord | null = null;
  /** The adjacent tile currently being crossed. */
  private step: TileCoord | null = null;
  private waitSeconds = 0;

  constructor(
    readonly name: string,
    start: TileCoord
  ) {
    this.tile = start;
    this.x = start.x;
    this.y = start.y;
  }

  /** Hunger drags on speed — the whole reason the need exists. */
  get speed(): number {
    const hunger01 = Math.min(this.hunger, 100) / 100;
    return BASE_SPEED * (1 - (1 - STARVED_SPEED_FACTOR) * hunger01);
  }

  get isHungry(): boolean {
    return this.hunger >= HUNGRY_THRESHOLD;
  }

  snapshot(): CitizenSnapshot {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      tile: this.tile,
      hunger: this.hunger,
      activity: this.activity,
      speed: this.speed,
    };
  }

  setTarget(target: TileCoord, activity: CitizenActivity): void {
    this.target = target;
    this.step = null;
    this.activity = activity;
  }

  clearTarget(): void {
    this.target = null;
    this.step = null;
  }

  get hasTarget(): boolean {
    return this.target !== null;
  }

  beginEating(): void {
    this.activity = "eating";
    this.waitSeconds = EAT_SECONDS;
    this.clearTarget();
  }

  beginIdling(): void {
    this.activity = "idle";
    this.waitSeconds = IDLE_SECONDS;
    this.clearTarget();
  }

  /**
   * One fixed step of simulated time. Returns `true` when the citizen finished
   * whatever they were doing and needs a new decision from the World.
   */
  advance(dt: number, grid: Grid): boolean {
    if (this.activity !== "eating") {
      this.hunger = Math.min(100, this.hunger + HUNGER_RATE * dt);
    }

    if (this.waitSeconds > 0) {
      this.waitSeconds -= dt;
      if (this.waitSeconds > 0) return false;
      if (this.activity === "eating") this.hunger = 0;
      this.activity = "idle";
      return true;
    }

    if (!this.target) return true;

    if (!this.step) {
      this.step = this.nextStepToward(this.target, grid);
      if (!this.step) {
        // Greedy movement walked itself into a corner. Say so by giving up the
        // trip rather than vibrating in place — this is the honest limit of not
        // having a pathfinder, and it is what will justify writing one.
        this.clearTarget();
        return true;
      }
    }

    const moved = this.moveToward(this.step, this.speed * dt);
    if (!moved) return false;

    this.tile = this.step;
    this.step = null;
    return this.tile.x === this.target.x && this.tile.y === this.target.y;
  }

  /** Advances x/y toward a tile centre; returns true once it lands on it. */
  private moveToward(to: TileCoord, distance: number): boolean {
    const dx = to.x - this.x;
    const dy = to.y - this.y;
    const remaining = Math.hypot(dx, dy);
    if (remaining <= distance || remaining === 0) {
      this.x = to.x;
      this.y = to.y;
      return true;
    }
    this.x += (dx / remaining) * distance;
    this.y += (dy / remaining) * distance;
    return false;
  }

  /**
   * Greedy cardinal step: close the larger axis gap first, fall back to the other
   * when the preferred tile is blocked. No A* — a straight-line walker is enough
   * to show whether the simulation reads, and cheap to replace when it doesn't.
   */
  private nextStepToward(target: TileCoord, grid: Grid): TileCoord | null {
    const dx = target.x - this.tile.x;
    const dy = target.y - this.tile.y;
    if (dx === 0 && dy === 0) return null;

    const horizontal: TileCoord = { x: this.tile.x + Math.sign(dx), y: this.tile.y };
    const vertical: TileCoord = { x: this.tile.x, y: this.tile.y + Math.sign(dy) };

    const preferred = Math.abs(dx) >= Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
    for (const candidate of preferred) {
      const shifted = candidate.x !== this.tile.x || candidate.y !== this.tile.y;
      if (shifted && grid.isWalkable(candidate.x, candidate.y)) return candidate;
    }

    return null;
  }
}
