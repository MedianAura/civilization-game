import type { Citizen } from "../world/Citizen";
import type { Tile } from "../world/Grid";
import { totalCount, totalWeight, type ItemStack } from "../world/items";
import { JOB_SKILL, JOBS, type JobKind } from "../world/Job";
import { bestSkill, MAX_SKILL_LEVEL, SKILLS, worstSkill } from "../world/Skills";
import type { Zone } from "../world/Zone";
import {
  ACTIVITY_LABELS,
  FEATURE_LABELS,
  itemLabel,
  JOB_LABELS,
  SKILL_LABELS,
  TERRAIN_LABELS,
  TERRAIN_NOTES,
  ZONE_LABELS,
} from "./labels";
import type { Selection, SelectionTarget } from "./Selection";

export interface InspectorSources {
  citizen: (id: string) => Citizen | undefined;
  tile: (x: number, y: number) => Tile | undefined;
  occupant: (x: number, y: number) => Citizen | undefined;
  passable: (x: number, y: number) => boolean;
  itemsAt: (x: number, y: number) => readonly ItemStack[];
  zone: (id: string) => Zone | undefined;
  zoneAt: (x: number, y: number) => Zone | undefined;
  usableTiles: (zone: Zone) => number;
  workersOn: (zone: Zone) => Citizen[];
  removeZone: (id: string) => void;
  setJob: (id: string, job: JobKind | null) => void;
}

/**
 * The inspector. A DOM overlay rather than Phaser text objects, per CLAUDE.md.
 *
 * One panel, one job: say what the player just clicked. It dispatches on the
 * selection's kind, so a building later becomes another branch here rather than
 * another floating window.
 */
export class InspectorPanel {
  private readonly root: HTMLElement;

  constructor(
    mount: HTMLElement,
    private readonly selection: Selection,
    private readonly sources: InspectorSources
  ) {
    this.root = document.createElement("aside");
    this.root.className = "inspector";
    this.root.hidden = true;
    mount.appendChild(this.root);

    this.root.addEventListener("click", (event) => {
      const el = event.target as HTMLElement;
      if (el.closest("[data-close]")) {
        this.selection.clear();
        return;
      }
      const remove = el.closest<HTMLElement>("[data-remove-zone]");
      if (remove?.dataset.removeZone) {
        this.sources.removeZone(remove.dataset.removeZone);
        this.selection.clear();
        return;
      }

      const setJob = el.closest<HTMLElement>("[data-set-job]");
      const target = this.selection.target;
      if (setJob && target?.kind === "citizen") {
        const value = setJob.dataset.setJob;
        this.sources.setJob(target.id, value ? (value as JobKind) : null);
        this.refresh();
      }
    });

    this.selection.events.on("changed", ({ target }) => this.render(target));
  }

  /** Re-render in place — used when the world changes under a live selection. */
  refresh(): void {
    this.render(this.selection.target);
  }

  /**
   * Repaint only when something on screen actually ticks. Rebuilding the whole
   * panel four times a second regardless would fight the player's cursor for no
   * reason — a static tile has nothing to say between clicks.
   */
  refreshIfLive(): void {
    const target = this.selection.target;
    if (target?.kind === "citizen" && this.sources.citizen(target.id)?.task) this.refresh();
    else if (target?.kind === "zone") this.refresh();
  }

  private render(target: SelectionTarget | null): void {
    const content = target === null ? null : this.build(target);
    if (!content) {
      this.root.hidden = true;
      this.root.replaceChildren();
      return;
    }
    this.root.hidden = false;
    this.root.replaceChildren(...content);
  }

  private build(target: SelectionTarget): HTMLElement[] | null {
    if (target.kind === "citizen") {
      const citizen = this.sources.citizen(target.id);
      return citizen ? this.citizenView(citizen) : null;
    }
    if (target.kind === "zone") {
      const zone = this.sources.zone(target.id);
      return zone ? this.zoneView(zone) : null;
    }
    const tile = this.sources.tile(target.x, target.y);
    return tile ? this.tileView(tile) : null;
  }

  // -- views ---------------------------------------------------------------

  private citizenView(citizen: Citizen): HTMLElement[] {
    const doing = citizen.task
      ? `Chopping (${Math.round(citizen.progress * 100)}%)`
      : ACTIVITY_LABELS[citizen.activity];

    return [
      this.header(citizen.name, "Villager"),
      this.summary([
        ["Best at", SKILL_LABELS[bestSkill(citizen.skills)]],
        ["Worst at", SKILL_LABELS[worstSkill(citizen.skills)]],
        ["Doing", doing],
        ["Home", "None"],
        ["Tile", `${citizen.tile.x}, ${citizen.tile.y}`],
      ]),
      this.jobPicker(citizen),
      this.skillList(citizen),
    ];
  }

  /** The first control in the game that writes to the world rather than reading it. */
  private jobPicker(citizen: Citizen): HTMLElement {
    const section = document.createElement("section");
    section.className = "inspector__jobs";

    const heading = document.createElement("h3");
    heading.textContent = "Job";
    section.append(heading);

    const row = document.createElement("div");
    row.className = "jobs";

    for (const job of [null, ...JOBS] as (JobKind | null)[]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.setJob = job ?? "";
      button.textContent = job ? JOB_LABELS[job] : "None";
      button.classList.toggle("is-active", citizen.job === job);
      button.setAttribute("aria-pressed", String(citizen.job === job));

      if (job) {
        // Say what they are good at right where the choice is made, so assigning
        // the worst possible person is a decision rather than an accident.
        const level = citizen.skills[JOB_SKILL[job]];
        const badge = document.createElement("span");
        badge.className = "jobs__level";
        badge.textContent = String(level);
        button.append(badge);
      }
      row.append(button);
    }

    section.append(row);
    return section;
  }

  private tileView(tile: Tile): HTMLElement[] {
    const occupant = this.sources.occupant(tile.x, tile.y);
    const zone = this.sources.zoneAt(tile.x, tile.y);

    const items = this.sources.itemsAt(tile.x, tile.y);

    // The heading names what is *there*, and a pile counts: a cleared tile with
    // twelve logs on it is not "grass", it is where a tree used to be.
    const heading = tile.feature
      ? FEATURE_LABELS[tile.feature]
      : items.length > 0
        ? "Items on the ground"
        : TERRAIN_LABELS[tile.terrain];

    const nodes: HTMLElement[] = [
      this.header(heading, `Tile ${tile.x}, ${tile.y}`),
      this.summary([
        ["Ground", TERRAIN_LABELS[tile.terrain]],
        ["Standing on it", tile.feature ? FEATURE_LABELS[tile.feature] : "Nothing"],
        ["Passable", this.sources.passable(tile.x, tile.y) ? "Yes" : "No"],
        ["Occupant", occupant?.name ?? "None"],
        ["Zone", zone ? ZONE_LABELS[zone.kind] : "None"],
      ]),
    ];

    if (items.length > 0) nodes.push(this.itemList(items));
    nodes.push(
      this.note(
        tile.feature === "tree"
          ? `Timber. Felling it drops what it was made of where it stood.`
          : TERRAIN_NOTES[tile.terrain]
      )
    );
    return nodes;
  }

  private itemList(items: readonly ItemStack[]): HTMLElement {
    const section = document.createElement("section");
    section.className = "inspector__items";

    const heading = document.createElement("h3");
    heading.textContent = "On the ground";
    section.append(heading);

    for (const stack of items) {
      const row = document.createElement("div");
      row.className = "item";

      const swatch = document.createElement("span");
      swatch.className = `item__swatch item__swatch--${stack.item}`;

      const name = document.createElement("span");
      name.className = "item__name";
      name.textContent = itemLabel(stack.item, stack.count);

      const count = document.createElement("span");
      count.className = "item__count";
      count.textContent = String(stack.count);

      row.append(swatch, name, count);
      section.append(row);
    }

    const weight = document.createElement("p");
    weight.className = "item__weight";
    weight.textContent = `${totalCount(items)} items · ${totalWeight(items).toFixed(1)} weight`;
    section.append(weight);

    return section;
  }

  private zoneView(zone: Zone): HTMLElement[] {
    const usable = this.sources.usableTiles(zone);
    const workers = this.sources.workersOn(zone);

    const nodes: HTMLElement[] = [
      this.header(ZONE_LABELS[zone.kind], "Zone"),
      this.summary([
        ["Area", `${zone.rect.width} × ${zone.rect.height}`],
        ["Tiles", String(zone.tileCount)],
        ["Trees left", String(usable)],
        ["Working here", workers.length > 0 ? workers.map((w) => w.name).join(", ") : "Nobody"],
        ["Origin", `${zone.rect.x}, ${zone.rect.y}`],
      ]),
      this.note(this.zoneNote(usable, workers.length)),
    ];

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inspector__danger";
    remove.dataset.removeZone = zone.id;
    remove.textContent = "Remove zone";
    nodes.push(remove);

    return nodes;
  }

  private zoneNote(trees: number, workers: number): string {
    if (trees === 0) return "Cleared. The zone stays; it will apply again if trees grow back.";
    if (workers === 0) return `${trees} tree${trees === 1 ? "" : "s"} waiting. Assign someone as a Lumberjack.`;
    return `${trees} tree${trees === 1 ? "" : "s"} left, ${workers} working.`;
  }

  // -- pieces --------------------------------------------------------------

  private header(title: string, kicker: string): HTMLElement {
    const header = document.createElement("header");

    const group = document.createElement("div");
    const label = document.createElement("p");
    label.className = "inspector__kicker";
    label.textContent = kicker;
    const name = document.createElement("h2");
    name.textContent = title;
    group.append(label, name);

    const close = document.createElement("button");
    close.type = "button";
    close.dataset.close = "";
    close.setAttribute("aria-label", "Deselect");
    close.textContent = "×";

    header.append(group, close);
    return header;
  }

  private summary(rows: [string, string][]): HTMLElement {
    const summary = document.createElement("dl");
    summary.className = "inspector__summary";
    for (const [label, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      summary.append(dt, dd);
    }
    return summary;
  }

  private note(text: string): HTMLElement {
    const note = document.createElement("p");
    note.className = "inspector__note";
    note.textContent = text;
    return note;
  }

  private skillList(citizen: Citizen): HTMLElement {
    const section = document.createElement("section");
    section.className = "inspector__skills";

    const heading = document.createElement("h3");
    heading.textContent = "Skills";
    section.append(heading);

    for (const skill of SKILLS) {
      const level = citizen.skills[skill];
      const row = document.createElement("div");
      row.className = "skill";

      const label = document.createElement("span");
      label.className = "skill__name";
      label.textContent = SKILL_LABELS[skill];

      const meter = document.createElement("span");
      meter.className = "skill__meter";
      meter.style.setProperty("--level", String(level / MAX_SKILL_LEVEL));

      const value = document.createElement("span");
      value.className = "skill__value";
      value.textContent = String(level);

      row.append(label, meter, value);
      section.append(row);
    }
    return section;
  }
}
