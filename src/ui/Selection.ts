import { EventBus } from "../core/EventBus";

export interface SelectionEvents extends Record<string, unknown> {
  changed: { id: string | null; previous: string | null };
}

/**
 * Who the player is looking at. Deliberately *not* world state — selection is a
 * fact about the person holding the mouse, not about the colony, and a saved
 * game should never contain it.
 */
export class Selection {
  readonly events = new EventBus<SelectionEvents>();

  private current: string | null = null;

  get selectedId(): string | null {
    return this.current;
  }

  isSelected(id: string): boolean {
    return this.current === id;
  }

  select(id: string): void {
    this.set(id);
  }

  clear(): void {
    this.set(null);
  }

  /** Click the selected citizen again to deselect — the usual toggle. */
  toggle(id: string): void {
    this.set(this.current === id ? null : id);
  }

  private set(id: string | null): void {
    if (this.current === id) return;
    const previous = this.current;
    this.current = id;
    this.events.emit("changed", { id, previous });
  }
}
