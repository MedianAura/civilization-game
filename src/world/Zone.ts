import type { TileCoord } from "./Grid";

export type ZoneKind = "woodcutting";

export interface ZoneRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A standing instruction attached to an area: "gather wood here". Unlike a
 * selection, a zone belongs to the colony rather than to whoever is holding the
 * mouse — it survives the click that made it and would be in a save file.
 *
 * The rectangle is stored whole, including tiles the job cannot use. A
 * woodcutting zone drawn across bare grass is not an error; it just has nothing
 * to work on yet, and it will once something grows there.
 */
export class Zone {
  readonly id: string = crypto.randomUUID();

  constructor(
    readonly kind: ZoneKind,
    readonly rect: ZoneRect
  ) {}

  contains(tile: TileCoord): boolean {
    return (
      tile.x >= this.rect.x &&
      tile.y >= this.rect.y &&
      tile.x < this.rect.x + this.rect.width &&
      tile.y < this.rect.y + this.rect.height
    );
  }

  get tileCount(): number {
    return this.rect.width * this.rect.height;
  }

  forEachTile(visit: (tile: TileCoord) => void): void {
    for (let y = this.rect.y; y < this.rect.y + this.rect.height; y++) {
      for (let x = this.rect.x; x < this.rect.x + this.rect.width; x++) {
        visit({ x, y });
      }
    }
  }
}

/** Normalises a drag into a rectangle, whichever corner it started from. */
export function rectFromDrag(a: TileCoord, b: TileCoord): ZoneRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.abs(a.x - b.x) + 1, height: Math.abs(a.y - b.y) + 1 };
}
