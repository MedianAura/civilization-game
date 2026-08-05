import type { ZoneKind } from "../world/Zone";
import { ZONE_LABELS } from "./labels";
import type { ToolState } from "./Tool";

const ZONE_TOOLS: ZoneKind[] = ["woodcutting"];

/**
 * The mode switch. Deliberately loud about which tool is active — modal input
 * that hides its mode is how a player paints a zone while trying to click a
 * villager.
 */
export class Toolbar {
  private readonly buttons = new Map<ZoneKind, HTMLButtonElement>();
  private readonly hint: HTMLElement;

  constructor(
    mount: HTMLElement,
    private readonly tools: ToolState
  ) {
    const root = document.createElement("nav");
    root.className = "toolbar";

    for (const zone of ZONE_TOOLS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = ZONE_LABELS[zone];
      button.addEventListener("click", () => this.tools.toggleZone(zone));
      this.buttons.set(zone, button);
      root.append(button);
    }

    this.hint = document.createElement("p");
    this.hint.className = "toolbar__hint";
    root.append(this.hint);
    mount.append(root);

    this.tools.events.on("changed", () => this.sync());
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.tools.reset();
    });

    this.sync();
  }

  private sync(): void {
    const tool = this.tools.current;
    for (const [zone, button] of this.buttons) {
      const active = tool.kind === "zone" && tool.zone === zone;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    this.hint.textContent =
      tool.kind === "zone"
        ? `Drag to mark a ${ZONE_LABELS[tool.zone].toLowerCase()} area · Esc to cancel`
        : "Click to inspect · Alt-click for the tile underneath";
  }
}
