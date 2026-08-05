/**
 * Deterministic value noise. No dependency, no WebGL, ~80 lines — the whole job
 * is "give me a smooth field between 0 and 1 that is the same every time for the
 * same seed", and a library would be more surface than that is worth.
 *
 * Seeded on purpose: a region has to regenerate identically, or a saved game
 * cannot describe where it was.
 */

/** mulberry32 — small, fast, good enough for terrain. Not for anything secret. */
export function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smoothstep — the curve that turns a grid of random values into rolling terrain. */
function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * A lattice of random values, sampled with smooth interpolation between them.
 * Cheaper and blurrier than simplex noise, which is exactly right for deciding
 * "is this area forest or meadow" — nobody can tell the difference at biome scale.
 */
export class ValueNoise {
  private readonly lattice: Float32Array;

  constructor(
    private readonly size: number,
    seed: number
  ) {
    const random = makeRandom(seed);
    this.lattice = new Float32Array(size * size);
    for (let i = 0; i < this.lattice.length; i++) this.lattice[i] = random();
  }

  /** Wraps at the lattice edge, so sampling never runs out of field. */
  private at(x: number, y: number): number {
    const ix = ((x % this.size) + this.size) % this.size;
    const iy = ((y % this.size) + this.size) % this.size;
    return this.lattice[iy * this.size + ix] ?? 0;
  }

  sample(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = fade(x - x0);
    const ty = fade(y - y0);

    const top = lerp(this.at(x0, y0), this.at(x0 + 1, y0), tx);
    const bottom = lerp(this.at(x0, y0 + 1), this.at(x0 + 1, y0 + 1), tx);
    return lerp(top, bottom, ty);
  }

  /**
   * Fractal Brownian motion: the same noise at doubling frequencies and halving
   * amplitudes, summed. One octave is featureless blobs; four gives a coastline
   * that reads as a coastline.
   */
  fbm(x: number, y: number, octaves = 4, scale = 0.05): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let total = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.sample(x * frequency, y * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / total;
  }
}
