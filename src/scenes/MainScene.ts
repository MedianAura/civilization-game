import Phaser from "phaser";
import type { Citizen } from "../world/Citizen";
import type { TileCoord } from "../world/Grid";
import { World } from "../world/World";
import { rectFromDrag, type Zone } from "../world/Zone";
import type { Selection, SelectionTarget } from "../ui/Selection";
import type { ToolState } from "../ui/Tool";

export const TILE = 28;

const TERRAIN_COLORS: Record<string, number> = {
  grass: 0x2f3d2b,
  rock: 0x3f3f45,
  tree: 0x27502c,
};

const CITIZEN_FILL = 0x9ab6c9;
const HIGHLIGHT_CITIZEN = 0x8fbc8f;
const HIGHLIGHT_TILE = 0xc9c07a;
const ZONE_FILL = 0xc9a227;

export class MainScene extends Phaser.Scene {
  private world!: World;
  private selection!: Selection;
  private tools!: ToolState;

  private highlight!: Phaser.GameObjects.Rectangle;
  private zoneLayer!: Phaser.GameObjects.Graphics;
  private dragPreview!: Phaser.GameObjects.Graphics;
  private dragStart: TileCoord | null = null;

  constructor() {
    super("MainScene");
  }

  init(data: { world: World; selection: Selection; tools: ToolState }): void {
    this.world = data.world;
    this.selection = data.selection;
    this.tools = data.tools;
  }

  create(): void {
    this.drawTerrain();

    // Zones sit above terrain but below citizens: they are ground markings, and
    // a villager standing in one must stay visible.
    this.zoneLayer = this.add.graphics();
    for (const citizen of this.world.citizens) this.drawCitizen(citizen);
    this.dragPreview = this.add.graphics();

    // A single reusable marker instead of one halo per citizen: everything the
    // player can select occupies a rectangle, so there is only one to move.
    this.highlight = this.add
      .rectangle(0, 0, TILE + 2, TILE + 2)
      .setStrokeStyle(2, HIGHLIGHT_CITIZEN)
      .setVisible(false);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => this.onPointerUp(p));

    this.selection.events.on("changed", ({ target }) => this.moveHighlight(target));
    this.world.events.on("zone:added", () => this.drawZones());
    this.world.events.on("zone:removed", () => this.drawZones());
    this.tools.events.on("changed", () => this.cancelDrag());
  }

  // -- input ---------------------------------------------------------------

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.tools.current.kind !== "zone") return;
    const tile = this.tileUnder(pointer);
    if (tile) this.dragStart = tile;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;
    const tile = this.tileUnder(pointer) ?? this.dragStart;
    this.drawDragPreview(rectFromDrag(this.dragStart, tile));
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const tool = this.tools.current;

    if (this.dragStart && tool.kind === "zone") {
      const end = this.tileUnder(pointer) ?? this.dragStart;
      const zone = this.world.addZone(tool.zone, rectFromDrag(this.dragStart, end));
      this.cancelDrag();
      // Select what was just drawn: the player should see what they made without
      // having to click it again.
      this.selection.select({ kind: "zone", id: zone.id });
      return;
    }

    this.onInspectClick(pointer);
  }

  private onInspectClick(pointer: Phaser.Input.Pointer): void {
    // Phaser listens on the window and clamps the pointer onto the canvas, so a
    // click in the letterboxing beside a FIT-scaled board arrives as a click on
    // the nearest edge tile. A bounds check on worldX/worldY can never see it —
    // by then the coordinates have already been rounded onto the board.
    const tile = this.tileUnder(pointer);
    if (!tile) {
      this.selection.clear();
      return;
    }

    // Precedence: a villager wins over the zone they stand in, which wins over
    // the bare tile. Without a way through, the layers underneath become
    // unreachable — the tile panel's own "Zone" row could only ever read "None",
    // because reaching a tile inside a zone was impossible. Alt drills down.
    const drillDown = (pointer.event as PointerEvent).altKey;
    if (!drillDown) {
      const citizen = this.world.citizenAt(tile);
      if (citizen) {
        this.selection.toggle({ kind: "citizen", id: citizen.id });
        return;
      }
      const zone = this.world.zoneAt(tile);
      if (zone) {
        this.selection.toggle({ kind: "zone", id: zone.id });
        return;
      }
    }
    this.selection.toggle({ kind: "tile", ...tile });
  }

  private tileUnder(pointer: Phaser.Input.Pointer): TileCoord | null {
    if (pointer.event.target !== this.game.canvas) return null;
    const x = Math.floor(pointer.worldX / TILE);
    const y = Math.floor(pointer.worldY / TILE);
    return this.world.grid.contains(x, y) ? { x, y } : null;
  }

  private cancelDrag(): void {
    this.dragStart = null;
    this.dragPreview.clear();
  }

  // -- drawing -------------------------------------------------------------

  private drawDragPreview(rect: { x: number; y: number; width: number; height: number }): void {
    this.dragPreview.clear();
    this.dragPreview.fillStyle(ZONE_FILL, 0.22);
    this.dragPreview.fillRect(rect.x * TILE, rect.y * TILE, rect.width * TILE, rect.height * TILE);
    this.dragPreview.lineStyle(1, ZONE_FILL, 0.9);
    this.dragPreview.strokeRect(rect.x * TILE, rect.y * TILE, rect.width * TILE, rect.height * TILE);
  }

  private drawZones(): void {
    this.zoneLayer.clear();
    for (const zone of this.world.zones) this.drawZone(zone);
  }

  private drawZone(zone: Zone): void {
    const { x, y, width, height } = zone.rect;
    this.zoneLayer.fillStyle(ZONE_FILL, 0.16);
    this.zoneLayer.fillRect(x * TILE, y * TILE, width * TILE, height * TILE);
    this.zoneLayer.lineStyle(1, ZONE_FILL, 0.55);
    this.zoneLayer.strokeRect(x * TILE, y * TILE, width * TILE, height * TILE);
  }

  private moveHighlight(target: SelectionTarget | null): void {
    const rect = this.highlightRect(target);
    if (!rect) {
      this.highlight.setVisible(false);
      return;
    }
    this.highlight
      .setPosition(rect.cx, rect.cy)
      .setSize(rect.w, rect.h)
      .setStrokeStyle(2, target?.kind === "citizen" ? HIGHLIGHT_CITIZEN : HIGHLIGHT_TILE)
      .setVisible(true);
  }

  private highlightRect(target: SelectionTarget | null): { cx: number; cy: number; w: number; h: number } | null {
    if (!target) return null;

    if (target.kind === "zone") {
      const zone = this.world.zoneById(target.id);
      if (!zone) return null;
      const { x, y, width, height } = zone.rect;
      return {
        cx: (x + width / 2) * TILE,
        cy: (y + height / 2) * TILE,
        w: width * TILE + 2,
        h: height * TILE + 2,
      };
    }

    const tile = target.kind === "citizen" ? this.world.citizenById(target.id)?.tile : target;
    if (!tile) return null;
    return { cx: (tile.x + 0.5) * TILE, cy: (tile.y + 0.5) * TILE, w: TILE + 2, h: TILE + 2 };
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
