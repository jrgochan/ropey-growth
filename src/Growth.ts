/***************************************************
 * growth.ts
 *
 * Minimal starburst from center:
 * - 1 array of "HyphaTip"
 * - each step => move, maybe branch, draw
 ***************************************************/

import { Perlin } from "./perlin.js";
import {
  GROWTH_RADIUS_FACTOR,
  MAIN_BRANCH_COUNT,
  BASE_LIFE,
  STEP_SIZE,
  TIME_LAPSE_FACTOR,
  BRANCH_CHANCE,
  MAX_BRANCH_DEPTH,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,
  PERLIN_SCALE,
  BACKGROUND_ALPHA,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  MAIN_LINE_WIDTH,
  MAIN_ALPHA,
  SECONDARY_LINE_WIDTH,
  SECONDARY_ALPHA,
  BASE_HUE,
  BASE_LIGHTNESS
} from "./constants.js";

export type GrowthType = "main" | "secondary";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number;
  depth: number;
  growthType: GrowthType;
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

    // create main trunks from center
    for (let i = 0; i < MAIN_BRANCH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.tips.push({
        x: this.centerX,
        y: this.centerY,
        angle,
        life: BASE_LIFE,
        depth: 0,
        growthType: "main"
      });
    }
  }

  public updateAndDraw() {
    // mild fade
    this.ctx.fillStyle = `rgba(0, 0, 0, ${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // do sub-steps => time-lapse
    for (let i = 0; i < TIME_LAPSE_FACTOR; i++) {
      this.simOneStep();
    }
  }

  private simOneStep() {
    const newTips: HyphaTip[] = [];

    for (const tip of this.tips) {
      if (tip.life <= 0) continue;

      const oldX = tip.x;
      const oldY = tip.y;

      // Perlin-based angle drift
      const nVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      tip.angle += nVal * ANGLE_DRIFT_STRENGTH;

      // Wiggle
      const nVal2 = this.perlin.noise2D(
        (tip.x + 1234) * PERLIN_SCALE,
        (tip.y + 1234) * PERLIN_SCALE
      );
      const wiggle = nVal2 * WIGGLE_STRENGTH;

      // Move
      tip.x += Math.cos(tip.angle) * STEP_SIZE
             + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      tip.y += Math.sin(tip.angle) * STEP_SIZE
             + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // boundary
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
      } else {
        tip.life--;
        // draw
        this.drawSegment(oldX, oldY, tip.x, tip.y, tip.growthType, dist, tip.depth);

        // maybe branch
        if (
          tip.growthType === "main" &&
          tip.depth < MAX_BRANCH_DEPTH &&
          Math.random() < BRANCH_CHANCE
        ) {
          newTips.push({
            x: tip.x,
            y: tip.y,
            angle: tip.angle + (Math.random() - 0.5) * Math.PI,
            life: tip.life * 0.8,  // decays a bit
            depth: tip.depth + 1,
            growthType: "secondary"
          });
        }
      }
    }

    this.tips.push(...newTips);
    // prune dead
    this.tips = this.tips.filter(t => t.life > 0);
  }

  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    type: GrowthType,
    distFromCenter: number,
    depth: number
  ) {
    let lineWidth = 1;
    let alpha = 0.5;

    if (type === "main") {
      lineWidth = MAIN_LINE_WIDTH;
      alpha = MAIN_ALPHA;
    } else {
      lineWidth = SECONDARY_LINE_WIDTH;
      alpha = SECONDARY_ALPHA;
    }

    // fade near boundary
    const fs = this.growthRadius * FADE_START_FACTOR;
    const fe = this.growthRadius * FADE_END_FACTOR;
    let fadeFactor = 1;
    if (distFromCenter > fs) {
      fadeFactor = 1 - (distFromCenter - fs) / (fe - fs);
      fadeFactor = Math.max(fadeFactor, 0);
    }
    alpha *= fadeFactor;

    // color shift
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
