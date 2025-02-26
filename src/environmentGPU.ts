// src/environmentGPU.ts

import { config } from "./constants.js"; // Import the config object

/**
 * EnvironmentGPU class manages the environmental resources
 * such as nutrients that hypha tips consume.
 */
export class EnvironmentGPU {
  private width: number;
  private height: number;
  private nutrientGrid: number[][] = [];
  // For optimization, we'll track which grid cells need diffusion
  private activeCells: Set<string> = new Set();

  /**
   * Constructor initializes the nutrient grid based on canvas dimensions.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNutrientGrid();
    console.log(`EnvironmentGPU initialized with dimensions ${width}x${height}`);
  }

  /**
   * Initializes the nutrient grid with base nutrient levels.
   */
  private initializeNutrientGrid() {
    const cols = Math.ceil(this.width / config.ENV_GRID_CELL_SIZE);
    const rows = Math.ceil(this.height / config.ENV_GRID_CELL_SIZE);
    this.nutrientGrid = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => config.BASE_NUTRIENT),
    );
    
    // Initialize active cells with all cells that have nutrients
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (this.nutrientGrid[x][y] > 0) {
          this.activeCells.add(`${x},${y}`);
        }
      }
    }
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
      const available = this.nutrientGrid[gridX][gridY];
      const consumed = Math.min(amount, available);
      this.nutrientGrid[gridX][gridY] -= consumed;
      
      // Mark this cell as active for diffusion
      if (this.nutrientGrid[gridX][gridY] > 0) {
        this.activeCells.add(`${gridX},${gridY}`);
      }
      
      console.log(`Consumed ${consumed} nutrients at position (${x}, ${y})`);
      return consumed;
    } else {
      console.warn(`Attempted to consume nutrients out of nutrient grid bounds at (${x}, ${y})`);
      return 0;
    }
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
      
      // Mark this cell as active for diffusion
      this.activeCells.add(`${gridX},${gridY}`);
      
      console.log(`Added ${amount} nutrients at position (${x}, ${y})`);
    } else {
      console.warn(`Attempted to add nutrients out of nutrient grid bounds at (${x}, ${y})`);
    }
  }

  // Cache for neighbor calculations
  private neighborCache: Map<string, [number, number][]> = new Map();
  
  /**
   * Gets cached neighbors for a grid cell
   * @param x - X coordinate in grid
   * @param y - Y coordinate in grid
   * @param cols - Total columns in grid
   * @param rows - Total rows in grid
   * @returns Array of valid neighbor coordinates
   */
  private getCachedNeighbors(x: number, y: number, cols: number, rows: number): [number, number][] {
    const key = `${x},${y}`;
    
    if (!this.neighborCache.has(key)) {
      const neighbors: [number, number][] = [];
      const potentialNeighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      
      for (const [nx, ny] of potentialNeighbors) {
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          neighbors.push([nx, ny]);
        }
      }
      
      this.neighborCache.set(key, neighbors);
      
      // Keep cache size reasonable
      if (this.neighborCache.size > 10000) {
        // Clear half the cache when it gets too large
        const keys = Array.from(this.neighborCache.keys());
        for (let i = 0; i < 5000; i++) {
          this.neighborCache.delete(keys[i]);
        }
      }
    }
    
    return this.neighborCache.get(key)!;
  }

  /**
   * Handles nutrient diffusion across the grid.
   * This method should be called periodically to simulate nutrient spread.
   * Highly optimized to only process cells that have nutrients or are near cells with nutrients.
   */
  public diffuseNutrients() {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    
    // If no active cells, skip diffusion
    if (this.activeCells.size === 0) {
      return;
    }
    
    console.log(`Nutrients diffused across ${this.activeCells.size} active cells`);
    
    // Use a sparse update approach instead of creating a full new grid
    const updates = new Map<string, number>();
    
    // Process only active cells and their neighbors
    const cellsToProcess = new Set(this.activeCells);
    const nextActiveCells = new Set<string>();
    
    for (const cellKey of cellsToProcess) {
      const [x, y] = cellKey.split(',').map(Number);
      
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      
      const currentValue = this.nutrientGrid[x][y];
      
      // Skip cells with negligible nutrients
      if (currentValue < 0.1) continue;
      
      // Get cached neighbors
      const neighbors = this.getCachedNeighbors(x, y, cols, rows);
      
      let total = currentValue;
      let count = 1;
      
      // Calculate diffusion with neighbors
      for (const [nx, ny] of neighbors) {
        total += this.nutrientGrid[nx][ny];
        count++;
      }
      
      // Calculate new value with diffusion
      const avgValue = total / count;
      const diffusionAmount = config.NUTRIENT_DIFFUSION * (avgValue - currentValue);
      const newValue = currentValue + diffusionAmount;
      
      // Only update if the change is significant
      if (Math.abs(diffusionAmount) > 0.01) {
        updates.set(cellKey, newValue);
        
        // Mark this cell and neighbors as active for next frame if it has nutrients
        if (newValue > 0.1) {
          nextActiveCells.add(cellKey);
          for (const [nx, ny] of neighbors) {
            nextActiveCells.add(`${nx},${ny}`);
          }
        }
      } else if (currentValue > 0.1) {
        // Keep cells with nutrients in the active set even if they didn't change much
        nextActiveCells.add(cellKey);
      }
    }
    
    // Apply updates to the grid
    for (const [key, value] of updates) {
      const [x, y] = key.split(',').map(Number);
      this.nutrientGrid[x][y] = value;
    }
    
    // Update active cells for next frame
    this.activeCells = nextActiveCells;
  }

  /**
   * Handles periodic replenishment of nutrients.
   * This method should be scheduled to run at intervals defined in config.
   */
  public replenishNutrients() {
    // Example: Replenish nutrients in random locations
    for (let i = 0; i < 10; i++) {
      // Number of replenishment pockets
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.addNutrient(x, y, config.REPLENISHMENT_AMOUNT);
    }
    console.log(`Nutrients replenished in 10 random locations`);
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
        if (nutrient > 0) {
          ctx.fillStyle = `rgba(0, 255, 0, ${nutrient / config.BASE_NUTRIENT})`; // Green with alpha based on nutrient level
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
   * Gets the nutrient level at a specific position.
   * @param x - X-coordinate.
   * @param y - Y-coordinate.
   * @returns The nutrient level at the specified position.
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
   * Renders the nutrient grid as a visualization.
   * @param ctx - The 2D rendering context of the main canvas.
   */
  public renderNutrientPackets(ctx: CanvasRenderingContext2D) {
    // This method is kept for compatibility with existing code
    // but no longer renders apples. The nutrient visualization
    // is now handled by making the hyphae trunks glow green.
  }
}
