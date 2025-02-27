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
  public init() {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
    this.ctx.clearRect(0, 0, this.width, this.height); // Clear the canvas

    // Give the network a reference to the environment for path usage tracking
    if ('setEnvironment' in this.network) {
      this.network.setEnvironment(this.envGPU);
    }

    // Create main trunks from the center
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      // Calculate a more uniform distribution of angles
      const angle = (i / config.MAIN_BRANCH_COUNT) * Math.PI * 2;
      // Add a small random variation to each angle
      const angleVariation = (Math.random() - 0.5) * (Math.PI / config.MAIN_BRANCH_COUNT);
      
      const newTip: HyphaTip = {
        x: this.centerX,
        y: this.centerY,
        angle: angle + angleVariation,
        life: config.BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: config.INITIAL_RESOURCE_PER_TIP,
      };
      this.tips.push(newTip);
    }

    // Create network nodes for each main branch
    this.tips.forEach((tip) => {
      const nodeId = this.network.createNode(tip.x, tip.y, tip.resource);
    });
    
    // Seed initial nutrient pockets to create heterogeneous environment
    for (let i = 0; i < 20; i++) {
      // Create pockets in a ring around the center
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.growthRadius * 0.7; // Within 70% of growth radius
      
      const pocketX = this.centerX + Math.cos(angle) * distance;
      const pocketY = this.centerY + Math.sin(angle) * distance;
      
      // Add high-nutrient pocket
      this.envGPU.addNutrient(
        pocketX, 
        pocketY, 
        config.NUTRIENT_POCKET_AMOUNT * (1 + Math.random())
      );
    }
    
    // Ensure the environment is diffused before beginning
    this.envGPU.diffuseNutrients();
  }

  /**
   * Updates the simulation and renders the growth lines.
   * @param currentTime - The current timestamp in milliseconds.
   */
  public updateAndDraw(currentTime: number = 0) {
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${config.BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Periodically diffuse nutrients in the environment (every 5 frames)
    if (currentTime % 5 === 0) {
      this.envGPU.diffuseNutrients();
    }
    
    // Periodically add new nutrient pockets (every 200 frames)
    if (currentTime % 200 === 0) {
      // Add a random nutrient pocket somewhere in the growth radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.growthRadius * 0.9;
      
      const pocketX = this.centerX + Math.cos(angle) * distance;
      const pocketY = this.centerY + Math.sin(angle) * distance;
      
      this.envGPU.addNutrient(
        pocketX, 
        pocketY, 
        config.NUTRIENT_POCKET_AMOUNT * 0.5 * (1 + Math.random())
      );
    }

    // Perform multiple simulation steps per frame based on TIME_LAPSE_FACTOR
    const totalSteps = config.TIME_LAPSE_FACTOR;
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Handle resource flow within the network
    this.network.flowResources();
    
    // Optionally render the nutrient environment as a subtle background
    // Uncomment this for debugging or visual effect
    // this.envGPU.drawNutrientGrid(this.ctx);
  }

  /**
   * Simulates a single step of hyphal growth.
   */
  private simOneStep() {
    const newTips: HyphaTip[] = [];
    const activeNodeIds: Map<HyphaTip, number> = new Map(); // Track active node IDs for each tip

    for (const tip of this.tips) {
      if (tip.life <= 0) continue;

      // Consume nutrient from the environment
      const consumed = this.envGPU.consumeResource(
        tip.x,
        tip.y,
        config.NUTRIENT_CONSUMPTION_RATE,
      );
      tip.resource -= consumed;

      // If resource is depleted, the tip dies
      if (tip.resource <= 0) {
        tip.life = 0;
        continue;
      }

      const oldX = tip.x;
      const oldY = tip.y;
      
      // 1. IMPLEMENT CHEMOTROPISM - Get nutrient gradient direction
      const [gradientX, gradientY] = this.envGPU.getNutrientGradient(tip.x, tip.y);
      
      // 2. IMPLEMENT NEGATIVE AUTOTROPISM - Avoid other hyphae
      const [avoidX, avoidY] = this.envGPU.getAvoidanceFactor(
        tip.x, 
        tip.y, 
        config.ANASTOMOSIS_RADIUS * 2
      );
      
      // 3. BASE ANGLE ADJUSTMENT FROM PERLIN NOISE - For natural meandering
      const nVal = this.perlin.noise2D(
        tip.x * config.PERLIN_SCALE,
        tip.y * config.PERLIN_SCALE,
      );
      const perlinAdjustment = nVal * config.ANGLE_DRIFT_STRENGTH;
      
      // 4. APPLY WIGGLE - For randomness
      const nVal2 = this.perlin.noise2D(
        (tip.x + 1234) * config.PERLIN_SCALE,
        (tip.y + 1234) * config.PERLIN_SCALE,
      );
      const wiggle = nVal2 * config.WIGGLE_STRENGTH;
      
      // 5. CALCULATE MOISTURE INFLUENCE - Grow better in moist areas
      const moisture = this.envGPU.getMoisture(tip.x, tip.y) / config.BASE_NUTRIENT;
      const moistureMultiplier = 0.5 + (moisture * config.MOISTURE_FACTOR * 0.5);
      
      // 6. COMBINE DIRECTIONAL INFLUENCES
      // Convert the current angle to a direction vector
      let dirX = Math.cos(tip.angle);
      let dirY = Math.sin(tip.angle);
      
      // Apply chemotropism - bias toward nutrients
      dirX += gradientX * config.CHEMOTROPISM_STRENGTH;
      dirY += gradientY * config.CHEMOTROPISM_STRENGTH;
      
      // Apply negative autotropism - avoid other hyphae
      dirX += avoidX * config.NEGATIVE_AUTOTROPISM_STRENGTH;
      dirY += avoidY * config.NEGATIVE_AUTOTROPISM_STRENGTH;
      
      // Add Perlin noise influence
      dirX += Math.cos(tip.angle + perlinAdjustment);
      dirY += Math.sin(tip.angle + perlinAdjustment);
      
      // Add wiggle
      dirX += Math.cos(tip.angle + Math.PI/2) * wiggle * 0.2;
      dirY += Math.sin(tip.angle + Math.PI/2) * wiggle * 0.2;
      
      // Normalize the direction vector
      const dirMagnitude = Math.sqrt(dirX * dirX + dirY * dirY);
      if (dirMagnitude > 0) {
        dirX /= dirMagnitude;
        dirY /= dirMagnitude;
      }
      
      // Update the tip's angle based on the new direction
      tip.angle = Math.atan2(dirY, dirX);
      
      // 7. CALCULATE GROWTH STEP SIZE - Based on resources and moisture
      const stepMultiplier = tip.resource / config.INITIAL_RESOURCE_PER_TIP;
      const actualStepSize = config.STEP_SIZE * 
        (0.5 + stepMultiplier * 1.5) * // Resource influence
        moistureMultiplier;             // Moisture influence
      
      // 8. MOVE THE TIP
      tip.x += dirX * actualStepSize * config.GROWTH_SPEED_MULTIPLIER;
      tip.y += dirY * actualStepSize * config.GROWTH_SPEED_MULTIPLIER;

      // Check if tip has gone outside the growth radius
      const dist = Math.hypot(tip.x - this.centerX, tip.y - this.centerY);
      if (dist > this.growthRadius) {
        tip.life = 0;
        continue;
      }

      // Decrement life
      tip.life--;
      
      // 9. CREATE OR UPDATE NETWORK NODE FOR THIS TIP
      let currentNodeId: number;
      let previousNodeId: number | undefined;
      
      // Check if we already have a node for this tip from last frame
      if (activeNodeIds.has(tip)) {
        previousNodeId = activeNodeIds.get(tip);
        
        // Create a new node at the new position
        currentNodeId = this.network.createNode(tip.x, tip.y, tip.resource);
        
        // Connect it to the previous node
        if (previousNodeId !== undefined) {
          this.network.connectNodes(previousNodeId, currentNodeId);
        }
      } else {
        // If this is a first step for this tip, just create a node
        currentNodeId = this.network.createNode(tip.x, tip.y, tip.resource);
      }
      
      // Update the mapping
      activeNodeIds.set(tip, currentNodeId);
      
      // 10. RENDER THE SEGMENT - Adjust thickness based on maturity
      let lineThickness = tip.growthType === "main" ? 
        config.MAIN_LINE_WIDTH : config.SECONDARY_LINE_WIDTH;
      
      if (previousNodeId !== undefined) {
        // Get the maturity of this hyphal segment (if any)
        const maturity = this.network.getEdgeMaturity(previousNodeId, currentNodeId);
        
        // Thicken line based on maturity (up to double thickness for fully mature)
        lineThickness *= (1 + maturity);
      }
      
      // Draw with the appropriate thickness
      this.drawSegment(
        oldX, 
        oldY, 
        tip.x, 
        tip.y, 
        tip.growthType, 
        tip.depth, 
        lineThickness
      );

      // 11. HANDLE BRANCHING - More likely in nutrient-rich areas
      const nutrientFactor = Math.min(1, consumed / config.NUTRIENT_CONSUMPTION_RATE);
      const adjustedBranchChance =
        config.BRANCH_CHANCE * 
        (tip.resource / config.INITIAL_RESOURCE_PER_TIP) *  // More resources = more branching
        (0.5 + nutrientFactor * 0.5) *                      // More nutrients = more branching
        moistureMultiplier;                                 // More moisture = more branching
      
      if (
        tip.depth < config.MAX_BRANCH_DEPTH &&
        Math.random() < adjustedBranchChance
      ) {
        // Number of branches varies with nutrient level
        const branchCount = Math.ceil(config.SECONDARY_FAN_COUNT * nutrientFactor);
        
        // Create branches
        for (let i = 0; i < branchCount; i++) {
          // Angle influenced by nutrient gradient (branch toward nutrients)
          const baseAngleOffset = (Math.random() - 0.5) * config.WIDER_SECONDARY_ANGLE;
          
          // Bias angle toward nutrients
          let angleOffset = baseAngleOffset;
          if (gradientX !== 0 || gradientY !== 0) {
            const gradientAngle = Math.atan2(gradientY, gradientX);
            const angleDiff = gradientAngle - tip.angle;
            // Normalize angle difference to [-π, π]
            const normalizedDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
            // Pull the angle offset slightly toward the nutrient gradient
            angleOffset = baseAngleOffset + normalizedDiff * 0.2;
          }
          
          const newAngle = tip.angle + angleOffset;

          // Calculate spawn position slightly ahead
          const spawnDistance = config.STEP_SIZE * config.GROWTH_SPEED_MULTIPLIER;
          const spawnX = tip.x + Math.cos(newAngle) * spawnDistance;
          const spawnY = tip.y + Math.sin(newAngle) * spawnDistance;

          const newTip: HyphaTip = {
            x: spawnX,
            y: spawnY,
            angle: newAngle,
            life: Math.max(
              tip.life * config.BRANCH_DECAY,
              config.BASE_LIFE * 0.5,
            ),
            depth: tip.depth + 1,
            growthType: "secondary",
            resource: config.INITIAL_RESOURCE_PER_TIP * 0.8, // Slightly reduced resource
          };

          newTips.push(newTip);
        }
      }
    }

    // 12. HANDLE ANASTOMOSIS - More biologically accurate fusion
    for (const newTip of newTips) {
      let fusionOccurred = false;
      
      // Check for nearby tips for anastomosis
      for (const existingTip of this.tips) {
        if (existingTip.life <= 0) continue;
        
        const distance = Math.hypot(newTip.x - existingTip.x, newTip.y - existingTip.y);
        
        // For anastomosis, we preferentially fuse with different growth types
        // (main to secondary or vice versa) as this is more biologically accurate
        const differentGrowthType = existingTip.growthType !== newTip.growthType;
        
        // Different growth types fuse at full radius, same type at reduced radius (less likely)
        const effectiveRadius = differentGrowthType ? 
          config.ANASTOMOSIS_RADIUS : 
          config.ANASTOMOSIS_RADIUS * 0.6;
        
        if (distance < effectiveRadius) {
          fusionOccurred = true;
          
          // If anastomosis occurs, we should connect the network nodes
          if (activeNodeIds.has(existingTip)) {
            const existingNodeId = activeNodeIds.get(existingTip);
            
            // Create a node for the new tip at the fusion point
            const fusionNodeId = this.network.createNode(
              existingTip.x, 
              existingTip.y, 
              (existingTip.resource + newTip.resource) * 0.5  // Average resources
            );
            
            // Connect these nodes to create a network loop (important for realistic transport)
            if (existingNodeId !== undefined) {
              this.network.connectNodes(existingNodeId, fusionNodeId);
            }
          }
          
          break; // Found fusion partner, stop checking
        }
      }
      
      // If no fusion occurred, add the new tip
      if (!fusionOccurred) {
        this.tips.push(newTip);
      }
    }

    // Remove dead tips
    this.tips = this.tips.filter((t) => t.life > 0);

    // Tip Culling to Control Performance
    const MAX_ACTIVE_TIPS = 1000;
    if (this.tips.length > MAX_ACTIVE_TIPS) {
      this.tips.splice(0, this.tips.length - MAX_ACTIVE_TIPS);
    }
  }

  /**
   * Draws a line segment between two points with styling based on growth type, depth, and maturity.
   * @param oldX - Starting X-coordinate.
   * @param oldY - Starting Y-coordinate.
   * @param newX - Ending X-coordinate.
   * @param newY - Ending Y-coordinate.
   * @param type - Type of growth ("main" or "secondary").
   * @param depth - Depth of the current tip for lightness calculation.
   * @param customThickness - Optional custom line thickness for mature hyphae.
   */
  private drawSegment(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    type: GrowthType,
    depth: number,
    customThickness?: number,
  ) {
    // Calculate lightness based on depth
    let calculatedLightness =
      config.BASE_LIGHTNESS + depth * config.LIGHTNESS_STEP;
    if (calculatedLightness > 100) calculatedLightness = 100; // Cap lightness at 100%

    // Check for nutrient areas to adjust color (add a slight green tint in nutrient-rich areas)
    const midX = (oldX + newX) / 2;
    const midY = (oldY + newY) / 2;
    const nutrientLevel = this.envGPU.getNutrientLevel?.(midX, midY) ?? 0;
    const nutrientFactor = Math.min(1, nutrientLevel / config.BASE_NUTRIENT);
    
    // Get moisture for blue tint
    const moistureLevel = this.envGPU.getMoisture(midX, midY);
    const moistureFactor = Math.min(1, moistureLevel / config.BASE_NUTRIENT);

    // Determine line style based on growth type
    let lineWidth: number;
    let alpha: number;
    let saturation: number;
    let lightness: number;
    let hue: number;

    if (type === "main") {
      lineWidth = customThickness ?? config.MAIN_LINE_WIDTH;
      alpha = config.MAIN_ALPHA;
      hue = config.BASE_HUE; // Adjust based on nutrient (shift toward greenish)
      saturation = nutrientFactor * 10; // Slight saturation in nutrient-rich areas
      lightness = calculatedLightness; // Dynamic lightness based on depth
    } else {
      lineWidth = customThickness ?? config.SECONDARY_LINE_WIDTH;
      alpha = config.SECONDARY_ALPHA;
      hue = config.BASE_HUE + (moistureFactor * 30); // Slight blue shift in moist areas
      saturation = nutrientFactor * 5; // Less saturation than main lines
      lightness = calculatedLightness; // Dynamic lightness based on depth
    }

    // Use hsla with dynamic parameters
    this.ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    this.ctx.lineWidth = lineWidth;

    // Enhance shadow for better visibility, stronger for thicker lines
    this.ctx.shadowBlur = config.SHADOW_BLUR * (lineWidth / config.MAIN_LINE_WIDTH);
    this.ctx.shadowColor = config.SHADOW_COLOR;

    // Draw the line segment
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();

    // Reset shadow to prevent it from affecting other drawings
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }

  /**
   * (Optional) Draws a small circle at the hyphal tip position for debugging.
   * Uncomment if you want to visualize tip positions.
   * @param tip - The hyphal tip to draw.
   */
  private drawHyphaTip(tip: HyphaTip) {
    const radius = 2;
    this.ctx.beginPath();
    this.ctx.arc(tip.x, tip.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white"; // Bright color for visibility
    this.ctx.fill();
    console.log(
      `Drew hyphal tip at (${tip.x.toFixed(2)}, ${tip.y.toFixed(2)}).`,
    );
  }

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
