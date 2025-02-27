// src/environmentGPU.ts

import { config } from "./constants.js"; // Import the config object

/**
 * EnvironmentGPU class manages the environmental resources
 * such as nutrients and moisture that hypha tips respond to.
 */
export class EnvironmentGPU {
  private width: number;
  private height: number;
  private nutrientGrid: number[][];
  private moistureGrid: number[][]; // Added moisture as a separate environmental factor
  private flowPathUsage: number[][]; // Tracks how frequently paths are used for thickening

  /**
   * Constructor initializes the environment grids based on canvas dimensions.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeGrids();
    console.log(
      `EnvironmentGPU initialized with width: ${width}, height: ${height}`,
    );
  }

  /**
   * Initializes all environmental grids with base levels.
   */
  private initializeGrids() {
    const cols = Math.ceil(this.width / config.ENV_GRID_CELL_SIZE);
    const rows = Math.ceil(this.height / config.ENV_GRID_CELL_SIZE);
    
    // Initialize nutrient grid
    this.nutrientGrid = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => config.BASE_NUTRIENT),
    );
    
    // Initialize moisture grid with random variation (60-100% of base nutrient)
    this.moistureGrid = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 
        config.BASE_NUTRIENT * (0.6 + Math.random() * 0.4)
      ),
    );
    
    // Initialize flow path usage grid
    this.flowPathUsage = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 0),
    );
    
    console.log(
      `Environmental grids initialized with ${cols} columns and ${rows} rows.`,
    );
  }

  /**
   * Consumes nutrients from the grid based on the hypha tip's position.
   * @param x - X-coordinate of the hypha tip.
   * @param y - Y-coordinate of the hypha tip.
   * @param amount - Amount of nutrient to consume.
   * @returns The actual amount of nutrient consumed.
   */
  public consumeResource(x: number, y: number, amount: number): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length
    ) {
      // Adjust consumption based on moisture (drier areas provide less nutrients)
      const moistureFactor = Math.min(1, this.moistureGrid[gridX][gridY] / config.BASE_NUTRIENT);
      const adjustedAmount = amount * moistureFactor;
      
      const available = this.nutrientGrid[gridX][gridY];
      const consumed = Math.min(adjustedAmount, available);
      this.nutrientGrid[gridX][gridY] -= consumed;
      
      // Also reduce moisture slightly when consuming nutrients
      this.moistureGrid[gridX][gridY] = Math.max(0, this.moistureGrid[gridX][gridY] - consumed * 0.1);
      
      return consumed;
    } else {
      console.warn(
        `Hypha tip at (${x.toFixed(2)}, ${y.toFixed(2)}) is out of grid bounds.`,
      );
      return 0;
    }
  }

  /**
   * Records usage of a path for transport, used for hyphal thickening.
   * @param x - X-coordinate of the path.
   * @param y - Y-coordinate of the path.
   * @param amount - Amount of resource that flowed through this path.
   */
  public recordPathUsage(x: number, y: number, amount: number): void {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.flowPathUsage.length &&
      gridY >= 0 &&
      gridY < this.flowPathUsage[0].length
    ) {
      // Increased thickening factor for more visible network
      const thickeningFactor = config.LINE_THICKENING_FACTOR * 3.0;
      this.flowPathUsage[gridX][gridY] += amount * thickeningFactor;
      
      // Record in neighboring cells too for thicker visualization
      const neighbors = [
        [gridX - 1, gridY], 
        [gridX + 1, gridY], 
        [gridX, gridY - 1], 
        [gridX, gridY + 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 &&
          nx < this.flowPathUsage.length &&
          ny >= 0 &&
          ny < this.flowPathUsage[0].length
        ) {
          // Neighbors get less but still significant usage
          this.flowPathUsage[nx][ny] += amount * thickeningFactor * 0.4;
        }
      }
    }
  }

  /**
   * Gets the path usage factor for a given location, used for line thickness.
   * @param x - X-coordinate.
   * @param y - Y-coordinate.
   * @returns The path usage factor (0-1).
   */
  public getPathUsageFactor(x: number, y: number): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.flowPathUsage.length &&
      gridY >= 0 &&
      gridY < this.flowPathUsage[0].length
    ) {
      // Normalize to 0-1 range with a cap at 10
      return Math.min(1, this.flowPathUsage[gridX][gridY] / 10);
    }
    return 0;
  }

  /**
   * Adds nutrients to a specific location, e.g., during replenishment.
   * @param x - X-coordinate where nutrients are added.
   * @param y - Y-coordinate where nutrients are added.
   * @param amount - Amount of nutrient to add.
   */
  public addNutrient(x: number, y: number, amount: number) {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length
    ) {
      this.nutrientGrid[gridX][gridY] += amount;
      // Also add some moisture when adding nutrients (simulate water-soluble nutrients)
      this.moistureGrid[gridX][gridY] += amount * 0.5;
    }
  }
  
  /**
   * Adds moisture to a specific location.
   * @param x - X-coordinate where moisture is added.
   * @param y - Y-coordinate where moisture is added.
   * @param amount - Amount of moisture to add.
   */
  public addMoisture(x: number, y: number, amount: number) {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.moistureGrid.length &&
      gridY >= 0 &&
      gridY < this.moistureGrid[0].length
    ) {
      this.moistureGrid[gridX][gridY] += amount;
    }
  }

  // Cache for gradient calculations to avoid recalculating too frequently
  private gradientCache: Map<string, {gradient: [number, number], timestamp: number}> = new Map();
  private readonly GRADIENT_CACHE_LIFETIME = 10; // Frames before recalculation
  private frameCount = 0; // Track frames for cache management
  
  /**
   * Samples the nutrient gradient at a given location.
   * Returns a vector [dx, dy] pointing in the direction of higher nutrients.
   * @param x - X-coordinate to sample from.
   * @param y - Y-coordinate to sample from.
   * @returns [dx, dy] normalized vector pointing toward higher nutrient concentration.
   */
  public getNutrientGradient(x: number, y: number): [number, number] {
    this.frameCount++;
    
    // Cell-based location for cache key (rounded to reduce unique locations)
    const cellSize = config.ENV_GRID_CELL_SIZE * 2; // Use larger cells for caching
    const cacheX = Math.floor(x / cellSize);
    const cacheY = Math.floor(y / cellSize);
    const cacheKey = `${cacheX},${cacheY}`;
    
    // Check if we have a recent cached value
    const cached = this.gradientCache.get(cacheKey);
    if (cached && this.frameCount - cached.timestamp < this.GRADIENT_CACHE_LIFETIME) {
      return cached.gradient;
    }
    
    // Calculate gradient with optimized sampling
    const radius = config.GRADIENT_SAMPLING_RADIUS;
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    let dx = 0;
    let dy = 0;
    let samples = 0;
    
    // Sample only in cardinal directions (N, E, S, W) for better performance
    // This gives enough gradient information for most purposes
    const directions = [
      [-radius, 0], // Left
      [radius, 0],  // Right
      [0, -radius], // Up
      [0, radius],  // Down
      [-Math.floor(radius/2), -Math.floor(radius/2)], // Up-Left 
      [Math.floor(radius/2), -Math.floor(radius/2)],  // Up-Right
      [-Math.floor(radius/2), Math.floor(radius/2)],  // Down-Left
      [Math.floor(radius/2), Math.floor(radius/2)]    // Down-Right
    ];
    
    for (const [i, j] of directions) {
      const sampleX = gridX + i;
      const sampleY = gridY + j;
      
      if (
        sampleX >= 0 &&
        sampleX < this.nutrientGrid.length &&
        sampleY >= 0 &&
        sampleY < this.nutrientGrid[0].length
      ) {
        // Use a simpler weighting system - just use distance
        const distance = Math.abs(i) + Math.abs(j); // Manhattan distance is cheaper than Euclidean
        if (distance > 0) {
          const weight = 1 / distance;
          
          // Get nutrient value, weight it by distance
          const nutrientValue = this.nutrientGrid[sampleX][sampleY] * weight;
          
          // Accumulate weighted vector components
          dx += i * nutrientValue;
          dy += j * nutrientValue;
          samples++;
        }
      }
    }
    
    // Normalize the gradient vector
    let result: [number, number] = [0, 0];
    
    if (samples > 0 && (dx !== 0 || dy !== 0)) {
      const magnitude = Math.sqrt(dx*dx + dy*dy);
      if (magnitude > 0) {
        result = [dx / magnitude, dy / magnitude];
      }
    }
    
    // Cache the result
    this.gradientCache.set(cacheKey, {
      gradient: result,
      timestamp: this.frameCount
    });
    
    // Clean up old cache entries periodically
    if (this.frameCount % 100 === 0 && this.gradientCache.size > 1000) {
      const cutoffTime = this.frameCount - this.GRADIENT_CACHE_LIFETIME * 2;
      for (const [key, value] of this.gradientCache.entries()) {
        if (value.timestamp < cutoffTime) {
          this.gradientCache.delete(key);
        }
      }
    }
    
    return result;
  }

  /**
   * Gets the moisture level at a specific location.
   * @param x - X-coordinate.
   * @param y - Y-coordinate.
   * @returns The moisture level (0-100).
   */
  public getMoisture(x: number, y: number): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.moistureGrid.length &&
      gridY >= 0 &&
      gridY < this.moistureGrid[0].length
    ) {
      return this.moistureGrid[gridX][gridY];
    }
    return 0;
  }
  
  /**
   * Gets the nutrient level at a specific location.
   * @param x - X-coordinate.
   * @param y - Y-coordinate.
   * @returns The nutrient level (0-100).
   */
  public getNutrientLevel(x: number, y: number): number {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length
    ) {
      return this.nutrientGrid[gridX][gridY];
    }
    return 0;
  }

  // Cache for avoidance calculations 
  private avoidanceCache: Map<string, {vector: [number, number], timestamp: number}> = new Map();
  private readonly AVOIDANCE_CACHE_LIFETIME = 5; // Frames before recalculation
  
  /**
   * Checks for nearby hyphae to implement negative autotropism (avoiding self)
   * @param x - X-coordinate to check.
   * @param y - Y-coordinate to check.
   * @param radius - Radius to check for existing hyphae.
   * @returns [dx, dy] normalized vector pointing away from nearby hyphae.
   */
  public getAvoidanceFactor(x: number, y: number, radius: number): [number, number] {
    this.frameCount++; // Reuse frame counter from gradient cache
    
    // Cell-based location for cache key (rounded to reduce unique keys)
    const cellSize = config.ENV_GRID_CELL_SIZE * 1.5; // Use larger cells for caching
    const cacheX = Math.floor(x / cellSize);
    const cacheY = Math.floor(y / cellSize);
    const cacheKey = `${cacheX},${cacheY},${Math.floor(radius*10)}`; // Include radius in key
    
    // Check if we have a recent cached value
    const cached = this.avoidanceCache.get(cacheKey);
    if (cached && this.frameCount - cached.timestamp < this.AVOIDANCE_CACHE_LIFETIME) {
      return cached.vector;
    }
    
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    let dx = 0;
    let dy = 0;
    let detected = false;
    
    // Check flow path usage grid for existing hyphae
    const searchRadius = Math.min(3, Math.ceil(radius / config.ENV_GRID_CELL_SIZE));
    
    // Check in an optimized pattern to reduce calculations
    // Sample in a + pattern first
    const samplePoints = [
      // Primary directions
      [0, -searchRadius], [0, searchRadius], [-searchRadius, 0], [searchRadius, 0],
      // Diagonal directions (at half radius for efficiency)
      [-Math.floor(searchRadius/2), -Math.floor(searchRadius/2)],
      [Math.floor(searchRadius/2), -Math.floor(searchRadius/2)],
      [-Math.floor(searchRadius/2), Math.floor(searchRadius/2)],
      [Math.floor(searchRadius/2), Math.floor(searchRadius/2)]
    ];
    
    // Check our optimized sample points
    for (const [i, j] of samplePoints) {
      const checkX = gridX + i;
      const checkY = gridY + j;
      
      if (
        checkX >= 0 &&
        checkX < this.flowPathUsage.length &&
        checkY >= 0 &&
        checkY < this.flowPathUsage[0].length
      ) {
        const usage = this.flowPathUsage[checkX][checkY];
        if (usage > 0) {
          // Calculate Manhattan distance for better performance
          const distance = Math.abs(i) + Math.abs(j);
          if (distance > 0) {
            // Vector pointing away from this hypha, weighted by usage
            const weight = (usage * (searchRadius*2 - distance)) / (distance * searchRadius*2);
            dx -= i * weight * 2; // Amplify effect to compensate for fewer samples
            dy -= j * weight * 2;
            detected = true;
          }
        }
      }
    }
    
    // Normalize the avoidance vector
    let result: [number, number] = [0, 0];
    
    if (detected) {
      const magnitude = Math.sqrt(dx*dx + dy*dy);
      if (magnitude > 0) {
        result = [dx / magnitude, dy / magnitude];
      }
    }
    
    // Cache the result
    this.avoidanceCache.set(cacheKey, {
      vector: result,
      timestamp: this.frameCount
    });
    
    // Clean up old cache entries (piggyback on gradient cache cleanup)
    if (this.frameCount % 100 === 0 && this.avoidanceCache.size > 1000) {
      const cutoffTime = this.frameCount - this.AVOIDANCE_CACHE_LIFETIME * 2;
      for (const [key, value] of this.avoidanceCache.entries()) {
        if (value.timestamp < cutoffTime) {
          this.avoidanceCache.delete(key);
        }
      }
    }
    
    return result;
  }

  // Reusable fixed arrays to avoid repeated allocation
  private newNutrientGrid: number[][] | null = null;
  private newMoistureGrid: number[][] | null = null;
  private diffusionSkipFactor = 1; // Skip cells for faster diffusion
  private diffusionTimeIndex = 0; // Track time for alternating pattern
  
  /**
   * Handles nutrient diffusion across the grid.
   * This method should be called periodically to simulate nutrient spread.
   */
  public diffuseNutrients() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    
    // Create reusable grids if not already created
    if (!this.newNutrientGrid) {
      this.newNutrientGrid = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => 0),
      );
    }
    
    if (!this.newMoistureGrid) {
      this.newMoistureGrid = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => 0),
      );
    }
    
    // Increment time index for alternating patterns
    this.diffusionTimeIndex++;
    
    // Determine starting point based on time - creates alternating patterns
    // to avoid bias in diffusion direction
    const startX = this.diffusionTimeIndex % 2;
    const startY = (this.diffusionTimeIndex / 2) % 2;
    
    // Dynamic skip factor based on grid size to improve performance
    // Larger grids can have larger skip factors
    const skipFactor = Math.max(1, Math.floor(cols / 100));
    this.diffusionSkipFactor = skipFactor;
    
    // Process only a subset of cells each time for better performance
    for (let x = startX; x < cols; x += skipFactor) {
      for (let y = startY; y < rows; y += skipFactor) {
        // Diffuse nutrients
        let nutrientTotal = this.nutrientGrid[x][y];
        let moistureTotal = this.moistureGrid[x][y];
        let count = 1;

        // Check only cardinal neighbors for better performance
        // This still gives good diffusion results
        const neighbors = [
          [x - skipFactor, y],    // left
          [x + skipFactor, y],    // right
          [x, y - skipFactor],    // top
          [x, y + skipFactor]     // bottom
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            nutrientTotal += this.nutrientGrid[nx][ny];
            moistureTotal += this.moistureGrid[nx][ny];
            count++;
          }
        }

        // Calculate average and apply diffusion rate
        this.newNutrientGrid[x][y] = this.nutrientGrid[x][y] +
          config.NUTRIENT_DIFFUSION * (nutrientTotal / count - this.nutrientGrid[x][y]);
          
        // Moisture diffuses faster than nutrients
        this.newMoistureGrid[x][y] = this.moistureGrid[x][y] +
          (config.NUTRIENT_DIFFUSION * 1.5) * (moistureTotal / count - this.moistureGrid[x][y]);
          
        // Apply a small decay factor to nutrients (natural breakdown over time)
        this.newNutrientGrid[x][y] *= 0.999;
      }
    }
    
    // Copy processed values back to main grids
    for (let x = startX; x < cols; x += skipFactor) {
      for (let y = startY; y < rows; y += skipFactor) {
        this.nutrientGrid[x][y] = this.newNutrientGrid[x][y];
        this.moistureGrid[x][y] = this.newMoistureGrid[x][y];
      }
    }
    
    // Return true for successful diffusion (can be used for chaining)
    return true;
  }

  /**
   * Handles periodic replenishment of nutrients.
   * This method should be scheduled to run at intervals defined in config.
   */
  public replenishNutrients() {
    // Replenish nutrients in random locations
    for (let i = 0; i < 10; i++) {
      // Number of replenishment pockets
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.addNutrient(x, y, config.REPLENISHMENT_AMOUNT);
    }
  }

  // Offscreen canvas for nutrient grid visualization
  private nutrientCanvas: HTMLCanvasElement | null = null;
  private nutrientCtx: CanvasRenderingContext2D | null = null;
  private lastNutrientRender = 0;
  private readonly NUTRIENT_RENDER_INTERVAL = 10; // Only update every 10 frames
  
  /**
   * Draws the nutrient grid onto the canvas for visualization.
   * This is optional and can be used for debugging purposes.
   * @param ctx - Canvas rendering context.
   */
  public drawNutrientGrid(ctx: CanvasRenderingContext2D) {
    // Only update nutrient visualization periodically
    if (this.frameCount - this.lastNutrientRender < this.NUTRIENT_RENDER_INTERVAL) {
      // Just draw the existing offscreen canvas if available
      if (this.nutrientCanvas && this.nutrientCtx) {
        ctx.drawImage(this.nutrientCanvas, 0, 0);
        return;
      }
    }
    
    this.lastNutrientRender = this.frameCount;
    
    // Create offscreen canvas if it doesn't exist
    if (!this.nutrientCanvas || !this.nutrientCtx) {
      this.nutrientCanvas = document.createElement('canvas');
      this.nutrientCanvas.width = ctx.canvas.width;
      this.nutrientCanvas.height = ctx.canvas.height;
      this.nutrientCtx = this.nutrientCanvas.getContext('2d');
      
      if (!this.nutrientCtx) {
        console.error("Could not create offscreen context for nutrient grid");
        return;
      }
    }
    
    // Clear the offscreen canvas
    this.nutrientCtx.clearRect(0, 0, this.nutrientCanvas.width, this.nutrientCanvas.height);
    
    // Use a much larger skip factor for better performance
    const skipFactor = Math.max(4, Math.floor(this.diffusionSkipFactor * 2));
    const maxAlpha = 0.04; // Even lower alpha for less visual impact
    
    // Render to offscreen canvas
    for (let x = 0; x < this.nutrientGrid.length; x += skipFactor) {
      for (let y = 0; y < this.nutrientGrid[0].length; y += skipFactor) {
        const nutrient = this.nutrientGrid[x][y];
        const moisture = this.moistureGrid[x][y];
        
        // Only draw cells with significant nutrients
        if (nutrient > config.BASE_NUTRIENT * 0.6 || moisture > config.BASE_NUTRIENT * 0.6) {
          // Blend colors: green for nutrients, blue for moisture
          const r = 0;
          const g = Math.min(180, Math.floor((nutrient / config.BASE_NUTRIENT) * 130));
          const b = Math.min(180, Math.floor((moisture / config.BASE_NUTRIENT) * 130));
          
          // Extremely low alpha to avoid taking over the entire display
          const a = Math.min(maxAlpha, (nutrient + moisture) / (8 * config.BASE_NUTRIENT));
          
          this.nutrientCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          this.nutrientCtx.fillRect(
            x * config.ENV_GRID_CELL_SIZE,
            y * config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE * skipFactor,
            config.ENV_GRID_CELL_SIZE * skipFactor,
          );
        }
      }
    }
    
    // Draw the offscreen canvas to the main canvas
    ctx.drawImage(this.nutrientCanvas, 0, 0);
  }

  /**
   * Renders the nutrient packets as little green apples on the canvas.
   * @param ctx - The 2D rendering context of the main canvas.
   */
  public renderNutrientPackets(ctx: CanvasRenderingContext2D) {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;

    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (this.nutrientGrid[x][y] > config.BASE_NUTRIENT * 0.5) {
          // Draw a green apple at the center of each cell with significant nutrients
          const centerX = x * cellWidth + cellWidth / 2;
          const centerY = y * cellHeight + cellHeight / 2;
          
          // Size based on nutrient amount
          const radius = Math.min(cellWidth, cellHeight) / 4 * 
            (this.nutrientGrid[x][y] / config.BASE_NUTRIENT);

          // Color based on moisture (more blue when more moisture)
          const moisture = this.moistureGrid[x][y] / config.BASE_NUTRIENT;
          const r = 0;
          const g = 155 + Math.floor(100 * (1 - moisture));
          const b = Math.floor(200 * moisture);
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Draw the stem
          ctx.strokeStyle = "brown";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - radius);
          ctx.lineTo(centerX, centerY - radius - cellHeight / 10);
          ctx.stroke();
        }
      }
    }
  }
}
