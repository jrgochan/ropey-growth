/***************************************************
 * TypeScript Implementation:
 * Only lines from the center (main) or branching 
 * off existing lines (secondary).
 * 
 * Includes a tunable parameter to leave some % 
 * of the circle empty at the outer edge.
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
// 3) Main Growth Parameters
//--------------------------------------

/**
 * The overall radius in which we might draw.
 * We will reserve some fraction of this as empty space (see emptyEdgeFraction).
 */
const growthRadius = Math.min(canvas.width, canvas.height) * 0.45;

/**
 * We allow lines to grow only up to `maxDrawRadius`, which is
 * growthRadius * (1 - emptyEdgeFraction).
 * 
 * Example: if emptyEdgeFraction=0.2, then 20% of the circle's radius
 * is left empty. Filaments fill up to only 80% of the circle radius.
 */
const emptyEdgeFraction = 0.0; // Tweak to your liking: e.g. 0.0 -> fill everything
const maxDrawRadius = growthRadius * (1 - emptyEdgeFraction);

/**
 * High density limit so lines don't stop due to overcrowding
 */
const maxDensity = 9999;  
const cellSize = 15;

/**
 * Many main branches from the center => broad coverage
 */
const mainBranchCount = 40;  

/**
 * Probability that each step of a main branch spawns a secondary
 * => very high => fill interior thoroughly
 */
const secondaryBranchChance = 0.95;

/**
 * Variation of angle for secondaries => a wide range
 */
const secondaryBranchAngleVariance = Math.PI / 2;

/** 
 * How secondary length compares to main branch length
 */
const secondaryBranchDecay = 0.8;

/** 
 * Number of segments in each secondary branch 
 */
const secondaryBranchSteps = 30;

/**
 * We'll do 60 segments in main branches (set below).
 */

/**
 * Fade near the "usable" edge
 * 
 * We'll define fadeStartRadiusFactor / fadeEndRadiusFactor
 * relative to maxDrawRadius (not the total growthRadius).
 */
const fadeStartRadiusFactor = 0.9;
const fadeEndRadiusFactor = 1.0;

/** 
 * Glow effect 
 */
const shadowBlurAmount = 6;
const shadowColor = "rgba(255, 255, 255, 0.5)";

/** 
 * Radial gradient overlay 
 */
const gradientInnerOpacity = 0.2;
const gradientOuterOpacity = 0.8;

/** 
 * Perlin noise 
 */
const PERLIN_SCALE = 0.02;
const ANGLE_DRIFT_STRENGTH = 0.15;
const WIGGLE_STRENGTH = 3;

/** 
 * Global perlin instance 
 */
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

type GrowthType = "main" | "secondary";

/**
 * Draws a single filament using Perlin for curvature.
 * 
 * @param ctx 2D Rendering Context
 * @param startX Start X
 * @param startY Start Y
 * @param angle Initial angle
 * @param length Total length
 * @param branchFactor # times we can still spawn secondaries
 * @param depth Depth in the branch hierarchy
 * @param growthType "main" or "secondary"
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
): void {
  if (length < 1 || depth <= 0) return;

  // We'll do more steps for main branches for denser coverage
  const steps = growthType === "main" ? 60 : secondaryBranchSteps;

  // Base line width & alpha
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
    // Each step length has some randomness
    const stepLength = (length / steps) * (0.8 + Math.random() * 0.4);

    // Perlin-based angle drift
    const noiseVal = perlin.noise2D(currentX * PERLIN_SCALE, currentY * PERLIN_SCALE);
    const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH;
    angle += angleDrift;

    // Perlin-based perpendicular wiggle
    const noiseVal2 = perlin.noise2D(
      (currentX + 1000) * PERLIN_SCALE,
      (currentY + 1000) * PERLIN_SCALE
    );
    const wiggle = noiseVal2 * WIGGLE_STRENGTH;

    currentX += Math.cos(angle) * stepLength + Math.cos(angle + Math.PI / 2) * wiggle;
    currentY += Math.sin(angle) * stepLength + Math.sin(angle + Math.PI / 2) * wiggle;

    // Stop if we go outside the usable draw radius (accounting for emptyEdgeFraction)
    const distFromCenter = Math.hypot(currentX - canvas.width / 2, currentY - canvas.height / 2);
    if (distFromCenter > maxDrawRadius) return;

    // Stop if too dense
    if (getDensity(currentX, currentY) > maxDensity) return;
    increaseDensity(currentX, currentY);

    // Fade factor near the maxDrawRadius (not the full growthRadius)
    let fadeFactor = 1;
    const fadeStart = maxDrawRadius * fadeStartRadiusFactor;
    const fadeEnd = maxDrawRadius * fadeEndRadiusFactor;

    if (distFromCenter > fadeStart) {
      fadeFactor = 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // Slight color variation near white/yellowish
    const hueShift = Math.floor(Math.random() * 30) - 15; 
    const baseHue = 50 + hueShift; 
    const baseLightness = 95;
    const alpha = baseAlpha * fadeFactor;

    ctx.strokeStyle = `hsla(${baseHue}, 20%, ${baseLightness}%, ${alpha})`;
    ctx.shadowBlur = shadowBlurAmount;
    ctx.shadowColor = shadowColor;

    // Taper line width from segment start to end
    const lineWidth = Math.max(baseLineWidth * (1 - i / steps) + 0.3, 0.2);
    ctx.lineWidth = lineWidth;

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Update for next loop
    startX = currentX;
    startY = currentY;

    // Possibly spawn a secondary from main
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
// 6) Master Drawing Function
//--------------------------------------

function drawOrganicMycelium() {
  densityMap.clear();

  // Fill entire background black
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Draw many main branches from center
  for (let i = 0; i < mainBranchCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Very long main branches => better coverage within maxDrawRadius
    const initialLength = 500 + Math.random() * 300; // 500..800

    // branchFactor=6 => can spawn multiple secondaries
    drawFilament(ctx, centerX, centerY, angle, initialLength, 6, 1, "main");
  }

  // We add a radial gradient that extends out to the *full* growthRadius
  // so you still see a black ring from growthRadius*(1-emptyEdgeFraction) to growthRadius.
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
// 7) Handle Resize & Initialize
//--------------------------------------

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawOrganicMycelium();
});

drawOrganicMycelium();
