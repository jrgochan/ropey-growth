/***************************************************
 * growth.ts
 *
 * Minimal iterative approach:
 *  - Manages array of trunk tips
 *  - Each step: move them slightly, draw lines
 *  - No environment, no resource constraints
 ***************************************************/

import { Perlin } from "./perlin.js";

import {
  GROWTH_RADIUS_FACTOR,
  MAIN_TRUNK_COUNT,
  BASE_LIFE,
  STEP_SIZE,
  PERLIN_SCALE,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,
  TIME_LAPSE_FACTOR,

  MAIN_LINE_WIDTH,
  MAIN_ALPHA,
  BASE_HUE,
  BASE_LIGHTNESS,

  FADE_START_FACTOR,
  FADE_END_FACTOR
} from "./constants.js";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number;
}

export class GrowthManager {
  private tips: HyphaTip[] = [];
  private growthRadius: number;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private perlin: Perlin
  ) {
    this.growthRadius = Math.min(width, height) * GROWTH_RADIUS_FACTOR;
  }

  public init() {
    this.tips = [];
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create N main trunk tips from center
    for (let i = 0; i < MAIN_TRUNK_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.tips.push({
        x: this.centerX,
        y: this.centerY,
        angle,
        life: BASE_LIFE
      });
    }
  }

  public updateAndDraw() {
    // optional partial fade each frame
    this.ctx.fillStyle = "rgba(0,0,0,0.05)"; // mild ghosting
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < TIME_LAPSE_FACTOR; i++) {
      this.simulateOneStep();
    }
  }

  private simulateOneStep() {
    for (const tip of this.tips) {
      if (tip.life <= 0) continue;

      const oldX = tip.x;
      const oldY = tip.y;

      // mild perlin drift
      const noiseVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      tip.angle += noiseVal * ANGLE_DRIFT_STRENGTH;

      // perpendicular wiggle
      const noiseVal2 = this.perlin.noise2D(
        (tip.x + 1234) * PERLIN_SCALE,
        (tip.y + 1234) * PERLIN_SCALE
      );
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // move
      tip.x += Math.cos(tip.angle) * STEP_SIZE
             + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      tip.y += Math.sin(tip.angle) * STEP_SIZE
             + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // boundary check
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      tip.life--;

      // draw line
      this.drawSegment(oldX, oldY, tip.x, tip.y, dist);
    }
  }

  private drawSegment(oldX: number, oldY: number, newX: number, newY: number, dist: number) {
    // fade near edge
    let fadeFactor = 1;
    const fadeStart = this.growthRadius * FADE_START_FACTOR;
    const fadeEnd   = this.growthRadius * FADE_END_FACTOR;
    if (dist > fadeStart) {
      fadeFactor = 1 - (dist - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }

    // color
    const lineWidth = MAIN_LINE_WIDTH;
    const alpha = MAIN_ALPHA * fadeFactor;
    const hueShift = Math.floor(Math.random() * 20) - 10;
    const hue = BASE_HUE + hueShift;

    this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
  }
}
