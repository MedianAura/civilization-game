import Phaser from "phaser";
import type { Citizen } from "../world/Citizen";
import { World } from "../world/World";
import type { Selection, SelectionTarget } from "../ui/Selection";

export const TILE = 28;

const TERRAIN_COLORS: Record<string, number> = {
  grass: 0x2f3d2b,
  rock: 0x3f3f45,
  tree: 0x27502c,
};

const CITIZEN_FILL = 0x9ab6c9;
const HIGHLIGHT_CITIZEN = 0x8fbc8f;
const HIGHLIGHT_TILE = 0xc9c07a;

export class MainScene extends Phaser.Scene {
  private world!: World;
  private selection!: Selection;
  private highlight!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("MainScene");
  }

  init(data: { world: World; selection: Selection }): void {
    this.world = data.world;
    this.selection = data.selection;
  }

  create(): void {
    this.drawTerrain();
    for (const citizen of this.world.citizens) this.drawCitizen(citizen);

    // A single reusable marker instead of one halo per citizen: everything the
    // player can select occupies exactly one tile, so there is only ever one
    // rectangle to move.
    this.highlight = this.add
      .rectangle(0, 0, TILE + 2, TILE + 2)
      .setStrokeStyle(2, HIGHLIGHT_CITIZEN)
      .setVisible(false);

    // One listener on the scene rather than hit areas per sprite: the click has
    // to resolve to a tile either way, and a miss is a meaningful answer now
    // rather than a no-op.
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.onClick(pointer);
    });

    this.selection.events.on("changed", ({ target }) => this.moveHighlight(target));
  }

  private onClick(pointer: Phaser.Input.Pointer): void {
    // Phaser listens on the window and clamps the pointer to the canvas, so a
    // click in the letterboxing beside a FIT-scaled board arrives as a click on
    // the nearest edge tile. A bounds check on worldX/worldY can never catch it
    // — by then the coordinates have already been rounded onto the board. The
    // DOM target is the only thing that still knows where the mouse really was.
    if (pointer.event.target !== this.game.canvas) {
      this.selection.clear();
      return;
    }

    const x = Math.floor(pointer.worldX / TILE);
    const y = Math.floor(pointer.worldY / TILE);
    if (!this.world.grid.contains(x, y)) {
      this.selection.clear();
      return;
    }

    // A citizen standing on a tile wins the click; their panel already reports
    // which tile they are on, so nothing becomes unreachable.
    const citizen = this.world.citizenAt({ x, y });
    this.selection.toggle(citizen ? { kind: "citizen", id: citizen.id } : { kind: "tile", x, y });
  }

  private moveHighlight(target: SelectionTarget | null): void {
    if (!target) {
      this.highlight.setVisible(false);
      return;
    }

    const tile = target.kind === "citizen" ? this.world.citizenById(target.id)?.tile : target;
    if (!tile) {
      this.highlight.setVisible(false);
      return;
    }

    this.highlight
      .setPosition((tile.x + 0.5) * TILE, (tile.y + 0.5) * TILE)
      .setStrokeStyle(2, target.kind === "citizen" ? HIGHLIGHT_CITIZEN : HIGHLIGHT_TILE)
      .setVisible(true);
  }

  private drawTerrain(): void {
    // One Graphics object rather than 700 Rectangles: a single draw call, and the
    // thing a Tiled TilemapLayer will replace without the simulation noticing.
    const graphics = this.add.graphics();
    this.world.grid.forEach((tile) => {
      graphics.fillStyle(TERRAIN_COLORS[tile.terrain] ?? 0xff00ff, 1);
      graphics.fillRect(tile.x * TILE, tile.y * TILE, TILE - 1, TILE - 1);
    });
  }

  private drawCitizen(citizen: Citizen): void {
    const x = (citizen.tile.x + 0.5) * TILE;
    const y = (citizen.tile.y + 0.5) * TILE;

    this.add.rectangle(x, y, TILE - 12, TILE - 12, CITIZEN_FILL);
    this.add
      .text(x, y + TILE / 2 - 3, citizen.name, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5, 0);
  }

  update(_time: number, delta: number): void {
    this.world.update(delta);
  }
}
