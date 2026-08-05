import type { SkillName } from "./Skills";

export type JobKind = "lumberjack";

export const JOBS: JobKind[] = ["lumberjack"];

/** Which skill makes someone good at a job — the point where skills stop being decoration. */
export const JOB_SKILL: Record<JobKind, SkillName> = {
  lumberjack: "lumberjacking",
};

/** Seconds of work a job's unit of output takes at skill 0. */
export const JOB_BASE_SECONDS: Record<JobKind, number> = {
  lumberjack: 6,
};

/**
 * Skill shortens the work rather than multiplying a rate, because the thing the
 * player watches is a villager standing next to a tree — "that one is faster" has
 * to be visible in how long they stand there.
 *
 * Level 0 takes the base time; level 10 takes 40% of it.
 */
export function workSeconds(job: JobKind, skillLevel: number): number {
  const base = JOB_BASE_SECONDS[job];
  return base * (1 - 0.06 * Math.min(skillLevel, 10));
}
