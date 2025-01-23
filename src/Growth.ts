// src/growth.ts

import { Perlin } from "./Perlin.js";
import { 
  GROWTH_RADIUS_FACTOR,
  MAIN_BRANCH_COUNT,
  STEP_SIZE,
  GROWTH_SPEED_MULTIPLIER,
  BASE_LIFE,
  BRANCH_DECAY,
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
  LIGHTNESS_STEP,
  NUTRIENT_CONSUMPTION_RATE,
  SHADOW_BLUR,
  SHADOW_COLOR,
  ANASTOMOSIS_RADIUS,
  SECONDARY_FAN_COUNT,
  WIDER_SECONDARY_ANGLE,
  TIME_LAPSE_FACTOR,
  INITIAL_RESOURCE_PER_TIP
} from "./constants.js";

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
    private network: MycelialNetwork // Injecting the network for resource flow
  ) {
    this.growthRadius = Math.min(width, height) * GROWTH_RADIUS_FACTOR;
    console.log(`GrowthManager initialized with growthRadius: ${this.growthRadius}`);
  }

  /**
   * Initializes the growth simulation by creating main trunks.
   */
  public init() {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
    this.ctx.clearRect(0, 0, this.width, this.height); // Clear the canvas

    // Create main trunks from the center
    for (let i = 0; i < MAIN_BRANCH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const newTip: HyphaTip = {
        x: this.centerX,
        y: this.centerY,
        angle,
        life: BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: INITIAL_RESOURCE_PER_TIP
      };
      this.tips.push(newTip);
      console.log(`Initialized main tip ${i + 1}:`, newTip);
    }

    // Create network nodes for each main branch
    this.tips.forEach(tip => {
      const nodeId = this.network.createNode(tip.x, tip.y, tip.resource);
      console.log(`Created network node ${nodeId} for tip at (${tip.x}, ${tip.y})`);
    });

    // Optional: Draw a test line to verify drawing (can be removed)
    // this.ctx.strokeStyle = "white";
    // this.ctx.lineWidth = 2;
    // this.ctx.beginPath();
    // this.ctx.moveTo(this.centerX - 50, this.centerY);
    // this.ctx.lineTo(this.centerX + 50, this.centerY);
    // this.ctx.stroke();
    // console.log("Drew test white line across the center.");
  }

  /**
   * Updates the simulation and renders the growth lines.
   * @param currentTime - The current timestamp in milliseconds.
   */
  public updateAndDraw(currentTime: number) {
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Perform multiple simulation steps per frame based on TIME_LAPSE_FACTOR
    const totalSteps = TIME_LAPSE_FACTOR; // Adjust as needed
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Handle resource flow within the network
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
      console.log(`Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) consumed ${consumed} resources. Remaining: ${tip.resource.toFixed(2)}`);

      // If resource is depleted, the tip dies
      if (tip.resource <= 0) {
        tip.life = 0;
        console.log(`Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) has died due to resource depletion.`);
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

      // Calculate variable step size based on resource
      const stepMultiplier = tip.resource / INITIAL_RESOURCE_PER_TIP; // More resources allow larger steps
      const actualStepSize = STEP_SIZE * (0.5 + stepMultiplier * 1.5); // Scale step size between 1*STEP_SIZE to 2.0*STEP_SIZE

      // Move the tip forward
      tip.x += (Math.cos(tip.angle) * actualStepSize + Math.cos(tip.angle + Math.PI / 2) * wiggle * 0.2) * GROWTH_SPEED_MULTIPLIER;
      tip.y += (Math.sin(tip.angle) * actualStepSize + Math.sin(tip.angle + Math.PI / 2) * wiggle * 0.2) * GROWTH_SPEED_MULTIPLIER;

      // Calculate distance from the center to enforce growth radius
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        console.log(`Tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}) has exceeded growth radius.`);
        continue;
      }

      // Decrement life
      tip.life--;

      // Render the segment from old position to new position with dynamic lightness
      this.drawSegment(oldX, oldY, tip.x, tip.y, tip.growthType, tip.depth);

      // Handle branching
      const adjustedBranchChance = BRANCH_CHANCE * (tip.resource / INITIAL_RESOURCE_PER_TIP); // More resources, higher chance
      if (
        tip.depth < MAX_BRANCH_DEPTH &&
        Math.random() < adjustedBranchChance
      ) {
        // Spawn multiple secondary tips based on SECONDARY_FAN_COUNT and WIDER_SECONDARY_ANGLE
        for (let i = 0; i < SECONDARY_FAN_COUNT; i++) {
          // Introduce more randomization in angle offset
          const angleOffset = (Math.random() - 0.5) * WIDER_SECONDARY_ANGLE;
          const newAngle = tip.angle + angleOffset + (Math.random() - 0.5) * 0.2; // Additional small random adjustment

          const newTip: HyphaTip = {
            x: tip.x,
            y: tip.y,
            angle: newAngle,
            life: Math.max(tip.life * BRANCH_DECAY, BASE_LIFE * 0.5), // Ensure a minimum lifespan
            depth: tip.depth + 1,
            growthType: "secondary", // All new branches are secondary
            resource: INITIAL_RESOURCE_PER_TIP * 0.8 // Slightly reduced resource
          };

          newTips.push(newTip);
          console.log(`Spawned new secondary tip at (${newTip.x.toFixed(2)}, ${newTip.y.toFixed(2)}) with angle ${newTip.angle.toFixed(2)}.`);
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
        console.log(`Added new tip at (${newTip.x.toFixed(2)}, ${newTip.y.toFixed(2)}).`);
      } else {
        console.log(`New tip at (${newTip.x.toFixed(2)}, ${newTip.y.toFixed(2)}) fused due to proximity.`);
      }
      // If too close, the newTip is not added (fuses with existing)
    }

    // Remove dead tips
    const deadTips = this.tips.filter(t => t.life <= 0);
    if (deadTips.length > 0) {
      console.log(`Removing ${deadTips.length} dead tips.`);
      this.tips = this.tips.filter(t => t.life > 0);
    }

    // Optional: Tip Culling to Control Performance
    const MAX_ACTIVE_TIPS = 1000; // Adjust as needed
    if (this.tips.length > MAX_ACTIVE_TIPS) {
      console.log(`Maximum active tips reached (${MAX_ACTIVE_TIPS}). Removing oldest tips.`);
      this.tips.splice(0, this.tips.length - MAX_ACTIVE_TIPS);
    }
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
  ) {
    // Calculate lightness based on depth
    let calculatedLightness = BASE_LIGHTNESS + (depth * LIGHTNESS_STEP);
    if (calculatedLightness > 100) calculatedLightness = 100; // Cap lightness at 100%

    // Determine line style based on growth type
    let lineWidth: number;
    let alpha: number;
    let saturation: number;
    let lightness: number;
    let hue: number;

    if (type === "main") {
      lineWidth = MAIN_LINE_WIDTH;
      alpha = MAIN_ALPHA;
      hue = BASE_HUE;               // 0
      saturation = 0;               // 0% for white
      lightness = calculatedLightness;   // Dynamic lightness based on depth
    } else {
      lineWidth = SECONDARY_LINE_WIDTH;
      alpha = SECONDARY_ALPHA;
      hue = BASE_HUE;               // 0
      saturation = 0;               // 0% for white
      lightness = calculatedLightness;   // Dynamic lightness based on depth
    }

    // Use hsla with dynamic lightness
    this.ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    // Enhance shadow for better visibility
    this.ctx.shadowBlur = SHADOW_BLUR;
    this.ctx.shadowColor = SHADOW_COLOR;

    // Draw the line segment
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();
    console.log(`Drew ${type} segment from (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) to (${newX.toFixed(2)}, ${newY.toFixed(2)}), Lightness: ${lightness}%`);

    // Reset shadow to prevent it from affecting other drawings
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }

  /**
   * (Optional) Draws a small circle at the hyphal tip position for debugging.
   * Uncomment if you want to visualize tip positions.
   * @param tip - The hyphal tip to draw.
   */
  // private drawHyphaTip(tip: HyphaTip) {
  //   const radius = 2;
  //   this.ctx.beginPath();
  //   this.ctx.arc(tip.x, tip.y, radius, 0, Math.PI * 2);
  //   this.ctx.fillStyle = 'white'; // Bright color for visibility
  //   this.ctx.fill();
  //   console.log(`Drew hyphal tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}).`);
  // }

  /**
   * Clears the simulation.
   * Useful for resetting the simulation.
   */
  public clear() {
    this.tips = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
    console.log("Simulation cleared.");
  }
}
