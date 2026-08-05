import type { CitizenActivity } from "../world/Citizen";
import type { TerrainKind, TileFeature } from "../world/Grid";
import type { JobKind } from "../world/Job";
import type { SkillName } from "../world/Skills";
import type { ResourceKind } from "../world/World";
import type { ZoneKind } from "../world/Zone";

/**
 * Display strings live here rather than beside the types they name: `src/world/`
 * must stay free of anything that only matters because a human is reading it.
 */

export const SKILL_LABELS: Record<SkillName, string> = {
  lumberjacking: "Lumberjacking",
  mining: "Mining",
  building: "Building",
  farming: "Farming",
  cooking: "Cooking",
};

export const TERRAIN_LABELS: Record<TerrainKind, string> = {
  grass: "Grass",
  dirt: "Dry earth",
  sand: "Sand",
  rock: "Rock",
  water: "Water",
};

/** What each kind of ground is worth looking at for. Honest about the empty ones. */
export const TERRAIN_NOTES: Record<TerrainKind, string> = {
  grass: "Open ground. Buildable.",
  dirt: "Too dry for trees. Buildable.",
  sand: "Shoreline. Buildable, poor soil.",
  rock: "Impassable. Stone here.",
  water: "Impassable.",
};

export const FEATURE_LABELS: Record<NonNullable<TileFeature>, string> = {
  tree: "Tree",
};

export const ZONE_LABELS: Record<ZoneKind, string> = {
  woodcutting: "Woodcutting",
};

export const JOB_LABELS: Record<JobKind, string> = {
  lumberjack: "Lumberjack",
};

export const RESOURCE_LABELS: Record<ResourceKind, string> = {
  wood: "Wood",
};

export const ACTIVITY_LABELS: Record<CitizenActivity, string> = {
  idle: "Idle",
  working: "Working",
};
