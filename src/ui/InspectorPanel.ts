import type { Citizen } from "../world/Citizen";
import type { Tile } from "../world/Grid";
import { bestSkill, MAX_SKILL_LEVEL, SKILLS, worstSkill } from "../world/Skills";
import type { Zone } from "../world/Zone";
import { SKILL_LABELS, TERRAIN_LABELS, TERRAIN_NOTES, ZONE_LABELS } from "./labels";
import type { Selection, SelectionTarget } from "./Selection";

export interface InspectorSources {
  citizen: (id: string) => Citizen | undefined;
  tile: (x: number, y: number) => Tile | undefined;
  occupant: (x: number, y: number) => Citizen | undefined;
  zone: (id: string) => Zone | undefined;
  zoneAt: (x: number, y: number) => Zone | undefined;
  usableTiles: (zone: Zone) => number;
  removeZone: (id: string) => void;
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
      }
    });

    this.selection.events.on("changed", ({ target }) => this.render(target));
  }

  /** Re-render in place — used when the world changes under a live selection. */
  refresh(): void {
    this.render(this.selection.target);
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
    return [
      this.header(citizen.name, "Villager"),
      this.summary([
        ["Best at", SKILL_LABELS[bestSkill(citizen.skills)]],
        ["Worst at", SKILL_LABELS[worstSkill(citizen.skills)]],
        ["Job", "Unassigned"],
        ["Home", "None"],
        ["Tile", `${citizen.tile.x}, ${citizen.tile.y}`],
      ]),
      this.skillList(citizen),
    ];
  }

  private tileView(tile: Tile): HTMLElement[] {
    const occupant = this.sources.occupant(tile.x, tile.y);
    const zone = this.sources.zoneAt(tile.x, tile.y);
    return [
      this.header(TERRAIN_LABELS[tile.terrain], `Tile ${tile.x}, ${tile.y}`),
      this.summary([
        ["Terrain", TERRAIN_LABELS[tile.terrain]],
        ["Passable", tile.terrain === "rock" ? "No" : "Yes"],
        ["Occupant", occupant?.name ?? "None"],
        ["Zone", zone ? ZONE_LABELS[zone.kind] : "None"],
        ["Building", "None"],
      ]),
      this.note(TERRAIN_NOTES[tile.terrain]),
    ];
  }

  private zoneView(zone: Zone): HTMLElement[] {
    const usable = this.sources.usableTiles(zone);
    const nodes: HTMLElement[] = [
      this.header(ZONE_LABELS[zone.kind], "Zone"),
      this.summary([
        ["Area", `${zone.rect.width} × ${zone.rect.height}`],
        ["Tiles", String(zone.tileCount)],
        ["Trees inside", String(usable)],
        ["Assigned", "Nobody"],
        ["Origin", `${zone.rect.x}, ${zone.rect.y}`],
      ]),
      this.note(
        usable === 0
          ? "Nothing to cut here yet. The zone stays; it will apply if trees grow inside it."
          : `${usable} tile${usable === 1 ? "" : "s"} of timber waiting. Nobody is assigned to work it.`
      ),
    ];

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inspector__danger";
    remove.dataset.removeZone = zone.id;
    remove.textContent = "Remove zone";
    nodes.push(remove);

    return nodes;
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
