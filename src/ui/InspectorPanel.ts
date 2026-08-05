import type { Citizen } from "../world/Citizen";
import type { Tile, TerrainKind } from "../world/Grid";
import { bestSkill, MAX_SKILL_LEVEL, SKILLS, worstSkill, type SkillName } from "../world/Skills";
import type { Selection, SelectionTarget } from "./Selection";

const SKILL_LABELS: Record<SkillName, string> = {
  lumberjacking: "Lumberjacking",
  mining: "Mining",
  building: "Building",
  farming: "Farming",
  cooking: "Cooking",
};

const TERRAIN_LABELS: Record<TerrainKind, string> = {
  grass: "Grass",
  rock: "Rock",
  tree: "Forest",
};

/** What each kind of tile is worth looking at for. Honest about the empty ones. */
const TERRAIN_NOTES: Record<TerrainKind, string> = {
  grass: "Open ground. Buildable.",
  rock: "Impassable. Stone here.",
  tree: "Timber here. Passable once cleared.",
};

export interface InspectorSources {
  citizen: (id: string) => Citizen | undefined;
  tile: (x: number, y: number) => Tile | undefined;
  occupant: (x: number, y: number) => Citizen | undefined;
}

/**
 * The inspector. A DOM overlay rather than Phaser text objects, per CLAUDE.md.
 *
 * One panel, one job: say what the player just clicked. It dispatches on the
 * selection's kind, so a zone or a building later becomes another branch here
 * rather than another floating window.
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
      if ((event.target as HTMLElement).closest("[data-close]")) this.selection.clear();
    });

    this.selection.events.on("changed", ({ target }) => this.render(target));
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
    return [
      this.header(TERRAIN_LABELS[tile.terrain], `Tile ${tile.x}, ${tile.y}`),
      this.summary([
        ["Terrain", TERRAIN_LABELS[tile.terrain]],
        ["Passable", tile.terrain === "rock" ? "No" : "Yes"],
        ["Occupant", occupant?.name ?? "None"],
        ["Zone", "None"],
        ["Building", "None"],
      ]),
      this.note(TERRAIN_NOTES[tile.terrain]),
    ];
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
