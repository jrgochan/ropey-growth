// src/environmentGPU.ts

import { config } from './constants.js'; // Import the config object

/**
 * EnvironmentGPU class manages the environmental resources
 * such as nutrients that hypha tips consume.
 */
export class EnvironmentGPU {
  private width: number;
  private height: number;
  private nutrientGrid: number[][];

  /**
   * Constructor initializes the nutrient grid based on canvas dimensions.
   * @param width - Width of the canvas.
   * @param height - Height of the canvas.
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeNutrientGrid();
    if (config.DEBUG) {
      console.log(`EnvironmentGPU initialized with width: ${width}, height: ${height}`);
    }
  }

  /**
   * Initializes the nutrient grid with base nutrient levels.
   */
  private initializeNutrientGrid(): void {
    const cols = Math.ceil(this.width / config.ENV_GRID_CELL_SIZE);
    const rows = Math.ceil(this.height / config.ENV_GRID_CELL_SIZE);
    this.nutrientGrid = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => config.BASE_NUTRIENT)
    );
    if (config.DEBUG) {
      console.log(`Nutrient grid initialized with ${cols} columns and ${rows} rows.`);
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
      if (config.DEBUG) {
        console.log(`Consumed ${consumed} nutrients at (${x.toFixed(2)}, ${y.toFixed(2)}) [Grid: (${gridX}, ${gridY})]. Remaining: ${this.nutrientGrid[gridX][gridY].toFixed(2)}`);
      }
      return consumed;
    } else {
      if (config.DEBUG) {
        console.warn(`Hypha tip at (${x.toFixed(2)}, ${y.toFixed(2)}) is out of nutrient grid bounds.`);
      }
      return 0;
    }
  }

  /**
   * Adds nutrients to a specific location, e.g., during replenishment.
   * @param x - X-coordinate where nutrients are added.
   * @param y - Y-coordinate where nutrients are added.
   * @param amount - Amount of nutrient to add.
   */
  public addNutrient(x: number, y: number, amount: number): void {
    const gridX = Math.floor(x / config.ENV_GRID_CELL_SIZE);
    const gridY = Math.floor(y / config.ENV_GRID_CELL_SIZE);

    if (
      gridX >= 0 &&
      gridX < this.nutrientGrid.length &&
      gridY >= 0 &&
      gridY < this.nutrientGrid[0].length
    ) {
      this.nutrientGrid[gridX][gridY] += amount;
      if (config.DEBUG) {
        console.log(`Added ${amount} nutrients at (${x.toFixed(2)}, ${y.toFixed(2)}) [Grid: (${gridX}, ${gridY})]. Total: ${this.nutrientGrid[gridX][gridY].toFixed(2)}`);
      }
    } else {
      if (config.DEBUG) {
        console.warn(`Cannot add nutrients at (${x.toFixed(2)}, ${y.toFixed(2)}). Position is out of nutrient grid bounds.`);
      }
    }
  }

  /**
   * Handles nutrient diffusion across the grid.
   * This method should be called periodically to simulate nutrient spread.
   */
  public diffuseNutrients(): void {
    const cols = this.nutrientGrid.length;
    const rows = this.nutrientGrid[0].length;
    const newGrid: number[][] = Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => 0)
    );

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let total = this.nutrientGrid[x][y];
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
            total += this.nutrientGrid[nx][ny];
            count++;
          }
        }

        // Calculate average and apply diffusion rate
        newGrid[x][y] = this.nutrientGrid[x][y] + config.NUTRIENT_DIFFUSION * ((total / count) - this.nutrientGrid[x][y]);
      }
    }

    this.nutrientGrid = newGrid;
    if (config.DEBUG) {
      console.log(`Nutrients diffused across the grid.`);
    }
  }

  /**
   * Handles periodic replenishment of nutrients.
   * This method should be scheduled to run at intervals defined in config.
   */
  public replenishNutrients(): void {
    // Example: Replenish nutrients in random locations
    for (let i = 0; i < 10; i++) { // Number of replenishment pockets
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.addNutrient(x, y, config.REPLENISHMENT_AMOUNT);
    }
    if (config.DEBUG) {
      console.log(`Nutrients replenished.`);
    }
  }

  /**
   * Draws the nutrient grid onto the canvas for visualization.
   * This is optional and can be used for debugging purposes.
   * @param ctx - Canvas rendering context.
   */
  public drawNutrientGrid(ctx: CanvasRenderingContext2D): void {
    for (let x = 0; x < this.nutrientGrid.length; x++) {
      for (let y = 0; y < this.nutrientGrid[0].length; y++) {
        const nutrient = this.nutrientGrid[x][y];
        if (nutrient > 0) {
          ctx.fillStyle = `rgba(0, 255, 0, ${nutrient / config.BASE_NUTRIENT})`; // Green with alpha based on nutrient level
          ctx.fillRect(
            x * config.ENV_GRID_CELL_SIZE,
            y * config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE,
            config.ENV_GRID_CELL_SIZE
          );
        }
      }
    }
    if (config.DEBUG) {
      console.log(`Nutrient grid drawn on canvas.`);
    }
  }
}
