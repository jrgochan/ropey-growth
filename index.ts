/***************************************************
 * TypeScript Implementation of a Dense Mycelium
 * with Filler Filaments + Main Branches + Secondary
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

    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(Math.random() * 256);
      const tmp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = tmp;
    }
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
      case 0: return  x + y;
      case 1: return -x + y;
      case 2: return  x - y;
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
      this.grad(this.perm[bottomLeft],  xf,      yf),
      this.grad(this.perm[bottomRight], xf - 1,  yf),
      u
    );
    const x2 = this.lerp(
      this.grad(this.perm[topLeft],     xf,      yf - 1),
      this.grad(this.perm[topRight],    xf - 1,  yf - 1),
      u
    );

    return this.lerp(x1, x2, v);
  }
}

//--------------------------------------
// 2) Canvas + Setup
//--------------------------------------

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Failed to get 2D context.");
}

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//--------------------------------------
// 3) Growth Parameters
//--------------------------------------

/** Fill the entire radius of the mycelium circle with minimal black showing. */
const growthRadius = Math.min(canvas.width, canvas.height) * 0.45;

/** 
 * We allow a very high density so we don't stop
 * drawing filaments early. This ensures we fill 
 * the circle as much as possible. 
 */
const maxDensity = 9999;  

/** Cell size for density map (finer = fewer collisions). */
const cellSize = 15;

/** 
 * Main branch parameters 
 * - More main branches -> more bold lines 
 * - Also has secondary branching
 */
const mainBranchCount = 25;  
const secondaryBranchChance = 0.9;
const secondaryBranchAngleVariance = Math.PI / 2;
const secondaryBranchDecay = 0.8;
const secondaryBranchSteps = 20;

/** 
 * Filler filaments 
 * - Large number to fill in the circle 
 * - Each filament is short & faint 
 */
const fillerFilamentCount = 3000; 

/** Fade near edge of circle. */
const fadeStartRadiusFactor = 0.9;
const fadeEndRadiusFactor = 1.0;

/** Shadow for filament glow. */
const shadowBlurAmount = 6;
const shadowColor = "rgba(255, 255, 255, 0.5)";

/** Radial gradient overlay at the end. */
const gradientInnerOpacity = 0.2;
const gradientOuterOpacity = 0.8;

/** Perlin noise. */
const PERLIN_SCALE = 0.02;
const ANGLE_DRIFT_STRENGTH = 0.15;
const WIGGLE_STRENGTH = 3;

/** Create global perlin instance. */
const perlin = new Perlin();

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

type GrowthType = "main" | "secondary" | "filler";

/**
 * Draws a single filament using Perlin noise for curvature.
 * 
 * @param ctx 2D Rendering Context
 * @param startX The starting X coordinate
 * @param startY The starting Y coordinate
 * @param angle Initial angle in radians
 * @param length Total length of this filament
 * @param branchFactor If > 0, can spawn secondaries (main only)
 * @param depth How deep we are in the branch hierarchy
 * @param growthType "main" | "secondary" | "filler"
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

  // Steps in the filament
  let steps: number;
  if (growthType === "main") {
    steps = 30;  
  } else if (growthType === "secondary") {
    steps = secondaryBranchSteps;
  } else {
    // filler filaments can be shorter
    steps = 10;
  }

  // Base line width depends on growthType
  let baseLineWidth = 1.0;
  let baseAlpha = 0.3;

  // "main" branches => thicker lines, more opaque
  if (growthType === "main") {
    baseLineWidth = Math.max(2.5 - depth * 0.1, 1.0);
    baseAlpha = 0.85;
  } 
  // "secondary" => slightly thinner, but fairly visible
  else if (growthType === "secondary") {
    baseLineWidth = Math.max(1.8 - depth * 0.1, 0.5);
    baseAlpha = 0.7;
  }
  // "filler" => thin, faint
  else if (growthType === "filler") {
    baseLineWidth = 0.8;
    baseAlpha = 0.2; 
  }

  let currentX = startX;
  let currentY = startY;

  for (let i = 1; i <= steps; i++) {
    // Each step is part of the total length, with some random factor
    const stepLength = (length / steps) * (0.8 + Math.random() * 0.4);

    // Perlin-based angle drift
    const noiseVal = perlin.noise2D(currentX * PERLIN_SCALE, currentY * PERLIN_SCALE);
    const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH;
    angle += angleDrift;

    // Perlin-based wiggle (perpendicular)
    const noiseVal2 = perlin.noise2D(
      (currentX + 1000) * PERLIN_SCALE,
      (currentY + 1000) * PERLIN_SCALE
    );
    const wiggle = noiseVal2 * WIGGLE_STRENGTH;

    currentX += Math.cos(angle) * stepLength + Math.cos(angle + Math.PI / 2) * wiggle;
    currentY += Math.sin(angle) * stepLength + Math.sin(angle + Math.PI / 2) * wiggle;

    // Check boundary
    const distFromCenter = Math.hypot(currentX - canvas.width / 2, currentY - canvas.height / 2);
    if (distFromCenter > growthRadius) return;

    // Check density
    if (getDensity(currentX, currentY) > maxDensity) return;
    increaseDensity(currentX, currentY);

    // Fade near edge
    let fadeFactor = 1;
    if (distFromCenter > growthRadius * fadeStartRadiusFactor) {
      fadeFactor =
        1 -
        (distFromCenter - growthRadius * fadeStartRadiusFactor) /
        (growthRadius * (fadeEndRadiusFactor - fadeStartRadiusFactor));
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // Slight color variation in HSL near white
    const hueShift = Math.floor(Math.random() * 30) - 15; // ±15
    const baseHue = 50 + hueShift; // around 50 => mild yellowish
    const baseLightness = 95;
    const alpha = baseAlpha * fadeFactor;

    ctx.strokeStyle = `hsla(${baseHue}, 20%, ${baseLightness}%, ${alpha})`;
    ctx.shadowBlur = shadowBlurAmount;
    ctx.shadowColor = shadowColor;

    // Taper line width from start to end of each filament
    const lineWidth = Math.max(baseLineWidth * (1 - i / steps) + 0.2, 0.2);
    ctx.lineWidth = lineWidth;

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Update for next segment
    startX = currentX;
    startY = currentY;

    // Spawn secondary from main
    if (growthType === "main" && branchFactor > 0) {
      if (Math.random() < secondaryBranchChance) {
        const newLength = length * secondaryBranchDecay;
        const newAngle = angle + (Math.random() - 0.5) * secondaryBranchAngleVariance;
        drawFilament(ctx, currentX, currentY, newAngle, newLength, branchFactor - 1, depth + 1, "secondary");
      }
    }
  }
}

//--------------------------------------
// 6) Filler Network
//--------------------------------------

/**
 * Draws a dense "filler network" of thin filaments throughout the circle,
 * to minimize black areas while keeping these lines faint so main branches
 * still stand out.
 */
function drawFillerNetwork() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < fillerFilamentCount; i++) {
    // Random angle and random distance from center
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * growthRadius * 0.95; // stay inside circle

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Short random length
    const length = 50 + Math.random() * 100;

    // Draw a "filler" type filament (no branching)
    drawFilament(ctx, x, y, angle, length, 0, 1, "filler");
  }
}

//--------------------------------------
// 7) Master Drawing Function
//--------------------------------------

function drawOrganicMycelium() {
  densityMap.clear();

  // Background is black
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1) Draw a large "filler" network to cover the circle area
  drawFillerNetwork();

  // 2) Now draw main branches from center, which can spawn secondaries
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  for (let i = 0; i < mainBranchCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const initialLength = 300 + Math.random() * 200; // 300..500
    // branchFactor=8 => can spawn multiple secondaries
    drawFilament(ctx, centerX, centerY, angle, initialLength, 8, 1, "main");
  }

  // 3) Fade out edges with a radial gradient
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
// 8) Resize Handling & Initial Draw
//--------------------------------------

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawOrganicMycelium();
});

drawOrganicMycelium();
