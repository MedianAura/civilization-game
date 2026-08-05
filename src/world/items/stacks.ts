import { ITEMS, type ItemId, type ItemStack } from "./registry";

/**
 * Operations on piles. This file stays a handful of functions no matter how many
 * items exist — which is exactly why it does not live beside the definitions
 * that will not.
 */

/** Merges `incoming` into `into`, in place. */
export function mergeStacks(into: ItemStack[], incoming: readonly ItemStack[]): void {
  for (const stack of incoming) {
    const existing = into.find((s) => s.item === stack.item);
    if (existing) existing.count += stack.count;
    else into.push({ item: stack.item, count: stack.count });
  }
}

/**
 * Removes up to `count` of `item`, returning how many were actually taken.
 * Emptied stacks are dropped from the array so "is this pile gone" stays a
 * length check rather than a scan for zeroes.
 */
export function takeFromStacks(stacks: ItemStack[], item: ItemId, count: number): number {
  const index = stacks.findIndex((s) => s.item === item);
  const stack = stacks[index];
  if (!stack) return 0;

  const taken = Math.min(stack.count, count);
  stack.count -= taken;
  if (stack.count === 0) stacks.splice(index, 1);
  return taken;
}

export function countOf(stacks: readonly ItemStack[], item: ItemId): number {
  return stacks.find((s) => s.item === item)?.count ?? 0;
}

export function totalCount(stacks: readonly ItemStack[]): number {
  return stacks.reduce((sum, stack) => sum + stack.count, 0);
}

export function totalWeight(stacks: readonly ItemStack[]): number {
  return stacks.reduce((sum, stack) => sum + stack.count * ITEMS[stack.item].weight, 0);
}
