/**
 * Linearly interpolates between two values.
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0.0 to 1.0)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Simple 1D Perlin Noise implementation.
 */
export class PerlinNoise {
  private p: number[] = [];
  private permutation: number[] = [];

  constructor(seed?: number) {
    // Basic pseudo-random number generator based on seed
    const random = seed !== undefined ? this.seededRandom(seed) : Math.random;

    // Initialize permutation table with values 0-255
    this.p = Array.from({ length: 256 }, (_, i) => i);

    // Shuffle the permutation table using Fisher-Yates algorithm
    for (let i = this.p.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]]; // Swap
    }

    // Duplicate the permutation table to avoid buffer overflow
    this.permutation = this.p.concat(this.p);
  }

  // Simple LCG seeded random number generator
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (1103515245 * state + 12345) % 2147483648;
      return state / 2147483648;
    };
  }

  // Fade function (improves noise quality)
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Gradient function (calculates dot product)
  private grad(hash: number, x: number): number {
    // Simple gradient: just return x or -x based on hash bit
    return (hash & 1) === 0 ? x : -x;
  }

  /**
   * Generates 1D Perlin noise value for a given x coordinate.
   * @param x Input coordinate
   * @returns Noise value between -1.0 and 1.0 (approximately)
   */
  noise(x: number): number {
    const X = Math.floor(x) & 255; // Integer part, wrapped to 0-255
    x -= Math.floor(x);          // Fractional part

    const u = this.fade(x); // Compute fade curve for x

    // Hash coordinates of the square corners
    const a = this.permutation[X];
    const b = this.permutation[X + 1];

    // Add blended results from grid corners
    const noise = lerp(
      this.grad(this.permutation[a], x),
      this.grad(this.permutation[b], x - 1),
      u
    );

    // Scale the result slightly (empirical adjustment)
    // Perlin noise theoretical range is [-sqrt(N)/2, sqrt(N)/2], for N=1, it's [-0.5, 0.5].
    // We scale by 2 to approximate the common [-1, 1] range, though extremes are rare.
    return noise * 2;
  }
} 