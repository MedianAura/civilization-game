import Phaser from "phaser";
import type { Citizen } from "../world/Citizen";
import { World } from "../world/World";
import type { Selection } from "../ui/Selection";

export const TILE = 28;

const TERRAIN_COLORS: Record<string, number> = {
  grass: 0x2f3d2b,
  rock: 0x3f3f45,
  tree: 0x27502c,
};

const CITIZEN_FILL = 0x9ab6c9;
const HALO_COLOR = 0x8fbc8f;

interface CitizenView {
  readonly halo: Phaser.GameObjects.Rectangle;
}

export class MainScene extends Phaser.Scene {
  private world!: World;
  private selection!: Selection;
  private readonly views = new Map<string, CitizenView>();

  constructor() {
    super("MainScene");
  }

  init(data: { world: World; selection: Selection }): void {
    this.world = data.world;
    this.selection = data.selection;
  }

  create(): void {
    this.drawTerrain();
    for (const citizen of this.world.citizens) {
      this.views.set(citizen.id, this.createCitizenView(citizen));
    }

    // One listener on the scene rather than hit areas per sprite: the click needs
    // to resolve to a *tile* either way, and a miss has to clear the selection.
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.onClick(pointer);
    });

    this.selection.events.on("changed", ({ id, previous }) => {
      if (previous) this.views.get(previous)?.halo.setVisible(false);
      if (id) this.views.get(id)?.halo.setVisible(true);
    });
  }

  private onClick(pointer: Phaser.Input.Pointer): void {
    const tile = { x: Math.floor(pointer.worldX / TILE), y: Math.floor(pointer.worldY / TILE) };
    const citizen = this.world.citizenAt(tile);
    if (citizen) {
      this.selection.toggle(citizen.id);
    } else {
      this.selection.clear();
    }
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

  private createCitizenView(citizen: Citizen): CitizenView {
    const x = (citizen.tile.x + 0.5) * TILE;
    const y = (citizen.tile.y + 0.5) * TILE;

    const halo = this.add
      .rectangle(x, y, TILE + 2, TILE + 2)
      .setStrokeStyle(2, HALO_COLOR)
      .setVisible(false);
    this.add.rectangle(x, y, TILE - 12, TILE - 12, CITIZEN_FILL);
    this.add
      .text(x, y + TILE / 2 - 3, citizen.name, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5, 0);

    return { halo };
  }

  update(_time: number, delta: number): void {
    this.world.update(delta);
  }
}
