/***************************************************
 * perlin.ts
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

  private grad(hash: number, x: number, y: number): number {
    switch (hash & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      default:
        return 0;
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
      this.grad(this.perm[bottomLeft], xf, yf),
      this.grad(this.perm[bottomRight], xf - 1, yf),
      u,
    );
    const x2 = this.lerp(
      this.grad(this.perm[topLeft], xf, yf - 1),
      this.grad(this.perm[topRight], xf - 1, yf - 1),
      u,
    );

    return this.lerp(x1, x2, v);
  }
}
