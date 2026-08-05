import { EventBus } from "../core/EventBus";
import type { ZoneKind } from "../world/Zone";

/**
 * What a click means right now. Inspecting is the resting state; a zone tool
 * turns drags into areas instead of selections.
 *
 * Modal input is a real cost — a player who forgets which mode they are in will
 * paint a zone when they meant to look at something. The toolbar has to show the
 * mode loudly, and Escape has to get out of it.
 */
export type Tool = { kind: "inspect" } | { kind: "zone"; zone: ZoneKind };

export const INSPECT: Tool = { kind: "inspect" };

export interface ToolEvents extends Record<string, unknown> {
  changed: { tool: Tool };
}

export class ToolState {
  readonly events = new EventBus<ToolEvents>();

  private active: Tool = INSPECT;

  get current(): Tool {
    return this.active;
  }

  set(tool: Tool): void {
    if (
      tool.kind === this.active.kind &&
      (tool.kind !== "zone" || this.active.kind !== "zone" || tool.zone === this.active.zone)
    ) {
      return;
    }
    this.active = tool;
    this.events.emit("changed", { tool });
  }

  /** Selecting the active zone tool again drops back to inspecting. */
  toggleZone(zone: ZoneKind): void {
    const isActive = this.active.kind === "zone" && this.active.zone === zone;
    this.set(isActive ? INSPECT : { kind: "zone", zone });
  }

  reset(): void {
    this.set(INSPECT);
  }
}
