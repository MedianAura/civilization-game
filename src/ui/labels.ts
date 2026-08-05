import type { CitizenActivity } from "../world/Citizen";
import type { TerrainKind, TileFeature } from "../world/Grid";
import type { ItemId } from "../world/items";
import type { JobKind } from "../world/Job";
import type { SkillName } from "../world/Skills";
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

export const ITEM_LABELS: Record<ItemId, string> = {
  leaf: "Leaves",
  branch: "Branches",
  log: "Logs",
};

/** Singular forms, for when a count of one would read wrong. */
export const ITEM_LABELS_ONE: Record<ItemId, string> = {
  leaf: "Leaf",
  branch: "Branch",
  log: "Log",
};

export function itemLabel(item: ItemId, count: number): string {
  return count === 1 ? ITEM_LABELS_ONE[item] : ITEM_LABELS[item];
}

export const ACTIVITY_LABELS: Record<CitizenActivity, string> = {
  idle: "Idle",
  working: "Working",
};
