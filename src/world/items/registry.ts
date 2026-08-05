import type { ItemCategory, ItemDef } from "./types";
import { WOOD_ITEMS } from "./wood";

/**
 * The one place every item exists. Adding a material family means writing its
 * module and adding one spread here — `ItemId` widens on its own, and every
 * `Record<ItemId, …>` in the codebase (labels, colours, storage filters) fails
 * to compile until it accounts for the new entries.
 *
 * That last part is the reason for deriving the type rather than declaring it:
 * a hand-written union lets you add an item and forget its label.
 */
export const ITEMS = {
  ...WOOD_ITEMS,
} as const;

export type ItemId = keyof typeof ITEMS;

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export function itemDef(id: ItemId): ItemDef {
  return ITEMS[id];
}

export function itemsInCategory(category: ItemCategory): ItemId[] {
  return ITEM_IDS.filter((id) => ITEMS[id].category === category);
}

export interface ItemStack {
  readonly item: ItemId;
  count: number;
}
