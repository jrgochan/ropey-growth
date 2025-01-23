/***************************************************
 * TypeScript Mycelium Example
 * - Main branches go from center to circle edge.
 * - secondaryFillFactor (0..1) controls how much 
 *   secondary branching fills gaps between spokes.
 ***************************************************/

//--------------------------------------
// 1) Perlin Class for Smooth Noise
//--------------------------------------
class Perlin {
  private perm: Uint8Array;
  private p: Uint8Array;

  constructor() {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);

    // Fill p with 0..255
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    // Shuffle
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(Math.random() * 256);
      const tmp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = tmp;
    }
    // Extend permutation array
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
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      default: return 0; // unreachable
    }
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight =    this.perm[this.perm[X + 1] + Y + 1];
    const topLeft =     this.perm[this.perm[X] + Y + 1];
    const bottomRight = this.perm[this.perm[X + 1] + Y];
    const bottomLeft =  this.perm[this.perm[X] + Y];

    const u = this.fade(xf);
    const v = this.fade(yf);

    const x1 = this.lerp(
      this.grad(this.perm[bottomLeft], xf, yf),
      this.grad(this.perm[bottomRight], xf - 1, yf),
      u
    );
    const x2 = this.lerp(
      this.grad(this.perm[topLeft], xf, yf - 1),
      this.grad(this.perm[topRight], xf - 1, yf - 1),
      u
    );

    return this.lerp(x1, x2, v);
  }
}

//--------------------------------------
// 2) Canvas Setup
//--------------------------------------
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Could not obtain 2D context.");
}

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//--------------------------------------
// 3) Growth Parameters
//--------------------------------------

/** Circle radius for growth. Main branches reach this edge. */
const growthRadius = Math.min(canvas.width, canvas.height) * 0.45;

/** 
 * We allow lines to draw up to this radius. 
 * "No empty ring" => it goes out to growthRadius exactly.
 */
const maxDrawRadius = growthRadius;

/** We allow extremely high density so lines don't stop. */
const maxDensity = 9999;
const cellSize = 15;

/** 
 * Number of main branches from center => "spokes"
 * Increase to get more "spokes" around the circle.
 */
const mainBranchCount = 20;

/** 
 * Base chance for secondaries to appear on a main step.
 * We'll scale this by `secondaryFillFactor`.
 */
const baseSecondaryBranchChance = 0.9;

/**
 * Base branching factor (how many times secondaries can themselves branch).
 * We'll also scale this by `secondaryFillFactor`.
 */
const baseBranchFactor = 6;

/** Variation of angle for secondaries => wide. */
const secondaryBranchAngleVariance = Math.PI / 2;

/** Secondary branch length factor vs. main. */
const secondaryBranchDecay = 0.8;

/** Number of steps in each secondary branch. */
const secondaryBranchSteps = 30;

/** Number of steps in main branches. */
const mainBranchSteps = 60;

/** Fade near outer edge. */
const fadeStartRadiusFactor = 0.9;
const fadeEndRadiusFactor = 1.0;

/** Glow effect. */
const shadowBlurAmount = 6;
const shadowColor = "rgba(255, 255, 255, 0.5)";

/** Radial gradient overlay. */
const gradientInnerOpacity = 0.2;
const gradientOuterOpacity = 0.8;

/** Perlin noise parameters. */
const PERLIN_SCALE = 0.02;
const ANGLE_DRIFT_STRENGTH = 0.15;
const WIGGLE_STRENGTH = 3;

/** Global Perlin instance. */
const perlin = new Perlin();

/**
 *  This parameter controls how filled the space 
 *  between main branches becomes due to secondaries.
 * 
 *  0.0 => No secondaries at all => wide empty gaps
 *  1.0 => Maximum secondary coverage => heavily filled
 */
let secondaryFillFactor = 1.0; // Tweak at will

//--------------------------------------
// 4) Density Map
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
// 5) Filament Drawing
//--------------------------------------

type GrowthType = "main" | "secondary";

/**
 * Draws a single filament. 
 * If it's "main", it can spawn secondaries according to `secondaryFillFactor`.
 * If it's "secondary", it does not spawn further branches (or you can allow nested secondaries).
 */
function drawFilament(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  branchFactor: number,
  depth: number,
  growthType: GrowthType
) {
  if (length < 1 || depth <= 0) return;

  // Steps differ for main vs. secondary
  const steps = (growthType === "main") ? mainBranchSteps : secondaryBranchSteps;

  let baseLineWidth = 1.0;
  let baseAlpha = 0.3;
  if (growthType === "main") {
    baseLineWidth = Math.max(3.0 - depth * 0.1, 1.0);
    baseAlpha = 0.85;
  } else {
    // secondary
    baseLineWidth = Math.max(2.0 - depth * 0.1, 0.5);
    baseAlpha = 0.7;
  }

  let currentX = startX;
  let currentY = startY;

  for (let i = 1; i <= steps; i++) {
    const stepLength = (length / steps) * (0.8 + Math.random() * 0.4);

    // Perlin-based angle drift
    const noiseVal = perlin.noise2D(currentX * PERLIN_SCALE, currentY * PERLIN_SCALE);
    angle += noiseVal * ANGLE_DRIFT_STRENGTH;

    // Perlin-based wiggle
    const noiseVal2 = perlin.noise2D((currentX + 1000) * PERLIN_SCALE, (currentY + 1000) * PERLIN_SCALE);
    const wiggle = noiseVal2 * WIGGLE_STRENGTH;

    // Move
    currentX += Math.cos(angle) * stepLength + Math.cos(angle + Math.PI / 2) * wiggle;
    currentY += Math.sin(angle) * stepLength + Math.sin(angle + Math.PI / 2) * wiggle;

    // Out of circle? stop
    const distFromCenter = Math.hypot(currentX - canvas.width / 2, currentY - canvas.height / 2);
    if (distFromCenter > maxDrawRadius) return;

    // Over density limit? stop
    if (getDensity(currentX, currentY) > maxDensity) return;
    increaseDensity(currentX, currentY);

    // Fade near edge
    let fadeFactor = 1;
    const fadeStart = maxDrawRadius * fadeStartRadiusFactor;
    const fadeEnd   = maxDrawRadius * fadeEndRadiusFactor;
    if (distFromCenter > fadeStart) {
      fadeFactor = 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // Slight random hue shift near white
    const hueShift = Math.floor(Math.random() * 30) - 15;
    const baseHue = 50 + hueShift;
    const baseLightness = 95;
    const alpha = baseAlpha * fadeFactor;

    ctx.strokeStyle = `hsla(${baseHue}, 20%, ${baseLightness}%, ${alpha})`;
    ctx.shadowBlur = shadowBlurAmount;
    ctx.shadowColor = shadowColor;

    // Taper line width over steps
    const lineWidth = Math.max(baseLineWidth * (1 - i / steps) + 0.3, 0.2);
    ctx.lineWidth = lineWidth;

    // Draw
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    startX = currentX;
    startY = currentY;

    // Possibly spawn secondary from main
    if (growthType === "main" && branchFactor > 0) {
      // Scale the base chance by secondaryFillFactor
      const effectiveChance = baseSecondaryBranchChance * secondaryFillFactor;

      // If random < that chance, spawn a secondary
      if (Math.random() < effectiveChance) {
        // Also scale the branching factor
        const newBranchFactor = Math.round(branchFactor * secondaryFillFactor);

        const newLength = length * secondaryBranchDecay;
        const newAngle  = angle + (Math.random() - 0.5) * secondaryBranchAngleVariance;

        drawFilament(
          ctx,
          currentX,
          currentY,
          newAngle,
          newLength,
          newBranchFactor,
          depth + 1,
          "secondary"
        );
      }
    }
  }
}

//--------------------------------------
// 6) Main Rendering Function
//--------------------------------------
function drawOrganicMycelium() {
  densityMap.clear();

  // Fill background black
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Draw main branches outward
  for (let i = 0; i < mainBranchCount; i++) {
    const angle = Math.random() * 2 * Math.PI;

    // Enough length to definitely hit the edge
    const initialLength = maxDrawRadius * 1.2;

    // Use the base branching factor
    drawFilament(ctx, centerX, centerY, angle, initialLength, baseBranchFactor, 1, "main");
  }

  // Overlay radial gradient fade
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
// 7) Resizing & Initial Launch
//--------------------------------------
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawOrganicMycelium();
});

drawOrganicMycelium();
