/***************************************************
 * growth.ts
 *
 * Iterative mycelium approach:
 *  - Manages an array of tips
 *  - Each step, moves them, draws lines
 *  - Possibly spawns secondaries
 *  - Resource is consumed from EnvironmentGrid
 *  - Caps total # of tips to prevent runaway
 ***************************************************/

import { EnvironmentGrid } from "./environment.js";
import { Perlin } from "./perlin.js";

import {
  STEP_SIZE,
  BASE_LIFE,
  BRANCH_DECAY,
  BRANCH_CHANCE,
  MAX_BRANCH_DEPTH,
  ANASTOMOSIS_RADIUS,
  MAX_TIPS,

  PERLIN_SCALE,
  ANGLE_DRIFT_STRENGTH,
  WIGGLE_STRENGTH,

  BACKGROUND_ALPHA,
  SHADOW_BLUR,
  SHADOW_COLOR,
  MAIN_LINE_WIDTH,
  SECONDARY_LINE_WIDTH,
  MAIN_ALPHA,
  SECONDARY_ALPHA,
  BASE_HUE,
  BASE_LIGHTNESS,
  FADE_START_FACTOR,
  FADE_END_FACTOR,
  NUTRIENT_CONSUMPTION_RATE,

  TIME_LAPSE_FACTOR,
  SECONDARY_FAN_COUNT,
  WIDER_SECONDARY_ANGLE
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
  private nodePositions: { x: number; y: number }[] = []; // for anastomosis, if needed

  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private growthRadius: number,
    private environment: EnvironmentGrid,
    private perlin: Perlin
  ) {}

  public init(mainBranchCount: number) {
    this.tips = [];
    this.nodePositions = [];

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create main trunk tips at center
    for (let i = 0; i < mainBranchCount; i++) {
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

    // Optionally store center as a 'node' for anastomosis
    this.nodePositions.push({ x: this.centerX, y: this.centerY });
  }

  public updateAndDraw() {
    // Slight fade
    this.ctx.fillStyle = `rgba(0,0,0,${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    // multiple sub-steps => time-lapse
    for (let i = 0; i < TIME_LAPSE_FACTOR; i++) {
      this.simulateOneStep();
    }
  }

  private simulateOneStep() {
    // 1) Environment update
    this.environment.updateEnvironment();

    const newTips: HyphaTip[] = [];

    for (let i = 0; i < this.tips.length; i++) {
      const tip = this.tips[i];
      if (tip.life <= 0) continue;

      const oldX = tip.x;
      const oldY = tip.y;

      // Perlin-based angle drift
      const noiseVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      tip.angle += noiseVal * ANGLE_DRIFT_STRENGTH;

      // Wiggle
      const noiseVal2 = this.perlin.noise2D((tip.x + 1000) * PERLIN_SCALE, (tip.y + 1000) * PERLIN_SCALE);
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // Move
      tip.x += Math.cos(tip.angle) * STEP_SIZE + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      tip.y += Math.sin(tip.angle) * STEP_SIZE + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // boundary
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      tip.life--;

      // consume resource
      const consumed = this.environment.consumeResource(tip.x, tip.y, NUTRIENT_CONSUMPTION_RATE);
      // if consumed is near 0 => starve?
      if (consumed < 0.001) {
        // optional: kill tip
        // tip.life = 0;
        // but let's keep it alive so it doesn't get stuck
      }

      // anastomosis? see if we are near an existing node
      // not strictly needed, but if you want fusing:
      const nodeId = this.findNodeCloseTo(tip.x, tip.y, ANASTOMOSIS_RADIUS);
      if (nodeId >= 0) {
        // fuse => set tip to that exact node pos?
        tip.x = this.nodePositions[nodeId].x;
        tip.y = this.nodePositions[nodeId].y;
      } else {
        // create new node
        this.nodePositions.push({ x: tip.x, y: tip.y });
      }

      // draw
      this.drawSegment(oldX, oldY, tip.x, tip.y, tip, dist);

      // possibly spawn secondaries
      if (
        tip.growthType === "main" &&
        tip.depth < MAX_BRANCH_DEPTH &&
        Math.random() < BRANCH_CHANCE &&
        this.tips.length + newTips.length < MAX_TIPS
      ) {
        for (let fc = 0; fc < SECONDARY_FAN_COUNT; fc++) {
          // fan out around tip.angle
          const spread = (Math.random() - 0.5) * WIDER_SECONDARY_ANGLE;
          const branchAngle = tip.angle + spread;
          newTips.push({
            x: tip.x,
            y: tip.y,
            angle: branchAngle,
            life: tip.life * BRANCH_DECAY,
            depth: tip.depth + 1,
            growthType: "secondary"
          });
        }
      }
    }

    // add newly spawned tips
    this.tips.push(...newTips);

    // prune dead
    this.tips = this.tips.filter(t => t.life > 0);
  }

  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    tip: HyphaTip,
    distFromCenter: number
  ) {
    let lineWidth = 1;
    let alpha = 0.5;
    if (tip.growthType === "main") {
      lineWidth = MAIN_LINE_WIDTH;
      alpha = MAIN_ALPHA;
    } else {
      lineWidth = SECONDARY_LINE_WIDTH;
      alpha = SECONDARY_ALPHA;
    }

    let fadeFactor = 1;
    const fadeStart = this.growthRadius * FADE_START_FACTOR;
    const fadeEnd = this.growthRadius * FADE_END_FACTOR;
    if (distFromCenter > fadeStart) {
      fadeFactor = 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }
    alpha *= fadeFactor;

    // color
    const hueShift = Math.floor(Math.random() * 30) - 15;
    const hue = BASE_HUE + hueShift;
    this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
  }

  private findNodeCloseTo(x: number, y: number, radius: number): number {
    for (let i = 0; i < this.nodePositions.length; i++) {
      const nx = this.nodePositions[i].x;
      const ny = this.nodePositions[i].y;
      const d = Math.hypot(nx - x, ny - y);
      if (d < radius) {
        return i; // return index
      }
    }
    return -1;
  }
}
