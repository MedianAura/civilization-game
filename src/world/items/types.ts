/**
 * Shapes only. No item is named in this file, which is what lets a category
 * module import it without importing the registry that imports the category.
 */

/** Broad grouping, for filtering a storehouse or a build cost by material. */
export type ItemCategory = "wood" | "stone" | "food";

export interface ItemDef {
  readonly category: ItemCategory;
  /** Units of one item. Read by carrying capacity once hauling exists. */
  readonly weight: number;
  /** How many fit in one stack in storage. Ground piles ignore this. */
  readonly stackSize: number;
}

/**
 * A category module declares `as const satisfies ItemTable`, which checks every
 * definition while keeping the literal keys — that is what makes `ItemId` derive
 * itself from the registry instead of being a hand-kept union that drifts.
 */
export type ItemTable = Record<string, ItemDef>;
