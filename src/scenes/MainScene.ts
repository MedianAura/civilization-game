import Phaser from "phaser";
import type { Citizen } from "../world/Citizen";
import { World } from "../world/World";

const TILE = 28;

const TERRAIN_COLORS: Record<string, number> = {
  grass: 0x2f3d2b,
  rock: 0x3f3f45,
  berry: 0x6d2742,
};

const ACTIVITY_COLORS: Record<string, number> = {
  idle: 0x8a8a8a,
  wandering: 0x6fa8dc,
  seekingFood: 0xe0913a,
  eating: 0x7fc47f,
};

interface CitizenView {
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly hungerBar: Phaser.GameObjects.Rectangle;
}

export class MainScene extends Phaser.Scene {
  private world!: World;
  private readonly views = new Map<string, CitizenView>();
  private hud!: Phaser.GameObjects.Text;
  private journal!: Phaser.GameObjects.Text;
  private readonly log: string[] = [];

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.world = new World();
    this.drawTerrain();

    for (const citizen of this.world.citizens) {
      this.views.set(citizen.id, this.createCitizenView(citizen));
    }

    const boardHeight = this.world.grid.height * TILE;
    this.hud = this.add.text(8, boardHeight + 8, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9fb89b",
    });
    this.journal = this.add.text(8, boardHeight + 28, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#6a7a68",
      lineSpacing: 2,
    });

    this.subscribe();
  }

  /**
   * Everything below reads world state; nothing writes it. The only channel back
   * into the simulation is player input, which does not exist yet.
   */
  private subscribe(): void {
    const { events } = this.world;

    events.on("citizen:activityChanged", ({ id, from, to, hunger }) => {
      const name = this.world.citizens.find((c) => c.id === id)?.name ?? "?";
      this.note(`${name}: ${from} → ${to} (hunger ${Math.round(hunger)})`);
    });

    events.on("citizen:ate", ({ id }) => {
      const name = this.world.citizens.find((c) => c.id === id)?.name ?? "?";
      this.note(`${name} ate.`);
    });

    events.on("citizen:pathAbandoned", ({ id }) => {
      const name = this.world.citizens.find((c) => c.id === id)?.name ?? "?";
      this.note(`${name} gave up — greedy step blocked.`);
    });
  }

  private note(line: string): void {
    this.log.unshift(line);
    if (this.log.length > 7) this.log.pop();
    this.journal.setText(this.log.join("\n"));
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
    const body = this.add.rectangle(0, 0, TILE - 12, TILE - 12, ACTIVITY_COLORS.idle);
    const hungerBar = this.add.rectangle(0, -TILE / 2, TILE - 8, 3, 0xcc5555).setOrigin(0.5, 0.5);
    const label = this.add
      .text(0, TILE / 2 - 2, citizen.name, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5, 0);

    const container = this.add.container(0, 0, [hungerBar, body, label]);
    return { container, body, hungerBar };
  }

  update(_time: number, delta: number): void {
    this.world.update(delta);

    for (const citizen of this.world.citizens) {
      const view = this.views.get(citizen.id);
      if (!view) continue;

      view.container.setPosition((citizen.x + 0.5) * TILE, (citizen.y + 0.5) * TILE);
      view.body.setFillStyle(ACTIVITY_COLORS[citizen.activity] ?? 0xffffff);

      const hunger01 = Math.min(citizen.hunger, 100) / 100;
      view.hungerBar.setScale(hunger01, 1);
      view.hungerBar.setFillStyle(citizen.isHungry ? 0xd05050 : 0x707070);
    }

    const slowest = this.world.citizens.reduce((a, b) => (a.speed <= b.speed ? a : b));
    this.hud.setText(
      `tick ${this.world.clock.tickCount}  ·  ${this.world.citizens.length} citizens  ·  ` +
        `slowest: ${slowest.name} at ${slowest.speed.toFixed(2)} tiles/s (hunger ${Math.round(slowest.hunger)})`
    );
  }
}
