export type ItemId = "leaf" | "branch" | "log";

export interface ItemDef {
  readonly id: ItemId;
  /** Units of one item. Used for carrying capacity once hauling exists. */
  readonly weight: number;
  /** How many fit in one stack on the ground or in storage. */
  readonly stackSize: number;
}

/**
 * The item database. Everything the colony can hold is defined here and nowhere
 * else — a drop table, a storage slot and a build cost all name the same `ItemId`
 * rather than each carrying their own idea of what a log is.
 */
export const ITEMS: Record<ItemId, ItemDef> = {
  leaf: { id: "leaf", weight: 0.05, stackSize: 200 },
  branch: { id: "branch", weight: 0.5, stackSize: 50 },
  log: { id: "log", weight: 5, stackSize: 10 },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export interface ItemStack {
  readonly item: ItemId;
  count: number;
}

export interface DropRange {
  readonly item: ItemId;
  readonly min: number;
  readonly max: number;
}

/**
 * What a felled tree leaves behind. Variable on purpose: a fixed yield turns
 * every tree into the same tree, and the whole reason to drop items on the
 * ground rather than credit a counter is that a specific tree became a specific
 * pile in a specific place.
 */
export const TREE_DROPS: readonly DropRange[] = [
  { item: "log", min: 1, max: 3 },
  { item: "branch", min: 2, max: 7 },
  { item: "leaf", min: 4, max: 14 },
];

export function rollDrops(table: readonly DropRange[], random: () => number): ItemStack[] {
  const stacks: ItemStack[] = [];
  for (const drop of table) {
    const count = drop.min + Math.floor(random() * (drop.max - drop.min + 1));
    if (count > 0) stacks.push({ item: drop.item, count });
  }
  return stacks;
}

/** Merges `incoming` into `into`, in place. Ground piles do not respect stack size. */
export function mergeStacks(into: ItemStack[], incoming: readonly ItemStack[]): void {
  for (const stack of incoming) {
    const existing = into.find((s) => s.item === stack.item);
    if (existing) existing.count += stack.count;
    else into.push({ item: stack.item, count: stack.count });
  }
}

export function totalCount(stacks: readonly ItemStack[]): number {
  return stacks.reduce((sum, stack) => sum + stack.count, 0);
}

export function totalWeight(stacks: readonly ItemStack[]): number {
  return stacks.reduce((sum, stack) => sum + stack.count * ITEMS[stack.item].weight, 0);
}
