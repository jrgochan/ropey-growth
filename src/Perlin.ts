/***************************************************
 * perlin.ts
 * 
 * Implements 2D and 3D Perlin noise for natural-looking patterns
 ***************************************************/

export class Perlin {
  private perm: Uint8Array;
  private p: Uint8Array;

  constructor() {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);

    // Fill p with [0..255]
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    // Shuffle p
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(Math.random() * 256);
      const tmp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = tmp;
    }
    // Extend
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  private fade(t: number): number {
    return ((6 * t - 15) * t + 10) * t * t * t;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number = 0): number {
    // Use more bits from the hash to increase variation
    const h = hash & 15;

    // For 2D noise
    if (z === 0) {
      // Use different gradient vectors based on hash
      switch (h & 7) {
        case 0:
          return x + y;
        case 1:
          return -x + y;
        case 2:
          return x - y;
        case 3:
          return -x - y;
        case 4:
          return x + y * 0.5;
        case 5:
          return -x * 0.5 + y;
        case 6:
          return x * 0.5 - y;
        case 7:
          return -x - y * 0.5;
        default:
          return 0; // Should never happen
      }
    } 
    // For 3D noise
    else {
      // Convert hash to a unit vector in 3D space
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = this.perm[this.perm[X + 1] + Y + 1];
    const topLeft = this.perm[this.perm[X] + Y + 1];
    const bottomRight = this.perm[this.perm[X + 1] + Y];
    const bottomLeft = this.perm[this.perm[X] + Y];

    const u = this.fade(xf);
    const v = this.fade(yf);

    const x1 = this.lerp(
      this.grad(bottomLeft, xf, yf),
      this.grad(bottomRight, xf - 1, yf),
      u,
    );
    const x2 = this.lerp(
      this.grad(topLeft, xf, yf - 1),
      this.grad(topRight, xf - 1, yf - 1),
      u,
    );

    return this.lerp(x1, x2, v);
  }

  /**
   * Generates 3D Perlin noise at the given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @param z Z coordinate
   * @returns Noise value between -1 and 1
   */
  public noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    // Hash coordinates of the 8 cube corners
    const aaa = this.perm[this.perm[this.perm[X] + Y] + Z];
    const aba = this.perm[this.perm[this.perm[X] + Y + 1] + Z];
    const aab = this.perm[this.perm[this.perm[X] + Y] + Z + 1];
    const abb = this.perm[this.perm[this.perm[X] + Y + 1] + Z + 1];
    const baa = this.perm[this.perm[this.perm[X + 1] + Y] + Z];
    const bba = this.perm[this.perm[this.perm[X + 1] + Y + 1] + Z];
    const bab = this.perm[this.perm[this.perm[X + 1] + Y] + Z + 1];
    const bbb = this.perm[this.perm[this.perm[X + 1] + Y + 1] + Z + 1];

    // Gradients at the 8 corners of the unit cube
    const g1 = this.grad(aaa, xf, yf, zf);
    const g2 = this.grad(baa, xf - 1, yf, zf);
    const g3 = this.grad(aba, xf, yf - 1, zf);
    const g4 = this.grad(bba, xf - 1, yf - 1, zf);
    const g5 = this.grad(aab, xf, yf, zf - 1);
    const g6 = this.grad(bab, xf - 1, yf, zf - 1);
    const g7 = this.grad(abb, xf, yf - 1, zf - 1);
    const g8 = this.grad(bbb, xf - 1, yf - 1, zf - 1);

    // Interpolate along x axis
    const x1 = this.lerp(g1, g2, u);
    const x2 = this.lerp(g3, g4, u);
    const x3 = this.lerp(g5, g6, u);
    const x4 = this.lerp(g7, g8, u);

    // Interpolate along y axis
    const y1 = this.lerp(x1, x2, v);
    const y2 = this.lerp(x3, x4, v);

    // Interpolate along z axis
    return this.lerp(y1, y2, w);
  }
}
