/** The ground itself. What a tile *is* once everything on it is cleared away. */
export type TerrainKind = "grass" | "dirt" | "sand" | "rock" | "water";

/**
 * What stands on the ground. Separate from terrain because clearing it has to
 * leave something behind: fell a tree and the tile is still grass. The earlier
 * model made "tree" a terrain, which meant the tile *was* the tree and cutting
 * it had nowhere to go.
 */
export type TileFeature = "tree" | null;

export interface Tile {
  readonly x: number;
  readonly y: number;
  readonly terrain: TerrainKind;
  readonly feature: TileFeature;
}

export interface TileCoord {
  readonly x: number;
  readonly y: number;
}

const IMPASSABLE_TERRAIN: ReadonlySet<TerrainKind> = new Set<TerrainKind>(["rock", "water"]);

export class Grid {
  private readonly tiles: Tile[];

  constructor(
    readonly width: number,
    readonly height: number,
    sampleAt: (x: number, y: number) => { terrain: TerrainKind; feature: TileFeature }
  ) {
    this.tiles = new Array<Tile>(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { terrain, feature } = sampleAt(x, y);
        this.tiles[y * width + x] = { x, y, terrain, feature };
      }
    }
  }

  contains(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  at(x: number, y: number): Tile | undefined {
    return this.contains(x, y) ? this.tiles[y * this.width + x] : undefined;
  }

  /** Trees do not block movement — you walk through a wood, you do not walk through a cliff. */
  isWalkable(x: number, y: number): boolean {
    const tile = this.at(x, y);
    return tile !== undefined && !IMPASSABLE_TERRAIN.has(tile.terrain);
  }

  /** Somewhere a villager could stand: walkable and not occupied by a feature. */
  isBuildable(x: number, y: number): boolean {
    const tile = this.at(x, y);
    return tile !== undefined && !IMPASSABLE_TERRAIN.has(tile.terrain) && tile.feature === null;
  }

  forEach(visit: (tile: Tile) => void): void {
    for (const tile of this.tiles) visit(tile);
  }

  /** Replaces a tile's feature in place — felling a tree leaves the ground behind. */
  clearFeature(x: number, y: number): void {
    const tile = this.at(x, y);
    if (!tile || tile.feature === null) return;
    this.tiles[y * this.width + x] = { x, y, terrain: tile.terrain, feature: null };
  }

  randomBuildableTile(random: () => number): TileCoord {
    // Rejection sampling. Fine while open ground is common; if a region ever gets
    // dense enough for this to spin, build an index of buildable tiles instead.
    for (let attempt = 0; attempt < 500; attempt++) {
      const x = Math.floor(random() * this.width);
      const y = Math.floor(random() * this.height);
      if (this.isBuildable(x, y)) return { x, y };
    }
    throw new Error("Region has no buildable tile after 500 samples");
  }
}
