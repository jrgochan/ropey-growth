/***************************************************
 * growth.ts
 * 
 * Iterative logic bridging environment + network:
 * - Manages an array of 'tips'
 * - Moves them step-by-step, fanning out secondaries
 * - Resource constraints are loosened:
 *   - We do NOT kill tips if node.resource < 0.1 
 ***************************************************/

import { EnvironmentGrid } from "./environment.js";
import { MycelialNetwork } from "./mycelialNetwork.js";
import { Perlin } from "./Perlin.js";

import {
  STEP_SIZE,
  BASE_LIFE,
  BRANCH_DECAY,
  BRANCH_CHANCE,
  MAX_BRANCH_DEPTH,
  ANASTOMOSIS_RADIUS,

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
  nodeId: number;
  angle: number;
  life: number;
  depth: number;
  growthType: GrowthType;
}

export class GrowthManager {
  private tips: HyphaTip[] = [];

  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private growthRadius: number,
    private environment: EnvironmentGrid,
    private network: MycelialNetwork,
    private perlin: Perlin
  ) {}

  public init(mainBranchCount: number) {
    this.tips = [];

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create main trunk tips
    for (let i = 0; i < mainBranchCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const nodeId = this.network.createNode(this.centerX, this.centerY);
      this.tips.push({
        nodeId,
        angle,
        life: BASE_LIFE,
        depth: 0,
        growthType: "main"
      });
    }
  }

  public updateAndDraw() {
    // Slight fade each frame
    this.ctx.fillStyle = `rgba(0,0,0,${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    // Time-lapse: multiple sub-steps
    for (let i = 0; i < TIME_LAPSE_FACTOR; i++) {
      this.simulateOneStep();
    }
  }

  private simulateOneStep() {
    // Flow resources
    this.network.flowResources();

    // Environment update
    this.environment.updateEnvironment();

    const newTips: HyphaTip[] = [];

    for (let i = 0; i < this.tips.length; i++) {
      const tip = this.tips[i];
      if (tip.life <= 0) continue;

      const node = this.network.getNode(tip.nodeId);
      if (!node) continue;

      const oldX = node.x;
      const oldY = node.y;

      // Perlin drift
      const noiseVal = this.perlin.noise2D(node.x * PERLIN_SCALE, node.y * PERLIN_SCALE);
      tip.angle += noiseVal * ANGLE_DRIFT_STRENGTH;

      // Perlin wiggle
      const noiseVal2 = this.perlin.noise2D(
        (node.x + 1000) * PERLIN_SCALE,
        (node.y + 1000) * PERLIN_SCALE
      );
      const wiggle = noiseVal2 * WIGGLE_STRENGTH;

      // Normal step
      const stepX = node.x + Math.cos(tip.angle) * STEP_SIZE
        + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2;
      const stepY = node.y + Math.sin(tip.angle) * STEP_SIZE
        + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2;

      // Boundary
      const dist = Math.hypot(stepX - this.centerX, stepY - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // anastomosis
      const nearNodeId = this.findNodeCloseTo(stepX, stepY, ANASTOMOSIS_RADIUS);
      let newNodeId: number;
      if (nearNodeId >= 0) {
        newNodeId = nearNodeId;
      } else {
        newNodeId = this.network.createNode(stepX, stepY);
      }

      this.network.connectNodes(tip.nodeId, newNodeId);
      tip.nodeId = newNodeId;
      tip.life--;

      // consume resource
      const consumed = this.environment.consumeResource(stepX, stepY, NUTRIENT_CONSUMPTION_RATE);
      const cNode = this.network.getNode(newNodeId);
      if (cNode) {
        cNode.resource += consumed;
        // Removing the 'if (cNode.resource < 0.1) tip.life=0' => no starve
      }

      // draw
      this.drawSegment(oldX, oldY, stepX, stepY, tip, dist);

      // spawn secondaries?
      if (tip.growthType === "main" && tip.depth < MAX_BRANCH_DEPTH && Math.random() < BRANCH_CHANCE) {
        for (let fc = 0; fc < SECONDARY_FAN_COUNT; fc++) {
          const spread = (Math.random() - 0.5) * WIDER_SECONDARY_ANGLE;
          const branchAngle = tip.angle + spread;
          newTips.push({
            nodeId: newNodeId,
            angle: branchAngle,
            life: tip.life * BRANCH_DECAY,
            depth: tip.depth + 1,
            growthType: "secondary"
          });
        }
      }
    }

    this.tips.push(...newTips);
    this.tips = this.tips.filter(t => t.life > 0);
  }

  private findNodeCloseTo(x: number, y: number, radius: number): number {
    const allNodes = this.network.getAllNodes();
    for (const n of allNodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < radius) {
        return n.id;
      }
    }
    return -1;
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
    const fadeEnd   = this.growthRadius * FADE_END_FACTOR;
    if (distFromCenter > fadeStart) {
      fadeFactor = 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
      fadeFactor = Math.max(fadeFactor, 0);
    }
    alpha *= fadeFactor;

    const hueShift = Math.floor(Math.random() * 30) - 15;
    const hue = BASE_HUE + hueShift;

    this.ctx.strokeStyle = `hsla(${hue}, 20%, ${BASE_LIGHTNESS}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
  }
}
