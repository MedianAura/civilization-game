export type TerrainKind = "grass" | "rock" | "berry";

export interface Tile {
  readonly x: number;
  readonly y: number;
  readonly terrain: TerrainKind;
}

export interface TileCoord {
  readonly x: number;
  readonly y: number;
}

const WALKABLE: ReadonlySet<TerrainKind> = new Set<TerrainKind>(["grass", "berry"]);

/**
 * Throwaway terrain: rectangles today, a Tiled tilemap later. The point of this
 * class is that nothing above it knows which one it is — if swapping the renderer
 * forces a change in here, the three-layer split was a lie.
 */
export class Grid {
  private readonly tiles: Tile[];

  constructor(
    readonly width: number,
    readonly height: number,
    terrainAt: (x: number, y: number) => TerrainKind
  ) {
    this.tiles = new Array<Tile>(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.tiles[y * width + x] = { x, y, terrain: terrainAt(x, y) };
      }
    }
  }

  contains(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  at(x: number, y: number): Tile | undefined {
    return this.contains(x, y) ? this.tiles[y * this.width + x] : undefined;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.at(x, y);
    return tile !== undefined && WALKABLE.has(tile.terrain);
  }

  forEach(visit: (tile: Tile) => void): void {
    for (const tile of this.tiles) visit(tile);
  }

  /** Closest tile matching `predicate` by Manhattan distance, or undefined. */
  nearestTile(from: TileCoord, predicate: (tile: Tile) => boolean): Tile | undefined {
    let best: Tile | undefined;
    let bestDistance = Infinity;
    for (const tile of this.tiles) {
      if (!predicate(tile)) continue;
      const distance = Math.abs(tile.x - from.x) + Math.abs(tile.y - from.y);
      if (distance < bestDistance) {
        best = tile;
        bestDistance = distance;
      }
    }
    return best;
  }

  randomWalkableTile(random: () => number): TileCoord {
    // Rejection sampling. Fine while rock coverage is a few percent; if the map
    // ever gets dense enough for this to spin, build the walkable index instead.
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = Math.floor(random() * this.width);
      const y = Math.floor(random() * this.height);
      if (this.isWalkable(x, y)) return { x, y };
    }
    throw new Error("Grid has no reachable walkable tile after 200 samples");
  }
}
