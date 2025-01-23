/***************************************************
 * TypeScript Implementation of Perlin-Driven Mycelium
 * with High Density Branching and Detailed Comments
 ***************************************************/

//--------------------------------------
// 1) Perlin Class for Smooth Noise
//--------------------------------------

/**
 * Perlin class generates smooth Perlin noise in 2D.
 * 
 * - It uses a permutation array to produce predictable random gradients.
 * - noise2D(x, y) returns a value in approximately [-1..1].
 */
class Perlin {
  /** A base array of permuted values [0..255], repeated. */
  private perm: Uint8Array; 

  /** A temporary array used to shuffle and generate perm. */
  private p: Uint8Array;

  constructor() {
    // p is 256 in length; we'll shuffle it, then copy it into perm (512).
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);

    // Fill array p with 0..255
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Shuffle array p
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(Math.random() * 256);
      const tmp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = tmp;
    }

    // Extend the permutation array so we can use perm[x + 1], etc. safely.
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  /**
   * Smooth fade function (6t^5 - 15t^4 + 10t^3)
   * Provides smoother transitions for the noise.
   */
  private fade(t: number): number {
    return ((6 * t - 15) * t + 10) * t * t * t;
  }

  /**
   * Linear interpolation between values a and b by factor t.
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * grad calculates a gradient value from a hash and x,y coordinates.
   */
  private grad(hash: number, x: number, y: number): number {
    switch (hash & 3) {
      case 0: return  x + y;
      case 1: return -x + y;
      case 2: return  x - y;
      case 3: return -x - y;
      default: return 0; // unreachable
    }
  }

  /**
   * noise2D returns a perlin noise value in [-1..1] for the given (x,y).
   */
  public noise2D(x: number, y: number): number {
    // Cell coordinates in integer form:
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Local coordinates within the cell:
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // Calculate corner hashes from our permutation table:
    const topRight =    this.perm[this.perm[X + 1] + Y + 1];
    const topLeft =     this.perm[this.perm[X] + Y + 1];
    const bottomRight = this.perm[this.perm[X + 1] + Y];
    const bottomLeft =  this.perm[this.perm[X] + Y];

    // Smooth fade curves for x and y:
    const u = this.fade(xf);
    const v = this.fade(yf);

    // Interpolate along x for the bottom corners:
    const x1 = this.lerp(
      this.grad(this.perm[bottomLeft],  xf,      yf),
      this.grad(this.perm[bottomRight], xf - 1,  yf),
      u
    );
    // Interpolate along x for the top corners:
    const x2 = this.lerp(
      this.grad(this.perm[topLeft],     xf,      yf - 1),
      this.grad(this.perm[topRight],    xf - 1,  yf - 1),
      u
    );

    // Interpolate between bottom and top along y:
    return this.lerp(x1, x2, v);
  }
}

//--------------------------------------
// 2) Canvas + Mycelium Drawing
//--------------------------------------

// Create and configure a full-screen canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Failed to initialize CanvasRenderingContext2D.");
}

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//--------------------------------------
// 3) Tunable Parameters
//--------------------------------------

/** The radius within which mycelium can grow (relative to canvas size). */
const growthRadius = Math.min(canvas.width, canvas.height) * 0.45;

/** Max times we can draw in the same cell before stopping growth. */
const maxDensity = 120;  

/** Cell size for the density map. Smaller = finer resolution. */
const cellSize = 15;

/** Number of main mycelium branches emanating from center. */
const mainBranchCount = 30; 

/**
 * Probability that each step of a main branch will sprout a secondary branch.
 * High value => many secondary branches => more filled structure.
 */
const secondaryBranchChance = 0.95;

/** Angle randomization for secondary branches (in radians). */
const secondaryBranchAngleVariance = Math.PI / 2;

/** How quickly secondary branches lose length compared to the main branch. */
const secondaryBranchDecay = 0.8;

/** Number of steps in secondary branch drawing. */
const secondaryBranchSteps = 20; 

/**
 * Start and end factors for radial fade-out near the edge of the growth radius.
 *  fadeStartRadiusFactor = 0.9 means: up to 90% of radius there's no fade,
 *  then it transitions to full fade by fadeEndRadiusFactor = 1.0 => the radius boundary.
 */
const fadeStartRadiusFactor = 0.9;
const fadeEndRadiusFactor = 1.0;

/** Shadow blur for the glowing filaments. */
const shadowBlurAmount = 6;

/** Shadow color for filaments. */
const shadowColor = "rgba(255, 255, 255, 0.5)";

/** Inner and outer opacities of the final radial gradient overlay. */
const gradientInnerOpacity = 0.2;
const gradientOuterOpacity = 0.8;

/**
 * Perlin noise scale and strengths. 
 * Adjust these to tweak how wiggly or curved the branches are.
 */
const PERLIN_SCALE = 0.02;
const ANGLE_DRIFT_STRENGTH = 0.15;
const WIGGLE_STRENGTH = 3;

/** Global Perlin instance for smooth noise sampling. */
const perlin = new Perlin();

//--------------------------------------
// 4) Density Map to Prevent Overcrowding
//--------------------------------------

const densityMap = new Map<string, number>();

function getDensityKey(x: number, y: number): string {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  return `${col},${row}`;
}

function increaseDensity(x: number, y: number): void {
  const key = getDensityKey(x, y);
  densityMap.set(key, (densityMap.get(key) || 0) + 1);
}

function getDensity(x: number, y: number): number {
  const key = getDensityKey(x, y);
  return densityMap.get(key) || 0;
}

//--------------------------------------
// 5) Filament Drawing Function
//--------------------------------------

/**
 * Draws a single filament (either "main" or "secondary"). Uses Perlin noise
 * to create a smoothly curving path, and occasionally spawns secondary branches.
 * 
 * @param ctx - The 2D rendering context.
 * @param startX - Starting X coordinate.
 * @param startY - Starting Y coordinate.
 * @param angle - Initial angle (in radians) for filament growth.
 * @param length - Total length of this filament.
 * @param branchFactor - If > 0, we can still spawn secondary branches.
 * @param depth - How deep (far from origin) we are in the branch hierarchy.
 * @param growthType - "main" or "secondary" branch type.
 */
function drawFilament(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  branchFactor: number,
  depth: number,
  growthType: "main" | "secondary"
): void {
  // If length or depth are invalid, abort
  if (length < 1 || depth <= 0) return;

  // More steps => more segments => more detailed, curvy branches.
  const steps = growthType === "main" ? 30 : secondaryBranchSteps;

  // Set a base line width for this filament (thicker for main, thinner for secondaries)
  let baseLineWidth =
    growthType === "main"
      ? Math.max(2.5 - depth * 0.1, 1.0)
      : Math.max(1.8 - depth * 0.1, 0.5);

  let currentX = startX;
  let currentY = startY;

  for (let i = 1; i <= steps; i++) {
    // Segment length with a little random factor for irregular pacing
    const stepLength = (length / steps) * (0.8 + Math.random() * 0.4);

    // Perlin noise for angle drift
    const noiseVal = perlin.noise2D(currentX * PERLIN_SCALE, currentY * PERLIN_SCALE);
    const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH; 
    angle += angleDrift;

    // Perlin noise for perpendicular wiggle
    const noiseVal2 = perlin.noise2D(
      (currentX + 1000) * PERLIN_SCALE,
      (currentY + 1000) * PERLIN_SCALE
    );
    const wiggle = noiseVal2 * WIGGLE_STRENGTH;

    // Compute new position
    currentX += Math.cos(angle) * stepLength + Math.cos(angle + Math.PI / 2) * wiggle;
    currentY += Math.sin(angle) * stepLength + Math.sin(angle + Math.PI / 2) * wiggle;

    // Stop if we go outside the growth radius
    const distanceFromCenter = Math.hypot(
      currentX - canvas.width / 2,
      currentY - canvas.height / 2
    );
    if (distanceFromCenter > growthRadius) return;

    // Stop if area is already too dense
    if (getDensity(currentX, currentY) > maxDensity) return;
    increaseDensity(currentX, currentY);

    // Fade factor near the outer rim
    let fadeFactor = 1;
    if (distanceFromCenter > growthRadius * fadeStartRadiusFactor) {
      fadeFactor =
        1 -
        (distanceFromCenter - growthRadius * fadeStartRadiusFactor) /
          (growthRadius * (fadeEndRadiusFactor - fadeStartRadiusFactor));
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // Slight random color variation (HSL near white/yellowish)
    const hueShift = Math.floor(Math.random() * 30) - 15; // ±15
    const baseHue = 50 + hueShift;    // around 50 => mild yellowish tint
    const baseLightness = 95;         // near white
    const alpha = (growthType === "main" ? 0.8 : 0.95) * fadeFactor;

    ctx.strokeStyle = `hsla(${baseHue}, 20%, ${baseLightness}%, ${alpha})`;
    ctx.shadowBlur = shadowBlurAmount;
    ctx.shadowColor = shadowColor;

    // Taper line width from segment start to end
    const lineWidth = Math.max(baseLineWidth * (1 - i / steps) + 0.3, 0.2);
    ctx.lineWidth = lineWidth;

    // Draw the segment from the old position to the new
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Move the "start" to our current endpoint
    startX = currentX;
    startY = currentY;

    // Attempt secondary branching (only from main)
    if (growthType === "main" && branchFactor > 0) {
      // If random chance is met, spawn a new secondary
      if (Math.random() < secondaryBranchChance) {
        const newLength = length * secondaryBranchDecay;
        const newAngle = angle + (Math.random() - 0.5) * secondaryBranchAngleVariance;
        drawFilament(
          ctx,
          currentX,
          currentY,
          newAngle,
          newLength,
          branchFactor - 1,
          depth + 1,
          "secondary"
        );
      }
    }
  }
}

//--------------------------------------
// 6) Master Function to Draw Mycelium
//--------------------------------------

/**
 * Clears the canvas, resets the density map, and draws the entire mycelium pattern
 * from the center outward with multiple main branches and secondary branches.
 */
function drawOrganicMycelium() {
  // Reset density tracking
  densityMap.clear();

  // Clear the background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Create many main branches
  for (let i = 0; i < mainBranchCount; i++) {
    const angle = Math.random() * Math.PI * 2;     // random direction
    const initialLength = Math.random() * 200 + 300; // main branch length
    drawFilament(ctx, centerX, centerY, angle, initialLength, 8, 1, "main");
  }

  // Finally, overlay a radial gradient to fade edges
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    growthRadius * 0.8,
    centerX,
    centerY,
    growthRadius
  );
  gradient.addColorStop(0, `rgba(0, 0, 0, ${gradientInnerOpacity})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${gradientOuterOpacity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//--------------------------------------
// 7) Handle Resizing and Initialization
//--------------------------------------

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawOrganicMycelium();
});

// Initial draw
drawOrganicMycelium();

