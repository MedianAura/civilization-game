import { EventBus } from "../core/EventBus";

/**
 * What the player is looking at. A discriminated union rather than a citizen id,
 * because "nothing here but grass" is a real answer the inspector has to give —
 * and because everything the player will eventually click (a zone, a building,
 * a stockpile) is another variant rather than another panel.
 */
export type SelectionTarget =
  { kind: "citizen"; id: string } | { kind: "tile"; x: number; y: number } | { kind: "zone"; id: string };

export interface SelectionEvents extends Record<string, unknown> {
  changed: { target: SelectionTarget | null; previous: SelectionTarget | null };
}

export function sameTarget(a: SelectionTarget | null, b: SelectionTarget | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.kind !== b.kind) return false;
  if (a.kind === "tile" && b.kind === "tile") return a.x === b.x && a.y === b.y;
  if (b.kind !== "tile") return a.kind !== "tile" && a.id === b.id;
  return false;
}

/**
 * Deliberately *not* world state — selection is a fact about the person holding
 * the mouse, not about the colony, and a saved game should never contain it.
 */
export class Selection {
  readonly events = new EventBus<SelectionEvents>();

  private current: SelectionTarget | null = null;

  get target(): SelectionTarget | null {
    return this.current;
  }

  select(target: SelectionTarget): void {
    this.set(target);
  }

  clear(): void {
    this.set(null);
  }

  /** Click the same thing again to deselect — the usual toggle. */
  toggle(target: SelectionTarget): void {
    this.set(sameTarget(this.current, target) ? null : target);
  }

  private set(target: SelectionTarget | null): void {
    if (sameTarget(this.current, target)) return;
    const previous = this.current;
    this.current = target;
    this.events.emit("changed", { target, previous });
  }
}
