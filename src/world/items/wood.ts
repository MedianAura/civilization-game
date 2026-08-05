import type { ItemTable } from "./types";

/**
 * Everything a tree is made of. One file per material family: this is the file
 * that grows when planks, bark and charcoal arrive, and nothing else has to be
 * opened to add them.
 */
export const WOOD_ITEMS = {
  leaf: { category: "wood", weight: 0.05, stackSize: 200 },
  branch: { category: "wood", weight: 0.5, stackSize: 50 },
  log: { category: "wood", weight: 5, stackSize: 10 },
} as const satisfies ItemTable;
