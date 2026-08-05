import type { ItemId, ItemStack } from "./items";

/**
 * What each source leaves behind when it is removed.
 *
 * Deliberately not in the item modules: a log does not know it comes from a
 * tree, and when stone comes from a rock and berries from a bush, those tables
 * belong next to each other rather than scattered through the material files.
 */

export interface DropRange {
  readonly item: ItemId;
  readonly min: number;
  readonly max: number;
}

export type DropTable = readonly DropRange[];

/**
 * Variable on purpose. A fixed yield makes every tree the same tree; the reason
 * to drop items in a place rather than credit a counter is that a specific tree
 * becomes a specific pile worth a specific trip.
 */
export const TREE_DROPS: DropTable = [
  { item: "log", min: 1, max: 3 },
  { item: "branch", min: 2, max: 7 },
  { item: "leaf", min: 4, max: 14 },
];

/** Rolled from the region seed, so a map plays out identically on replay. */
export function rollDrops(table: DropTable, random: () => number): ItemStack[] {
  const stacks: ItemStack[] = [];
  for (const drop of table) {
    const count = drop.min + Math.floor(random() * (drop.max - drop.min + 1));
    if (count > 0) stacks.push({ item: drop.item, count });
  }
  return stacks;
}
