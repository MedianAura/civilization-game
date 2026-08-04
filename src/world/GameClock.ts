/**
 * Fixed-step clock, deliberately decoupled from the render loop.
 *
 * Phaser hands us a wall-clock delta that swings with the display refresh rate,
 * background throttling and GC pauses. The simulation must not: a citizen has to
 * starve at the same rate on a 60 Hz panel and a 144 Hz one. So we accumulate
 * real time and pay it out in whole ticks of a constant size.
 */
export const TICKS_PER_SECOND = 20;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

/** Above this, we drop the backlog instead of running a catch-up storm. */
const MAX_CATCHUP_MS = 250;

export class GameClock {
  private accumulator = 0;
  private ticks = 0;

  get tickCount(): number {
    return this.ticks;
  }

  /** Seconds of simulated time per tick — the unit every rate in the sim uses. */
  get tickSeconds(): number {
    return TICK_MS / 1000;
  }

  /**
   * Feed real elapsed milliseconds; runs `onTick` zero or more times.
   * Returns how many ticks fired, which is what the render layer interpolates against.
   */
  advance(deltaMs: number, onTick: (tickIndex: number) => void): number {
    // A tab that was hidden for a minute comes back with a huge delta. Simulating
    // it honestly would freeze the frame; skipping it is the lesser lie.
    this.accumulator += Math.min(deltaMs, MAX_CATCHUP_MS);

    let fired = 0;
    while (this.accumulator >= TICK_MS) {
      this.accumulator -= TICK_MS;
      this.ticks += 1;
      fired += 1;
      onTick(this.ticks);
    }
    return fired;
  }
}
