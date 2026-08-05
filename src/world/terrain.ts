import { makeRandom, ValueNoise } from "./noise";
import type { TerrainKind, TileFeature } from "./Grid";

export interface TerrainSample {
  readonly terrain: TerrainKind;
  readonly feature: TileFeature;
}

export interface RegionSeed {
  readonly seed: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Thresholds on two fields. Elevation carves mountains and lake basins; moisture
 * decides whether the ground between them grows trees or dries into dirt.
 *
 * This is the standard two-channel recipe and it is worth naming why: the old
 * generator rolled each tile independently, which cannot produce a forest — only
 * scattered trees that occasionally land beside each other. Coherence is the
 * whole difference between terrain and static.
 */
const WATER_LEVEL = 0.34;
const SHORE_LEVEL = 0.375;
const MOUNTAIN_LEVEL = 0.7;
const DRY_LEVEL = 0.36;

/** Moisture above this starts growing trees; density ramps up from there. */
const TREELINE = 0.45;

export function generateRegion({ seed, width, height }: RegionSeed): (x: number, y: number) => TerrainSample {
  const elevation = new ValueNoise(256, seed);
  const moisture = new ValueNoise(256, seed ^ 0x9e3779b9);
  const scatter = makeRandom(seed ^ 0x85ebca6b);

  // Pre-roll per-tile jitter so tree placement is deterministic but not a grid.
  const jitter = new Float32Array(width * height);
  for (let i = 0; i < jitter.length; i++) jitter[i] = scatter();

  return (x, y) => {
    const e = elevation.fbm(x, y, 4, 0.028);
    const m = moisture.fbm(x, y, 3, 0.045);

    if (e > MOUNTAIN_LEVEL) return { terrain: "rock", feature: null };
    if (e < WATER_LEVEL) return { terrain: "water", feature: null };
    if (e < SHORE_LEVEL) return { terrain: "sand", feature: null };
    if (m < DRY_LEVEL) return { terrain: "dirt", feature: null };

    // Trees thin out toward the treeline instead of stopping at a hard edge, so
    // a forest has a ragged border rather than a rectangle of foliage.
    if (m > TREELINE) {
      const density = Math.min(1, (m - TREELINE) / 0.22);
      if ((jitter[y * width + x] ?? 1) < density * 0.8) {
        return { terrain: "grass", feature: "tree" };
      }
    }
    return { terrain: "grass", feature: null };
  };
}
