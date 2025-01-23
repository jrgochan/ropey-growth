/***************************************************
 * Growth.ts
 *
 * Iterative rhizomorphic mycelium approach:
 * - Start from "main trunk" tips in center
 * - Grow out step by step
 * - Possibly spawn secondary branches
 * - Stop if out of circle or too dense
 ***************************************************/

import { Perlin } from "./Perlin.js";
import {
  CELL_SIZE,
  MAX_DENSITY,
  STEP_SIZE,
  PERLIN_SCALE,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  MAIN_LINE_WIDTH,
  MAIN_ALPHA,
  SECONDARY_LINE_WIDTH,
  SECONDARY_ALPHA,
  SHADOW_BLUR,
  SHADOW_COLOR,
  BASE_HUE,
  BASE_LIGHTNESS,
  BACKGROUND_ALPHA,
  SECONDARY_BRANCH_CHANCE,
  MAX_SECONDARY_DEPTH
} from "./constants.js";

/** We mark each tip as 'main' or 'secondary', plus track depth of branching. */
export type GrowthType = "main" | "secondary";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number;
  growthType: GrowthType;
  depth: number; // how many times we've branched
}

export class GrowthManager {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private growthRadius: number;
  private perlin: Perlin;

  private tips: HyphaTip[] = [];
  private densityMap = new Map<string, number>();

  constructor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    growthRadius: number,
    perlin: Perlin
  ) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.growthRadius = growthRadius;
    this.perlin = perlin;
  }

  public init(initialTips: HyphaTip[]) {
    this.densityMap.clear();
    this.tips = [];

    // Fill background once
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Store initial tips (likely main trunks in center)
    for (const t of initialTips) {
      this.tips.push(t);
    }
  }

  public updateAndDraw() {
    // If you want a persistent image (no fade):
    // just do nothing here, so lines remain.
    // For a subtle "ghost" effect, you could do:
    this.ctx.fillStyle = `rgba(0,0,0,${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    const newTips: HyphaTip[] = [];

    for (let i = 0; i < this.tips.length; i++) {
      const tip = this.tips[i];
      if (tip.life <= 0) continue;

      // Save old position
      const oldX = tip.x;
      const oldY = tip.y;

      // Perlin-based angle drift
      const noiseVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH;
      tip.angle += angleDrift;

      // Perlin-based perpendicular wiggle
      const noiseVal2 = this.perlin.noise2D(
        (tip.x + 1000) * PERLIN_SCALE,
        (tip.y + 1000) * PERLIN_SCALE
      );
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // Move forward
      tip.x += Math.cos(tip.angle) * STEP_SIZE 
             + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      tip.y += Math.sin(tip.angle) * STEP_SIZE 
             + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // Decrement life
      tip.life--;

      // Check boundary
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Check density
      if (this.getDensity(tip.x, tip.y) > MAX_DENSITY) {
        tip.life = 0;
        continue;
      }
      this.increaseDensity(tip.x, tip.y);

      // Fade factor near the boundary
      let fadeFactor = 1;
      const fadeStart = this.growthRadius * FADE_START_FACTOR;
      const fadeEnd = this.growthRadius * FADE_END_FACTOR;
      if (dist > fadeStart) {
        fadeFactor = 1 - (dist - fadeStart) / (fadeEnd - fadeStart);
        if (fadeFactor < 0) fadeFactor = 0;
      }

      // Determine color / alpha based on growthType
      let lineWidth = 1;
      let alpha = 0.5;

      if (tip.growthType === "main") {
        lineWidth = MAIN_LINE_WIDTH;
        alpha = MAIN_ALPHA;
      } else {
        lineWidth = SECONDARY_LINE_WIDTH;
        alpha = SECONDARY_ALPHA;
      }

      // Combine with fadeFactor
      alpha *= fadeFactor;

      // Slight random hue shift
      const hueShift = Math.floor(Math.random() * 30) - 15;
      const hue = BASE_HUE + hueShift;

      this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
      this.ctx.lineWidth = lineWidth;

      // Draw segment
      this.ctx.beginPath();
      this.ctx.moveTo(oldX, oldY);
      this.ctx.lineTo(tip.x, tip.y);
      this.ctx.stroke();

      // Possibly spawn secondary
      if (tip.growthType === "main" && tip.depth < MAX_SECONDARY_DEPTH) {
        if (Math.random() < SECONDARY_BRANCH_CHANCE) {
          newTips.push({
            x: tip.x,
            y: tip.y,
            angle: tip.angle + (Math.random() - 0.5) * Math.PI / 2,
            life: tip.life * 0.8, // shorter life for secondaries
            growthType: "secondary",
            depth: tip.depth + 1
          });
        }
      }
    }

    // Add new tips
    this.tips.push(...newTips);

    // Prune dead tips
    this.tips = this.tips.filter(t => t.life > 0);
  }

  private getDensityKey(x: number, y: number): string {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    return `${col},${row}`;
  }

  private increaseDensity(x: number, y: number): void {
    const key = this.getDensityKey(x, y);
    this.densityMap.set(key, (this.densityMap.get(key) || 0) + 1);
  }

  private getDensity(x: number, y: number): number {
    const key = this.getDensityKey(x, y);
    return this.densityMap.get(key) || 0;
  }
}
