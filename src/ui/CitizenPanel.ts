import type { Citizen } from "../world/Citizen";
import { bestSkill, MAX_SKILL_LEVEL, SKILLS, worstSkill, type SkillName } from "../world/Skills";
import type { Selection } from "./Selection";

const SKILL_LABELS: Record<SkillName, string> = {
  lumberjacking: "Lumberjacking",
  mining: "Mining",
  building: "Building",
  farming: "Farming",
  cooking: "Cooking",
};

/**
 * The inspector. A DOM overlay rather than Phaser text objects, per CLAUDE.md —
 * the first HUD broke that rule and this panel is what forces the real UI layer
 * to exist.
 *
 * Read-only on purpose. It grows into job assignment, current work and housing;
 * right now its job is to prove that clicking a villager tells you who they are.
 */
export class CitizenPanel {
  private readonly root: HTMLElement;

  constructor(
    mount: HTMLElement,
    private readonly selection: Selection,
    private readonly resolve: (id: string) => Citizen | undefined
  ) {
    this.root = document.createElement("aside");
    this.root.className = "citizen-panel";
    this.root.hidden = true;
    mount.appendChild(this.root);

    this.root.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("[data-close]")) this.selection.clear();
    });

    this.selection.events.on("changed", ({ id }) => this.render(id));
  }

  private render(id: string | null): void {
    const citizen = id === null ? undefined : this.resolve(id);
    if (!citizen) {
      this.root.hidden = true;
      this.root.replaceChildren();
      return;
    }

    this.root.hidden = false;
    this.root.replaceChildren();
    this.root.append(this.header(citizen), this.summary(citizen), this.skillList(citizen));
  }

  private header(citizen: Citizen): HTMLElement {
    const header = document.createElement("header");

    const name = document.createElement("h2");
    name.textContent = citizen.name;

    const close = document.createElement("button");
    close.type = "button";
    close.dataset.close = "";
    close.setAttribute("aria-label", "Deselect");
    close.textContent = "×";

    header.append(name, close);
    return header;
  }

  private summary(citizen: Citizen): HTMLElement {
    const summary = document.createElement("dl");
    summary.className = "citizen-panel__summary";

    const rows: [string, string][] = [
      ["Best at", SKILL_LABELS[bestSkill(citizen.skills)]],
      ["Worst at", SKILL_LABELS[worstSkill(citizen.skills)]],
      ["Job", "Unassigned"],
      ["Home", "None"],
      ["Tile", `${citizen.tile.x}, ${citizen.tile.y}`],
    ];

    for (const [label, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      summary.append(dt, dd);
    }
    return summary;
  }

  private skillList(citizen: Citizen): HTMLElement {
    const section = document.createElement("section");
    section.className = "citizen-panel__skills";

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
