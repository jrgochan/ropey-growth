/***************************************************
 * growth.ts
 *
 * Advanced Mycelial Growth Simulation:
 * - Incorporates all constants for realistic behavior
 * - Resource consumption from EnvironmentGPU
 * - Multiple branching per tip with fan count and angle spread
 * - Implements branch decay
 * - Prevents anastomosis (fusing) by removing tips that come too close
 ***************************************************/

import { Perlin } from "./Perlin.js";
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
  MAIN_LINE_WIDTH,
  MAIN_ALPHA,
  SECONDARY_LINE_WIDTH,
  SECONDARY_ALPHA,
  BASE_HUE,
  BASE_LIGHTNESS,
  BRANCH_DECAY,
  ANASTOMOSIS_RADIUS,
  INITIAL_RESOURCE_PER_TIP,
  RESOURCE_FLOW_RATE,
  SECONDARY_FAN_COUNT,
  WIDER_SECONDARY_ANGLE,
  SHADOW_BLUR,
  SHADOW_COLOR,
  NUTRIENT_CONSUMPTION_RATE,
  GROWTH_SPEED_MULTIPLIER // Imported from constants.ts
} from "./constants.js";

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js"; // Ensure this is correctly imported and used

export type GrowthType = "main" | "secondary";

export interface HyphaTip {
  x: number;
  y: number;
  angle: number;
  life: number;
  depth: number;
  growthType: GrowthType;
  resource: number; // Tracks the resource available to the tip
}

/**
 * GrowthManager class handles the simulation of hyphal growth.
 */
export class GrowthManager {
  private tips: HyphaTip[] = [];
  private growthRadius: number;

  /**
   * Constructor initializes the GrowthManager.
   * @param ctx - The 2D rendering context of the main canvas.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   * @param centerX - X-coordinate of the center.
   * @param centerY - Y-coordinate of the center.
   * @param perlin - Instance of Perlin noise generator.
   * @param envGPU - Instance of EnvironmentGPU for resource management.
   * @param network - Instance of MycelialNetwork for resource flow management.
   */
  constructor(
    private ctx: CanvasRenderingContext2D,
    private width: number,
    private height: number,
    private centerX: number,
    private centerY: number,
    private perlin: Perlin,
    private envGPU: EnvironmentGPU,
    private network: MycelialNetwork // Injecting the network for resource flow
  ) {
    this.growthRadius = Math.min(width, height) * GROWTH_RADIUS_FACTOR;
  }

  /**
   * Initializes the growth simulation by creating main trunks.
   */
  public init() {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Opaque black background
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create main trunks from the center
    for (let i = 0; i < MAIN_BRANCH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.tips.push({
        x: this.centerX,
        y: this.centerY,
        angle,
        life: BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: INITIAL_RESOURCE_PER_TIP
      });
    }

    // Optionally, create network nodes for each main branch
    this.tips.forEach(tip => {
      const nodeId = this.network.createNode(tip.x, tip.y, tip.resource);
      // Further connections can be established based on simulation needs
    });
  }

  /**
   * Updates the simulation and renders the growth lines.
   */
  public updateAndDraw() {
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Perform multiple simulation steps per frame based on TIME_LAPSE_FACTOR
    const totalSteps = TIME_LAPSE_FACTOR; // Adjust as needed
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Optionally, handle resource flow within the network
    this.network.flowResources();
  }

  /**
   * Simulates a single step of hyphal growth.
   */
  private simOneStep() {
    const newTips: HyphaTip[] = [];

    for (const tip of this.tips) {
      if (tip.life <= 0) continue;

      // Consume nutrient from the environment
      const consumed = this.envGPU.consumeResource(tip.x, tip.y, NUTRIENT_CONSUMPTION_RATE);
      tip.resource -= consumed;

      // If resource is depleted, the tip dies
      if (tip.resource <= 0) {
        tip.life = 0;
        continue;
      }

      const oldX = tip.x;
      const oldY = tip.y;

      // Update angle based on Perlin noise for smooth drift
      const nVal = this.perlin.noise2D(tip.x * PERLIN_SCALE, tip.y * PERLIN_SCALE);
      tip.angle += nVal * ANGLE_DRIFT_STRENGTH;

      // Apply wiggle for additional randomness
      const nVal2 = this.perlin.noise2D(
        (tip.x + 1234) * PERLIN_SCALE,
        (tip.y + 1234) * PERLIN_SCALE
      );
      const wiggle = nVal2 * WIGGLE_STRENGTH;

      // Move the tip forward
      tip.x += (Math.cos(tip.angle) * STEP_SIZE + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2) * GROWTH_SPEED_MULTIPLIER;
      tip.y += (Math.sin(tip.angle) * STEP_SIZE + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2) * GROWTH_SPEED_MULTIPLIER;

      // Calculate distance from the center to enforce growth radius
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Decrement life
      tip.life--;

      // Render the segment from old position to new position
      this.drawSegment(oldX, oldY, tip.x, tip.y, tip.growthType);

      // Handle branching
      if (
        tip.growthType === "main" &&
        tip.depth < MAX_BRANCH_DEPTH &&
        Math.random() < BRANCH_CHANCE
      ) {
        // Spawn multiple secondary tips based on SECONDARY_FAN_COUNT and WIDER_SECONDARY_ANGLE
        for (let i = 0; i < SECONDARY_FAN_COUNT; i++) {
          const angleOffset = (Math.random() - 0.5) * WIDER_SECONDARY_ANGLE;
          const newAngle = tip.angle + angleOffset;

          newTips.push({
            x: tip.x,
            y: tip.y,
            angle: newAngle,
            life: tip.life * BRANCH_DECAY,
            depth: tip.depth + 1,
            growthType: "secondary",
            resource: INITIAL_RESOURCE_PER_TIP
          });
        }
      }
    }

    // Handle Anastomosis: Remove new tips that are too close to existing tips
    for (const newTip of newTips) {
      const isTooClose = this.tips.some(tip => {
        const distance = Math.hypot(newTip.x - tip.x, newTip.y - tip.y);
        return distance < ANASTOMOSIS_RADIUS && tip.growthType !== newTip.growthType;
      });

      if (!isTooClose) {
        this.tips.push(newTip);
      }
      // If too close, the newTip is not added (fuses with existing)
    }

    // Remove dead tips
    this.tips = this.tips.filter(t => t.life > 0);
  }

  /**
   * Draws a line segment between two points with styling based on growth type.
   * @param oldX - Starting X-coordinate.
   * @param oldY - Starting Y-coordinate.
   * @param newX - Ending X-coordinate.
   * @param newY - Ending Y-coordinate.
   * @param type - Type of growth ("main" or "secondary").
   */
  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    type: GrowthType
  ) {
    // Determine line style based on growth type
    let lineWidth: number;
    let alpha: number;
    if (type === "main") {
      lineWidth = MAIN_LINE_WIDTH; // e.g., 6.0
      alpha = MAIN_ALPHA;           // e.g., 1
    } else {
      lineWidth = SECONDARY_LINE_WIDTH; // e.g., 3.0
      alpha = SECONDARY_ALPHA;           // e.g., 0.7
    }

    // Apply subtle color variation
    const hueShift = Math.floor(Math.random() * 20) - 10; // ±10 degrees
    const hue = BASE_HUE + hueShift;

    // Set stroke style with increased saturation for visibility
    this.ctx.strokeStyle = `hsla(${hue}, 100%, ${BASE_LIGHTNESS}%, ${alpha})`; // High saturation for bright lines
    this.ctx.lineWidth = lineWidth;

    // Apply shadows for depth effect
    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    // Draw the line segment
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();

    // Reset shadow to prevent it from affecting other drawings
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }
}
