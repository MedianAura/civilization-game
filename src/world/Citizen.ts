import type { TileCoord } from "./Grid";
import { rollSkills, type SkillSet } from "./Skills";

/**
 * A villager. Stationary and immortal by design (see .planning/DESIGN.md): no
 * ageing, no hunger, no movement. Everything that changes on screen right now is
 * the result of a player click, which is what makes the UI layer testable in
 * isolation.
 *
 * The hunger-and-wandering version lives in the git history — it worked, it just
 * answered a question that comes after the core loop exists.
 */
export class Citizen {
  readonly id: string = crypto.randomUUID();

  constructor(
    readonly name: string,
    readonly tile: TileCoord,
    readonly skills: SkillSet
  ) {}

  static spawn(name: string, tile: TileCoord, random: () => number): Citizen {
    return new Citizen(name, tile, rollSkills(random));
  }
}
