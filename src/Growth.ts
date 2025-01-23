/***************************************************
 * Growth.ts
 *
 * Contains the iterative growth logic:
 * - HyphaTip data structure
 * - GrowthManager class to handle:
 *   1) Tips array
 *   2) Density map
 *   3) updateAndDraw logic
 ***************************************************/

import { Perlin } from "./Perlin.js";
import {
  CELL_SIZE,
  MAX_DENSITY,
  STEP_SIZE,
  BRANCH_CHANCE,
  BRANCH_DECAY,
  MAX_LIFE,
  PERLIN_SCALE,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,
  EDGE_FADE_START,
  BACKGROUND_ALPHA,
  SHADOW_BLUR,
  SHADOW_COLOR,
  BASE_HUE,
  BASE_LIGHTNESS,
  BASE_ALPHA
} from "./constants.js";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number; // how many steps remain
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

  /**
   * Clear all existing data and set up initial tips.
   */
  public init(initialTipCount = 5) {
    this.densityMap.clear();
    this.tips = [];

    // Fill background
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Spawn a few tips near the center, spaced around
    for (let i = 0; i < initialTipCount; i++) {
      const angle = (Math.PI * 2 * i) / initialTipCount;
      this.tips.push({
        x: this.centerX,
        y: this.centerY,
        angle,
        life: MAX_LIFE
      });
    }
  }

  /**
   * Called each frame to update & draw the hypha network.
   * Typically invoked via requestAnimationFrame in main.ts.
   */
  public updateAndDraw() {
    // Slightly fade previous frame => ghost effect
    this.ctx.fillStyle = `rgba(0,0,0,${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    const newTips: HyphaTip[] = [];

    for (let i = 0; i < this.tips.length; i++) {
      const tip = this.tips[i];
      if (tip.life <= 0) continue;

      const oldX = tip.x;
      const oldY = tip.y;

      // Noise-based angle tweak
      const noiseVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      const angleDrift = noiseVal * ANGLE_DRIFT_STRENGTH;
      tip.angle += angleDrift;

      // Perpendicular wiggle
      const noiseVal2 = this.perlin.noise2D(
        (tip.x + 1234) * PERLIN_SCALE,
        (tip.y + 1234) * PERLIN_SCALE
      );
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // Move forward
      tip.x += Math.cos(tip.angle) * STEP_SIZE + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      tip.y += Math.sin(tip.angle) * STEP_SIZE + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // Decrease life
      tip.life--;

      // Check boundary
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Check density
      if (this.getDensity(tip.x, tip.y) >= MAX_DENSITY) {
        tip.life = 0;
        continue;
      }
      // Increase density
      this.increaseDensity(tip.x, tip.y);

      // Draw the new segment
      let fadeFactor = 1;
      const edgeDist = this.growthRadius * EDGE_FADE_START;
      if (dist > edgeDist) {
        fadeFactor = 1 - (dist - edgeDist) / (this.growthRadius - edgeDist);
        if (fadeFactor < 0) fadeFactor = 0;
      }

      // Subtle color variation each step
      const hueShift = Math.floor(Math.random() * 30) - 15;
      const hue = BASE_HUE + hueShift;
      const alpha = BASE_ALPHA * fadeFactor;

      this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(oldX, oldY);
      this.ctx.lineTo(tip.x, tip.y);
      this.ctx.stroke();

      // Branch?
      if (Math.random() < BRANCH_CHANCE) {
        const angleOffset = (Math.random() - 0.5) * 1.5;
        newTips.push({
          x: tip.x,
          y: tip.y,
          angle: tip.angle + angleOffset,
          life: tip.life * BRANCH_DECAY
        });
      }
    }

    // Add new tips
    this.tips.push(...newTips);

    // Remove dead tips
    this.tips = this.tips.filter(t => t.life > 0);
  }

  /** Utility to increment local density. */
  private increaseDensity(x: number, y: number) {
    const key = this.getDensityKey(x, y);
    this.densityMap.set(key, (this.densityMap.get(key) || 0) + 1);
  }

  /** Utility to retrieve local density. */
  private getDensity(x: number, y: number): number {
    const key = this.getDensityKey(x, y);
    return this.densityMap.get(key) || 0;
  }

  /** Convert x,y to a grid key. */
  private getDensityKey(x: number, y: number): string {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    return `${col},${row}`;
  }
}
