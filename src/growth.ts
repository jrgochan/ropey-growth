// src/growth.ts

import { Perlin } from "./Perlin.js";
import { config } from "./constants.js"; // Import the config object

import { EnvironmentGPU } from "./environmentGPU.js";
import { MycelialNetwork } from "./mycelialNetwork.js";

export type GrowthType = "main" | "secondary";

export interface HyphaTip {
  x: number;
  y: number;
  z: number; // Added z-coordinate for 3D
  angle: number; // Horizontal angle (in the XY plane)
  verticalAngle: number; // Vertical angle (for Z-axis movement)
  life: number;
  depth: number;
  growthType: GrowthType;
  resource: number; // Tracks the resource available to the tip
}

/**
 * GrowthManager class handles the simulation of hyphal growth in 3D.
 */
export class GrowthManager {
  private tips: HyphaTip[] = [];
  private growthRadius: number;
  private growthHeight: number;
  private lastDiffuseTime: number = 0;
  private lastReplenishTime: number = 0;
  private frameCount: number = 0;
  
  // Performance optimization: Cache for Perlin noise values
  private perlinCache: Map<string, number> = new Map();
  
  // Performance optimization: Spatial grid for faster tip proximity checks
  private spatialGrid: Map<string, HyphaTip[]> = new Map();
  private gridCellSize: number = 5; // Size of each spatial grid cell
  
  // Performance optimization: Color cache to avoid recalculating colors
  private colorCache: Map<string, string> = new Map();
  
  // Performance tracking
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private adaptiveStepCount: number = 1;
  
  // 3D renderer reference (optional)
  private renderer3D: any = null;

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
   * @param renderer3D - Optional 3D renderer for 3D visualization.
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
    renderer3D?: any, // Optional 3D renderer
  ) {
    this.growthRadius = Math.min(width, height) * config.GROWTH_RADIUS_FACTOR;
    this.growthHeight = this.growthRadius * config.GROWTH_HEIGHT_FACTOR;
    this.renderer3D = renderer3D;
  }
  
  /**
   * Sets the 3D renderer for visualization
   * @param renderer3D - The 3D renderer instance
   */
  public setRenderer3D(renderer3D: any): void {
    this.renderer3D = renderer3D;
  }

  /**
   * Initializes the growth simulation by creating main trunks.
   */
  public init() {
    this.tips = [];
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
    this.ctx.clearRect(0, 0, this.width, this.height); // Clear the canvas
    
    // Reset caches
    this.perlinCache.clear();
    this.spatialGrid.clear();
    this.colorCache.clear();
    this.frameTimes = [];
    this.adaptiveStepCount = 1;

    // Create main trunks from the center
    for (let i = 0; i < config.MAIN_BRANCH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      // For 3D growth, add a slight vertical angle bias based on position
      const verticalAngle = (Math.random() - 0.5) * Math.PI * 0.2; // Small random vertical angle
      
      const newTip: HyphaTip = {
        x: this.centerX,
        y: this.centerY,
        z: 0, // Start at the surface
        angle,
        verticalAngle,
        life: config.BASE_LIFE,
        depth: 0,
        growthType: "main",
        resource: config.INITIAL_RESOURCE_PER_TIP,
      };
      this.tips.push(newTip);
      
      // Log for testing purposes
      console.log(`Initialized main tip ${i}: x=${this.centerX}, y=${this.centerY}, z=0, angle=${angle.toFixed(2)}, verticalAngle=${verticalAngle.toFixed(2)}`);
    }

    // Create network nodes for each main branch
    this.tips.forEach((tip) => {
      const nodeId = this.network.createNode(tip.x, tip.y, tip.z, tip.resource);
    });
    
    // If we have a 3D renderer, clear it
    if (this.renderer3D) {
      this.renderer3D.clear();
    }
  }

  /**
   * Gets a cached Perlin noise value or calculates and caches a new one
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @param offset - Optional offset for different noise patterns
   * @returns Perlin noise value
   */
  private getCachedPerlinNoise(x: number, y: number, z: number = 0, offset: number = 0): number {
    // For 2D noise (backward compatibility)
    if (z === 0 && !config.ENABLE_3D) {
      const key = `2D:${(x * config.PERLIN_SCALE).toFixed(1)},${(y * config.PERLIN_SCALE).toFixed(1)},${offset}`;
      if (!this.perlinCache.has(key)) {
        const value = this.perlin.noise2D(
          (x + offset) * config.PERLIN_SCALE,
          (y + offset) * config.PERLIN_SCALE
        );
        this.perlinCache.set(key, value);
      }
      return this.perlinCache.get(key)!;
    }
    
    // For 3D noise
    const key = `3D:${(x * config.PERLIN_SCALE).toFixed(1)},${(y * config.PERLIN_SCALE).toFixed(1)},${(z * config.PERLIN_SCALE).toFixed(1)},${offset}`;
    if (!this.perlinCache.has(key)) {
      const value = this.perlin.noise3D(
        (x + offset) * config.PERLIN_SCALE,
        (y + offset) * config.PERLIN_SCALE,
        (z + offset) * config.PERLIN_SCALE
      );
      this.perlinCache.set(key, value);
      
      // Keep cache size reasonable
      if (this.perlinCache.size > 10000) {
        // Clear half the cache when it gets too large
        const keys = Array.from(this.perlinCache.keys());
        for (let i = 0; i < 5000; i++) {
          this.perlinCache.delete(keys[i]);
        }
      }
    }
    return this.perlinCache.get(key)!;
  }
  
  /**
   * Gets the spatial grid cell key for a position
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @returns Grid cell key
   */
  private getSpatialGridKey(x: number, y: number, z: number = 0): string {
    const gridX = Math.floor(x / this.gridCellSize);
    const gridY = Math.floor(y / this.gridCellSize);
    const gridZ = Math.floor(z / this.gridCellSize);
    return `${gridX},${gridY},${gridZ}`;
  }
  
  /**
   * Updates the spatial grid with current tips
   */
  private updateSpatialGrid(): void {
    this.spatialGrid.clear();
    for (const tip of this.tips) {
      const key = this.getSpatialGridKey(tip.x, tip.y, tip.z);
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, []);
      }
      this.spatialGrid.get(key)!.push(tip);
    }
  }
  
  /**
   * Checks if a position is too close to existing tips
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @param growthType - Growth type to compare against
   * @returns Whether the position is too close to existing tips
   */
  private isTooCloseToExistingTips(x: number, y: number, z: number, growthType: GrowthType): boolean {
    const key = this.getSpatialGridKey(x, y, z);
    
    // Check the current cell and neighboring cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighborKey = `${Math.floor(x / this.gridCellSize) + dx},${Math.floor(y / this.gridCellSize) + dy},${Math.floor(z / this.gridCellSize) + dz}`;
          const cellTips = this.spatialGrid.get(neighborKey);
          
          if (cellTips) {
            for (const tip of cellTips) {
              if (tip.growthType !== growthType) {
                const distance = Math.sqrt(
                  Math.pow(x - tip.x, 2) + 
                  Math.pow(y - tip.y, 2) + 
                  Math.pow(z - tip.z, 2)
                );
                if (distance < config.ANASTOMOSIS_RADIUS) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Gets a cached color or calculates and caches a new one
   * @param hue - Color hue
   * @param saturation - Color saturation
   * @param lightness - Color lightness
   * @param alpha - Color alpha
   * @returns HSLA color string
   */
  private getCachedColor(hue: number, saturation: number, lightness: number, alpha: number): string {
    // Round values to reduce cache size
    const roundedHue = Math.round(hue);
    const roundedSat = Math.round(saturation);
    const roundedLight = Math.round(lightness);
    const roundedAlpha = Math.round(alpha * 100) / 100;
    
    const key = `${roundedHue},${roundedSat},${roundedLight},${roundedAlpha}`;
    
    if (!this.colorCache.has(key)) {
      const color = `hsla(${roundedHue}, ${roundedSat}%, ${roundedLight}%, ${roundedAlpha})`;
      this.colorCache.set(key, color);
      
      // Keep cache size reasonable
      if (this.colorCache.size > 1000) {
        // Clear half the cache when it gets too large
        const keys = Array.from(this.colorCache.keys());
        for (let i = 0; i < 500; i++) {
          this.colorCache.delete(keys[i]);
        }
      }
    }
    
    return this.colorCache.get(key)!;
  }

  /**
   * Updates the simulation and renders the growth lines.
   * @param currentTime - The current timestamp in milliseconds.
   */
  public updateAndDraw(currentTime: number) {
    // Calculate frame time for adaptive performance
    const frameTime = this.lastFrameTime > 0 ? currentTime - this.lastFrameTime : 16.7;
    this.lastFrameTime = currentTime;
    
    // Track frame times for adaptive step count
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 10) {
      this.frameTimes.shift();
      
      // Calculate average frame time
      const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
      
      // Adjust step count based on performance
      if (avgFrameTime > 33) { // If less than 30 FPS
        this.adaptiveStepCount = Math.max(1, this.adaptiveStepCount - 1);
      } else if (avgFrameTime < 16) { // If more than 60 FPS
        this.adaptiveStepCount = Math.min(config.TIME_LAPSE_FACTOR, this.adaptiveStepCount + 1);
      }
    }
    
    // Apply a mild fade to create a trailing effect
    this.ctx.fillStyle = `rgba(0, 0, 0, ${config.BACKGROUND_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Perform simulation steps with adaptive count
    const totalSteps = this.adaptiveStepCount;
    for (let i = 0; i < totalSteps; i++) {
      this.simOneStep();
    }

    // Handle resource flow within the network
    this.network.flowResources();
    
    // Diffuse nutrients less frequently for better performance
    this.frameCount++;
    if (this.frameCount % 5 === 0) { // Changed from 3 to 5
      this.envGPU.diffuseNutrients();
    }
    
    // Periodically replenish nutrients (every 5 seconds)
    if (currentTime - this.lastReplenishTime > 5000) {
      this.envGPU.replenishNutrients();
      this.lastReplenishTime = currentTime;
    }
    
    // Render 3D scene if available
    if (this.renderer3D) {
      this.renderer3D.render();
    }
  }

  /**
   * Simulates a single step of hyphal growth in 3D.
   */
  private simOneStep() {
    const newTips: HyphaTip[] = [];
    
    // Update spatial grid for faster proximity checks
    this.updateSpatialGrid();

    // Process tips in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < this.tips.length; i += batchSize) {
      const batch = this.tips.slice(i, i + batchSize);
      
      for (const tip of batch) {
        if (tip.life <= 0) continue;

        // Consume nutrient from the environment
        const consumed = this.envGPU.consumeResource(
          tip.x,
          tip.y,
          tip.z,
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
        const oldZ = tip.z;

        // Use cached Perlin noise for horizontal angle drift
        const nVal = this.getCachedPerlinNoise(tip.x, tip.y, tip.z);
        tip.angle += nVal * config.ANGLE_DRIFT_STRENGTH;
        
        // Use cached Perlin noise for vertical angle drift
        const nValVertical = this.getCachedPerlinNoise(tip.x, tip.y, tip.z, 5678);
        tip.verticalAngle += nValVertical * config.VERTICAL_ANGLE_DRIFT_STRENGTH;
        
        // Apply gravity influence - bias vertical angle downward based on depth
        // Deeper hyphae tend to grow more horizontally
        if (tip.z > 0) {
          const gravityFactor = config.GRAVITY_INFLUENCE * (tip.z / this.growthHeight);
          tip.verticalAngle -= gravityFactor * 0.01;
        }
        
        // Clamp vertical angle to prevent extreme values
        tip.verticalAngle = Math.max(-Math.PI/2, Math.min(Math.PI/2, tip.verticalAngle));

        // Use cached Perlin noise for wiggle
        const nVal2 = this.getCachedPerlinNoise(tip.x, tip.y, tip.z, 1234);
        const wiggle = nVal2 * config.WIGGLE_STRENGTH;
        
        // Vertical wiggle
        const nVal3 = this.getCachedPerlinNoise(tip.x, tip.y, tip.z, 4321);
        const verticalWiggle = nVal3 * config.VERTICAL_WIGGLE_STRENGTH;

        // Optimize step size calculation
        const stepMultiplier = Math.min(1.5, tip.resource / config.INITIAL_RESOURCE_PER_TIP);
        const actualStepSize = config.STEP_SIZE * (0.5 + stepMultiplier * 1.5);

        // Optimize movement calculations by pre-computing trig values
        const cosAngle = Math.cos(tip.angle);
        const sinAngle = Math.sin(tip.angle);
        const cosVerticalAngle = Math.cos(tip.verticalAngle);
        const sinVerticalAngle = Math.sin(tip.verticalAngle);
        
        // Move the tip forward in 3D space
        const growthFactor = config.GROWTH_SPEED_MULTIPLIER;
        const wiggleFactor = wiggle * 0.2;
        const verticalWiggleFactor = verticalWiggle * 0.1;
        
        // Calculate 3D movement
        // Horizontal movement is scaled by cosine of vertical angle
        tip.x += (cosAngle * cosVerticalAngle * actualStepSize + wiggleFactor) * growthFactor;
        tip.y += (sinAngle * cosVerticalAngle * actualStepSize + wiggleFactor) * growthFactor;
        // Vertical movement is determined by sine of vertical angle
        tip.z += (sinVerticalAngle * actualStepSize + verticalWiggleFactor) * growthFactor;
        
        // Apply surface growth bias - tips near the surface tend to stay near the surface
        if (tip.z < this.growthHeight * 0.1) {
          const surfaceBias = Math.random() * config.SURFACE_GROWTH_BIAS;
          if (tip.verticalAngle < 0) {
            // If growing downward near surface, reduce downward angle
            tip.verticalAngle *= (1 - surfaceBias);
          }
        }
        
        // Ensure z stays within bounds
        tip.z = Math.max(0, Math.min(this.growthHeight, tip.z));

        // Fast distance check using squared distance (horizontal distance only)
        const dx = tip.x - this.centerX;
        const dy = tip.y - this.centerY;
        const distSquared = dx * dx + dy * dy;
        if (distSquared > this.growthRadius * this.growthRadius) {
          tip.life = 0;
          continue;
        }

        // Decrement life
        tip.life--;

        // Create a network node for this position
        const nodeId = this.network.createNode(tip.x, tip.y, tip.z, tip.resource);
        
        // Render the segment in 2D (projection)
        this.drawSegment(oldX, oldY, tip.x, tip.y, tip.growthType, tip.depth);
        
        // Render in 3D if renderer is available
        if (this.renderer3D) {
          const segmentId = `${oldX.toFixed(1)},${oldY.toFixed(1)},${oldZ.toFixed(1)}-${tip.x.toFixed(1)},${tip.y.toFixed(1)},${tip.z.toFixed(1)}`;
          const startPoint = { x: oldX, y: oldY, z: oldZ };
          const endPoint = { x: tip.x, y: tip.y, z: tip.z };
          
          // Get nutrient level for coloring
          const midX = (oldX + tip.x) / 2;
          const midY = (oldY + tip.y) / 2;
          const midZ = (oldZ + tip.z) / 2;
          const nutrientLevel = this.envGPU.getNutrientLevel(midX, midY, midZ);
          const nutrientIntensity = Math.min(1, nutrientLevel / config.BASE_NUTRIENT);
          
          this.renderer3D.addHyphalSegment(
            segmentId,
            startPoint,
            endPoint,
            tip.growthType,
            tip.depth,
            nutrientIntensity
          );
        }

        // Handle branching with optimized random check
        const resourceRatio = tip.resource / config.INITIAL_RESOURCE_PER_TIP;
        const adjustedBranchChance = config.BRANCH_CHANCE * resourceRatio;
        
        if (
          tip.depth < config.MAX_BRANCH_DEPTH &&
          Math.random() < adjustedBranchChance
        ) {
          // Limit secondary branches based on depth to improve performance
          const branchCount = Math.min(
            config.SECONDARY_FAN_COUNT, 
            Math.max(1, Math.floor(3 - tip.depth / 10))
          );
          
          for (let i = 0; i < branchCount; i++) {
            // More realistic branching angles - mycelial branches tend to form at more acute angles
            // Horizontal angle offset - biased towards perpendicular branching
            let angleOffset;
            if (Math.random() < 0.7) {
              // 70% chance of branching at a more perpendicular angle (more realistic for fungi)
              angleOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI/4 + Math.random() * Math.PI/4);
            } else {
              // 30% chance of more random angle
              angleOffset = (Math.random() - 0.5) * config.WIDER_SECONDARY_ANGLE;
            }
            const newAngle = tip.angle + angleOffset;
            
            // Vertical angle offset - branches tend to grow more horizontally than the parent
            // This is more realistic for mycelial networks which tend to spread horizontally
            let verticalAngleOffset;
            if (tip.verticalAngle > 0 && Math.random() < 0.6) {
              // If parent is growing upward, branch tends to be more horizontal
              verticalAngleOffset = -Math.random() * tip.verticalAngle * 0.8;
            } else if (tip.verticalAngle < 0 && Math.random() < 0.6) {
              // If parent is growing downward, branch tends to be more horizontal
              verticalAngleOffset = Math.random() * Math.abs(tip.verticalAngle) * 0.8;
            } else {
              // Random variation
              verticalAngleOffset = (Math.random() - 0.5) * Math.PI * 0.2;
            }
            const newVerticalAngle = tip.verticalAngle + verticalAngleOffset;

            // Slightly longer spawn distance for more visible branching
            const spawnDistance = config.STEP_SIZE * config.GROWTH_SPEED_MULTIPLIER * 1.2;
            
            // Calculate spawn position in 3D
            const spawnX = tip.x + Math.cos(newAngle) * Math.cos(newVerticalAngle) * spawnDistance;
            const spawnY = tip.y + Math.sin(newAngle) * Math.cos(newVerticalAngle) * spawnDistance;
            const spawnZ = tip.z + Math.sin(newVerticalAngle) * spawnDistance;

            // Skip creating new tips that would be too close to existing ones
            if (this.isTooCloseToExistingTips(spawnX, spawnY, spawnZ, "secondary")) {
              continue;
            }

            const newTip: HyphaTip = {
              x: spawnX,
              y: spawnY,
              z: spawnZ,
              angle: newAngle,
              verticalAngle: newVerticalAngle,
              life: Math.max(
                tip.life * config.BRANCH_DECAY,
                config.BASE_LIFE * 0.5,
              ),
              depth: tip.depth + 1,
              growthType: "secondary",
              resource: config.INITIAL_RESOURCE_PER_TIP * 0.8,
            };

            newTips.push(newTip);
          }
        }
      }
    }

    // Add new tips directly without the expensive some() check
    // We already filtered out tips that would be too close in the branching logic
    this.tips.push(...newTips);

    // Remove dead tips more efficiently
    const liveTips: HyphaTip[] = [];
    for (const tip of this.tips) {
      if (tip.life > 0) {
        liveTips.push(tip);
      }
    }
    this.tips = liveTips;

    // Tip Culling to Control Performance
    const MAX_ACTIVE_TIPS = 1000;
    if (this.tips.length > MAX_ACTIVE_TIPS) {
      // Keep the newest tips (at the end of the array)
      this.tips = this.tips.slice(this.tips.length - MAX_ACTIVE_TIPS);
    }
  }

  /**
   * Draws a line segment between two points with styling based on growth type, depth, and nutrient level.
   * Optimized for performance.
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
    depth: number,
  ) {
    // Get nutrient level at the segment midpoint (only if needed)
    let nutrientIntensity = 0;
    if (type === "main") {
      const midX = (oldX + newX) / 2;
      const midY = (oldY + newY) / 2;
      const nutrientLevel = this.envGPU.getNutrientLevel(midX, midY);
      nutrientIntensity = Math.min(1, nutrientLevel / config.BASE_NUTRIENT);
    }
    
    // Calculate lightness based on depth (with clamping)
    const calculatedLightness = Math.min(
      100, 
      config.BASE_LIGHTNESS + depth * config.LIGHTNESS_STEP
    );

    // Determine line style based on growth type
    const lineWidth = type === "main" ? config.MAIN_LINE_WIDTH : config.SECONDARY_LINE_WIDTH;
    const alpha = type === "main" ? config.MAIN_ALPHA : config.SECONDARY_ALPHA;
    
    // Set nutrient hue with saturation based on nutrient level
    const hue = config.NUTRIENT_HUE;
    const saturation = type === "main" ? 100 * nutrientIntensity : 0;

    // Use cached color to avoid string concatenation
    this.ctx.strokeStyle = this.getCachedColor(hue, saturation, calculatedLightness, alpha);
    this.ctx.lineWidth = lineWidth;

    // Only apply shadow effects for main branches with significant nutrient levels
    // and only for a small percentage of segments to improve performance
    const shouldApplyShadow = type === "main" && 
                             nutrientIntensity > 0.5 && 
                             Math.random() < 0.2; // Only 20% of eligible segments get shadows
    
    if (shouldApplyShadow) {
      this.ctx.shadowBlur = config.SHADOW_BLUR * nutrientIntensity * 0.5; // Reduced blur
      
      // Simplified shadow color calculation
      this.ctx.shadowColor = `rgba(0, ${Math.floor(200 * nutrientIntensity)}, 0, 0.2)`;
    } else {
      // Skip shadow setup for most segments
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = "transparent";
    }

    // Draw the line segment
    this.ctx.beginPath();
    this.ctx.moveTo(oldX, oldY);
    this.ctx.lineTo(newX, newY);
    this.ctx.stroke();

    // Reset shadow only if we applied it
    if (shouldApplyShadow) {
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = "transparent";
    }
  }

  /**
   * Clears the simulation.
   * Useful for resetting the simulation.
   */
  public clear() {
    this.tips = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.perlinCache.clear();
    this.spatialGrid.clear();
    this.colorCache.clear();
    
    // Clear 3D renderer if available
    if (this.renderer3D) {
      this.renderer3D.clear();
    }
    
    console.log("Simulation cleared.");
  }
}
