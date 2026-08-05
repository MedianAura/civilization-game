import type { EventBus } from "../core/EventBus";
import type { ResourceKind, WorldEvents } from "../world/World";
import { RESOURCE_LABELS } from "./labels";

/**
 * What the colony has gathered. Stock only — never what is still standing in the
 * ground, which the player explicitly does not want counted for them. A number
 * that climbs when you assign someone is the payoff; a census of every tree on
 * the map is homework.
 */
export class ResourceBar {
  private readonly values = new Map<ResourceKind, HTMLElement>();

  constructor(mount: HTMLElement, events: EventBus<WorldEvents>, initial: Record<ResourceKind, number>) {
    const root = document.createElement("div");
    root.className = "resources";

    for (const [resource, amount] of Object.entries(initial) as [ResourceKind, number][]) {
      const item = document.createElement("span");
      item.className = "resources__item";

      const label = document.createElement("span");
      label.className = "resources__label";
      label.textContent = RESOURCE_LABELS[resource];

      const value = document.createElement("strong");
      value.textContent = String(amount);

      item.append(label, value);
      root.append(item);
      this.values.set(resource, value);
    }

    mount.append(root);

    events.on("resources:changed", ({ resource, total }) => {
      const node = this.values.get(resource);
      if (!node) return;
      node.textContent = String(total);
      // Flash on change: without it, a number ticking up in the corner of a large
      // map is easy to miss entirely.
      node.classList.remove("is-bumped");
      void node.offsetWidth;
      node.classList.add("is-bumped");
    });
  }
}
