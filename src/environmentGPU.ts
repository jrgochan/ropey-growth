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
      this.flowPathUsage[gridX][gridY] += amount * config.LINE_THICKENING_FACTOR;
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
   * Samples the nutrient gradient at a given location.
   * Returns a vector [dx, dy] pointing in the direction of higher nutrients.
   * @param x - X-coordinate to sample from.
   * @param y - Y-coordinate to sample from.
   * @returns [dx, dy] normalized vector pointing toward higher nutrient concentration.
   */
  public getNutrientGradient(x: number, y: number): [number, number] {
    const radius = config.GRADIENT_SAMPLING_RADIUS;
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    let dx = 0;
    let dy = 0;
    let samples = 0;
    
    // Sample in a square around the current position
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const sampleX = gridX + i;
        const sampleY = gridY + j;
        
        if (
          sampleX >= 0 &&
          sampleX < this.nutrientGrid.length &&
          sampleY >= 0 &&
          sampleY < this.nutrientGrid[0].length
        ) {
          // Weight by distance (closer samples matter more)
          const distance = Math.sqrt(i*i + j*j);
          if (distance > 0 && distance <= radius) {
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
    }
    
    // Normalize the gradient vector
    if (samples > 0 && (dx !== 0 || dy !== 0)) {
      const magnitude = Math.sqrt(dx*dx + dy*dy);
      if (magnitude > 0) {
        dx /= magnitude;
        dy /= magnitude;
      }
    }
    
    return [dx, dy];
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

  /**
   * Checks for nearby hyphae to implement negative autotropism (avoiding self)
   * @param x - X-coordinate to check.
   * @param y - Y-coordinate to check.
   * @param radius - Radius to check for existing hyphae.
   * @returns [dx, dy] normalized vector pointing away from nearby hyphae.
   */
  public getAvoidanceFactor(x: number, y: number, radius: number): [number, number] {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);
    
    let dx = 0;
    let dy = 0;
    let detected = false;
    
    // Check flow path usage grid for existing hyphae
    const searchRadius = Math.ceil(radius / config.ENV_GRID_CELL_SIZE);
    
    for (let i = -searchRadius; i <= searchRadius; i++) {
      for (let j = -searchRadius; j <= searchRadius; j++) {
        const checkX = gridX + i;
        const checkY = gridY + j;
        
        if (
          checkX >= 0 &&
          checkX < this.flowPathUsage.length &&
          checkY >= 0 &&
          checkY < this.flowPathUsage[0].length
        ) {
          if (this.flowPathUsage[checkX][checkY] > 0) {
            // Calculate distance
            const distance = Math.sqrt(i*i + j*j);
            if (distance > 0 && distance <= searchRadius) {
              // Vector pointing away from this hypha, weighted by usage
              const weight = (this.flowPathUsage[checkX][checkY] * (searchRadius - distance)) / (distance * searchRadius);
              dx -= i * weight;
              dy -= j * weight;
              detected = true;
            }
          }
        }
      }
    }
    
    // Normalize the avoidance vector
    if (detected) {
      const magnitude = Math.sqrt(dx*dx + dy*dy);
      if (magnitude > 0) {
        dx /= magnitude;
        dy /= magnitude;
      }
    }
    
    return [dx, dy];
  }

  /**
   * Handles nutrient diffusion across the grid.
   * This method should be called periodically to simulate nutrient spread.
   */
  public diffuseNutrients() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    const newNutrientGrid: number[][] = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 0),
    );
    const newMoistureGrid: number[][] = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 0),
    );

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Diffuse nutrients
        let nutrientTotal = this.nutrientGrid[x][y];
        let moistureTotal = this.moistureGrid[x][y];
        let count = 1;

        // Check neighboring cells
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            nutrientTotal += this.nutrientGrid[nx][ny];
            moistureTotal += this.moistureGrid[nx][ny];
            count++;
          }
        }

        // Calculate average and apply diffusion rate
        newNutrientGrid[x][y] = this.nutrientGrid[x][y] +
          config.NUTRIENT_DIFFUSION * (nutrientTotal / count - this.nutrientGrid[x][y]);
          
        // Moisture diffuses faster than nutrients
        newMoistureGrid[x][y] = this.moistureGrid[x][y] +
          (config.NUTRIENT_DIFFUSION * 1.5) * (moistureTotal / count - this.moistureGrid[x][y]);
      }
    }

    this.nutrientGrid = newNutrientGrid;
    this.moistureGrid = newMoistureGrid;
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

  /**
   * Draws the nutrient grid onto the canvas for visualization.
   * This is optional and can be used for debugging purposes.
   * @param ctx - Canvas rendering context.
   */
  public drawNutrientGrid(ctx: CanvasRenderingContext2D) {
    for (let x = 0; x < this.nutrientGrid.length; x++) {
      for (let y = 0; y < this.nutrientGrid[0].length; y++) {
        const nutrient = this.nutrientGrid[x][y];
        const moisture = this.moistureGrid[x][y];
        
        if (nutrient > 0 || moisture > 0) {
          // Blend colors: green for nutrients, blue for moisture
          const r = 0;
          const g = Math.min(255, Math.floor((nutrient / config.BASE_NUTRIENT) * 255));
          const b = Math.min(255, Math.floor((moisture / config.BASE_NUTRIENT) * 255));
          const a = Math.min(1, (nutrient + moisture) / (2 * config.BASE_NUTRIENT));
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fillRect(
            x * config.ENV_GRID_CELL_SIZE,
            y * config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE,
          );
        }
      }
    }
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
