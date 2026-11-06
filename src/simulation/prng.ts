/**
 * Seedable deterministic PRNG (Mulberry32 and SplitMix32)
 */

export class PRNG {
  private state: number;

  constructor(seed = 133742) {
    this.state = seed >>> 0;
  }

  // Returns float in [0, 1)
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns integer in [min, max] inclusive
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Returns boolean with probability p
  chance(p: number): boolean {
    return this.next() < p;
  }

  // Pick random element from array
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Normally distributed random number (Box-Muller)
  gaussian(mean = 0, stdev = 1): number {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdev + mean;
  }
}

export const defaultPrng = new PRNG(428901);
