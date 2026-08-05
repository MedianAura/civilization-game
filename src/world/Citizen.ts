import type { TileCoord } from "./Grid";
import type { JobKind } from "./Job";
import { rollSkills, type SkillSet } from "./Skills";

export type CitizenActivity = "idle" | "working";

export interface CitizenTask {
  readonly kind: "chop";
  /** The tile holding the tree being worked. */
  readonly target: TileCoord;
  readonly totalSeconds: number;
  secondsLeft: number;
}

/**
 * A villager. Immortal and stationary by design (see .planning/DESIGN.md).
 *
 * Stationary is not a placeholder for movement: an assigned worker works their
 * zone from where they stand, the way a colony sim abstracts labour at the
 * building level. It keeps the question honest — "is assigning someone and
 * watching a resource climb satisfying?" needs no walk cycle to answer.
 */
export class Citizen {
  readonly id: string = crypto.randomUUID();

  activity: CitizenActivity = "idle";
  job: JobKind | null = null;
  task: CitizenTask | null = null;

  constructor(
    readonly name: string,
    readonly tile: TileCoord,
    readonly skills: SkillSet
  ) {}

  static spawn(name: string, tile: TileCoord, random: () => number): Citizen {
    return new Citizen(name, tile, rollSkills(random));
  }

  /** 0 to 1 through the current piece of work — the renderer's progress bar. */
  get progress(): number {
    if (!this.task) return 0;
    return 1 - Math.max(0, this.task.secondsLeft) / this.task.totalSeconds;
  }

  assign(task: CitizenTask): void {
    this.task = task;
    this.activity = "working";
  }

  abandonTask(): void {
    this.task = null;
    this.activity = "idle";
  }

  /** One fixed step. "finished" is the tick a piece of work completes. */
  advance(dt: number): "working" | "finished" | "idle" {
    if (!this.task) {
      this.activity = "idle";
      return "idle";
    }
    this.task.secondsLeft -= dt;
    return this.task.secondsLeft > 0 ? "working" : "finished";
  }
}
