/***************************************************
 * Filament.ts
 *
 * Filament drawing logic: branch growth, density 
 * checks, plus a function to draw single filaments.
 ***************************************************/

import { Perlin } from "./Perlin.js";
import {
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,
  PERLIN_SCALE,
  MAX_DENSITY,
  CELL_SIZE,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  SHADOW_BLUR,
  SHADOW_COLOR,
  MAIN_BRANCH_STEPS,
  SECONDARY_BRANCH_STEPS,
  BASE_SECONDARY_CHANCE,
  BASE_BRANCH_FACTOR,
  SECONDARY_DECAY,
  SECONDARY_ANGLE_VARIANCE,
  secondaryFillFactor
} from "./constants.js";

export type GrowthType = "main" | "secondary";

// A simple interface so we can pass relevant data around:
export interface FilamentContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  maxDrawRadius: number;
  perlin: Perlin;
}

//--------------------------------------
// Density Map
//--------------------------------------
const densityMap = new Map<string, number>();

function getDensityKey(x: number, y: number): string {
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
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

// Clears the density map between draws
export function clearDensityMap(): void {
  densityMap.clear();
}

/**
 * drawFilament - draws a single filament branch. 
 * 
 * If it's a main branch, it can spawn secondaries 
 * (controlled by secondaryFillFactor). 
 */
export function drawFilament(
  ftx: FilamentContext,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  branchFactor: number,
  depth: number,
  growthType: GrowthType
): void {
  if (length < 1 || depth <= 0) return;

  const steps = (growthType === "main") ? MAIN_BRANCH_STEPS : SECONDARY_BRANCH_STEPS;
  let baseLineWidth = (growthType === "main") ? 3.0 : 2.0;
  let baseAlpha = (growthType === "main") ? 0.85 : 0.7;

  const { ctx, perlin, maxDrawRadius } = ftx;

  let currentX = startX;
  let currentY = startY;

  for (let i = 1; i <= steps; i++) {
    const stepLength = (length / steps) * (0.8 + Math.random() * 0.4);

    // Perlin-based angle drift
    const noiseVal = perlin.noise2D(currentX * PERLIN_SCALE, currentY * PERLIN_SCALE);
    const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH;
    angle += angleDrift;

    // Perlin-based wiggle
    const noiseVal2 = perlin.noise2D(
      (currentX + 1000) * PERLIN_SCALE,
      (currentY + 1000) * PERLIN_SCALE
    );
    const wiggle = noiseVal2 * WIGGLE_STRENGTH;

    // Move
    currentX += Math.cos(angle) * stepLength + Math.cos(angle + Math.PI / 2) * wiggle;
    currentY += Math.sin(angle) * stepLength + Math.sin(angle + Math.PI / 2) * wiggle;

    // Check boundary
    const dist = Math.hypot(currentX - ftx.width / 2, currentY - ftx.height / 2);
    if (dist > maxDrawRadius) return;

    // Check density
    if (getDensity(currentX, currentY) > MAX_DENSITY) return;
    increaseDensity(currentX, currentY);

    // Fade near the outer edge
    let fadeFactor = 1;
    const fadeStart = maxDrawRadius * FADE_START_FACTOR;
    const fadeEnd = maxDrawRadius * FADE_END_FACTOR;

    if (dist > fadeStart) {
      fadeFactor = 1 - (dist - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // Color variation near white
    const hueShift = Math.floor(Math.random() * 30) - 15;
    const baseHue = 50 + hueShift;
    const baseLightness = 95;
    const alpha = baseAlpha * fadeFactor;

    ctx.strokeStyle = `hsla(${baseHue}, 20%, ${baseLightness}%, ${alpha})`;
    ctx.shadowBlur = SHADOW_BLUR;
    ctx.shadowColor = SHADOW_COLOR;

    // Taper line width
    const lineWidth = Math.max(baseLineWidth * (1 - i / steps) + 0.3, 0.2);
    ctx.lineWidth = lineWidth;

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    startX = currentX;
    startY = currentY;

    // Possibly spawn a secondary from main
    if (growthType === "main" && branchFactor > 0) {
      const effectiveChance = BASE_SECONDARY_CHANCE * secondaryFillFactor;
      if (Math.random() < effectiveChance) {
        const newBranchFactor = Math.round(branchFactor * secondaryFillFactor);

        const newLength = length * SECONDARY_DECAY;
        const newAngle = angle + (Math.random() - 0.5) * SECONDARY_ANGLE_VARIANCE;

        drawFilament(ftx, currentX, currentY, newAngle, newLength, newBranchFactor, depth + 1, "secondary");
      }
    }
  }
}
