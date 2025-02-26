// src/growth.ts

import { Perlin } from "./Perlin.js";
import { config } from "./constants.js"; // Import the config object

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";

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
    private network: MycelialNetwork, // Injecting the network for resource flow
  ) {
    this.growthRadius = Math.min(width, height) * config.GROWTH_RADIUS_FACTOR;
    console.log(
      `GrowthManager initialized with growthRadius: ${this.growthRadius}`,
    );
  }

  /**
   * Initializes the growth simulation by creating main trunks.
   */
  public init(): void {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
    this.ctx.clearRect(0, 0, this.width, this.height); // Clear the canvas

    // Create main trunks from the center
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      const angle: number = Math.random() * Math.PI * 2;
      const newTip: HyphaTip = {
        x: this.centerX,
        y: this.centerY,
        angle,
        life: config.BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: config.INITIAL_RESOURCE_PER_TIP,
      };
      this.tips.push(newTip);
      console.log(`Initialized main tip ${i + 1}:`, newTip);
    }

    // Create network nodes for each main branch
    this.tips.forEach((tip: HyphaTip): void => {
      const nodeId: number = this.network.createNode(tip.x, tip.y, tip.resource);
      console.log(`Created network node ${nodeId} for tip at (${tip.x}, ${tip.y})`);
    });
  }

  /**
   * Updates the simulation and renders the growth lines.
   */
  public updateAndDraw(): void {
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${config.BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Perform multiple simulation steps per frame based on TIME_LAPSE_FACTOR
    const totalSteps: number = config.TIME_LAPSE_FACTOR; // Number of simulation steps per frame
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Handle resource flow within the network
    this.network.flowResources();
  }

  /**
   * Simulates a single step of hyphal growth.
   */
  private simOneStep(): void {
    const newTips: HyphaTip[] = [];

    for (const tip of this.tips) {
      if (tip.life <= 0) continue;

      // Consume nutrient from the environment
      const consumed: number = this.envGPU.consumeResource(tip.x, tip.y, config.NUTRIENT_CONSUMPTION_RATE);
      tip.resource -= consumed;
      console.log(
        `Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) consumed ${consumed} resources. Remaining: ${tip.resource.toFixed(2)}`,
      );

      // If resource is depleted, the tip dies
      if (tip.resource <= 0) {
        tip.life = 0;
        console.log(
          `Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) has died due to resource depletion.`,
        );
        continue;
      }

      const oldX: number = tip.x;
      const oldY: number = tip.y;

      // Update angle based on Perlin noise for smooth drift
      const nVal: number = this.perlin.noise2D(tip.x * config.PERLIN_SCALE, tip.y * config.PERLIN_SCALE);
      tip.angle += nVal * config.ANGLE_DRIFT_STRENGTH;

      // Apply wiggle for additional randomness
      const nVal2: number = this.perlin.noise2D((tip.x + 1234) * config.PERLIN_SCALE, (tip.y + 1234) * config.PERLIN_SCALE);
      const wiggle: number = nVal2 * config.WIGGLE_STRENGTH;

      // Calculate variable step size based on resource level
      const stepMultiplier: number = tip.resource / config.INITIAL_RESOURCE_PER_TIP; // More resources allow larger steps
      const actualStepSize: number = config.STEP_SIZE * (0.5 + stepMultiplier * 1.5); // Scale step size between 1*STEP_SIZE to 2.0*STEP_SIZE

      // Move the tip forward with both directional movement and lateral wiggle
      tip.x += (Math.cos(tip.angle) * actualStepSize + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2) * config.GROWTH_SPEED_MULTIPLIER;
      tip.y += (Math.sin(tip.angle) * actualStepSize + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2) * config.GROWTH_SPEED_MULTIPLIER;

      // Enforce growth boundary based on distance from the center
      const dist: number = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        console.log(
          `Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) has exceeded growth radius.`,
        );
        continue;
      }

      // Decrement life of the tip
      tip.life--;

      // Render the segment from old position to new position
      this.drawSegment(oldX, oldY, tip.x, tip.y, tip.growthType, tip.depth);

      // Handle branching logic
      const adjustedBranchChance: number = config.BRANCH_CHANCE * (tip.resource / config.INITIAL_RESOURCE_PER_TIP);
      if (tip.depth < config.MAX_BRANCH_DEPTH && Math.random() < adjustedBranchChance) {
        for (let i = 0; i < config.SECONDARY_FAN_COUNT; i++) {
          const angleOffset: number = (Math.random() - 0.5) * config.WIDER_SECONDARY_ANGLE;
          const newAngle: number = tip.angle + angleOffset + (Math.random() - 0.5) * 0.1;

          const spawnDistance: number = config.STEP_SIZE * config.GROWTH_SPEED_MULTIPLIER;
          const spawnX: number = tip.x + Math.cos(newAngle) * spawnDistance;
          const spawnY: number = tip.y + Math.sin(newAngle) * spawnDistance;

          const newTip: HyphaTip = {
            x: spawnX,
            y: spawnY,
            angle: newAngle,
            life: Math.max(tip.life * config.BRANCH_DECAY, config.BASE_LIFE * 0.5),
            depth: tip.depth + 1,
            growthType: "secondary",
            resource: config.INITIAL_RESOURCE_PER_TIP * 0.8
          };
          newTips.push(newTip);
          console.log(
            `Spawned new secondary tip at (${newTip.x.toFixed(2)}, ${newTip.y.toFixed(2)}) with angle ${newTip.angle.toFixed(2)}.`,
          );
        }
      }
    }

    // Anastomosis: filter new tips that are too close to existing ones
    for (const newTip of newTips) {
      const isTooClose: boolean = this.tips.some((tip: HyphaTip): boolean => {
        const distance: number = Math.hypot(newTip.x - tip.x, newTip.y - tip.y);
        return distance < config.ANASTOMOSIS_RADIUS && tip.growthType !== newTip.growthType;
      });
      if (isTooClose) {
        newTip.life = 0;
      }
    }

    // Append viable new tips to the existing tips
    this.tips = this.tips.concat(newTips.filter((tip: HyphaTip): boolean => tip.life > 0));
  }

  /**
   * Clears the simulation.
   * Useful for resetting the simulation.
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.tips = [];
  }

  /**
   * Draws a line segment between two points with styling based on growth type and depth.
   * @param oldX - Starting X-coordinate.
   * @param oldY - Starting Y-coordinate.
   * @param newX - Ending X-coordinate.
   * @param newY - Ending Y-coordinate.
   * @param type - Type of growth ("main" or "secondary").
   * @param depth - Depth of the current tip for lightness calculation.
   */
  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    type: GrowthType,
    depth: number
  ): void {
    // Calculate lightness based on depth
    let calculatedLightness: number = config.BASE_LIGHTNESS + (depth * config.LIGHTNESS_STEP);
    if (calculatedLightness > 100) calculatedLightness = 100; // Cap lightness at 100%

    // Determine line style based on growth type
    let lineWidth: number;
    let alpha: number;
    let saturation: number;
    let lightness: number;
    let hue: number;

    if (type === "main") {
      lineWidth = config.MAIN_LINE_WIDTH;
      alpha = config.MAIN_ALPHA;
      hue = config.BASE_HUE; // 0
      saturation = 0; // 0% for white
      lightness = calculatedLightness; // Dynamic lightness based on depth
    } else {
      lineWidth = config.SECONDARY_LINE_WIDTH;
      alpha = config.SECONDARY_ALPHA;
      hue = config.BASE_HUE; // 0
      saturation = 0; // 0% for white
      lightness = calculatedLightness; // Dynamic lightness based on depth
    }
    console.log(`Drawing segment: (${oldX}, ${oldY}) -> (${newX}, ${newY})`);

    // Use hsla with dynamic lightness
    this.ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    // Enhance shadow for better visibility
    this.ctx.shadowBlur = config.SHADOW_BLUR;
    this.ctx.shadowColor = config.SHADOW_COLOR;

    // Draw the line segment
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
    console.log(
      `Drew ${type} segment from (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) to (${newX.toFixed(2)}, ${newY.toFixed(2)}), Lightness: ${lightness}%`,
    );

    // Reset shadow to prevent it from affecting other drawings
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }

  /**
   * (Optional) Draws a small circle at the hyphal tip position for debugging.
   * Uncomment if you want to visualize tip positions.
   * @param tip - The hyphal tip to draw.
   */
  private drawHyphaTip(tip: HyphaTip): void {
    const radius: number = 2;
    this.ctx.beginPath();
    this.ctx.arc(tip.x, tip.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white"; // Bright color for visibility
    this.ctx.fill();
    console.log(
      `Drew hyphal tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}).`,
    );
  }
}
